"""Headless web service for the public PDF-to-Podcast tool on the portfolio.

Mounted as a parallel namespace alongside the existing Electron-facing /api/* routes.
The Electron client keeps using /api/* on port 5001 (run separately, unchanged).
This service exposes /web/v1/* on its own port (default 5050) for portfolio.jay739.dev.

Endpoints
---------
POST /web/v1/jobs            multipart: file=PDF, json speakers config -> { job_id }
GET  /web/v1/jobs/<id>       -> { status, progress, transcript?, audio_url?, error? }
GET  /web/v1/jobs/<id>/audio -> streams MP3
GET  /web/v1/health          -> liveness + queue depth

Constraints
-----------
- One concurrent generation (Mac Mini is single-GPU; matches ComfyUI's single-tenant model).
- IP rate-limit: 1 active job per IP per 15 min window.
- CORS locked to PODCAST_WEB_ORIGINS (comma-separated allowlist).
"""

from __future__ import annotations

import json
import os
import sys
import threading
import time
import uuid
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional

from flask import Flask, Response, jsonify, request, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Allow importing the sibling modules (pdf_processor, services.*, etc.)
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

# podcast_service and pdf_processor use cwd-relative paths like "uploads/<id>.pdf"
# and "outputs/<id>.mp3", so we chdir to Backend/ before anything else.
os.chdir(BACKEND_DIR)

from config import Config  # noqa: E402
from services.podcast_service import podcast_service  # noqa: E402

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
WEB_HOST = os.getenv("PODCAST_WEB_HOST", "127.0.0.1")
WEB_PORT = int(os.getenv("PODCAST_WEB_PORT", "5050"))

# Comma-separated allowlist. Default to portfolio + localhost for dev.
_default_origins = "https://jay739.dev,https://www.jay739.dev,http://localhost:3000"
WEB_ORIGINS = [o.strip() for o in os.getenv("PODCAST_WEB_ORIGINS", _default_origins).split(",") if o.strip()]

RATE_LIMIT_WINDOW_S = int(os.getenv("PODCAST_RATE_WINDOW_S", "900"))  # 15 min
RATE_LIMIT_MAX_JOBS = int(os.getenv("PODCAST_RATE_MAX", "1"))         # per IP per window
MAX_UPLOAD_BYTES = int(os.getenv("PODCAST_MAX_UPLOAD_BYTES", str(50 * 1024 * 1024)))  # 50 MB
JOB_TTL_S = int(os.getenv("PODCAST_JOB_TTL_S", "21600"))              # 6h job retention

UPLOAD_DIR = Path(os.getenv("UPLOAD_FOLDER", str(BACKEND_DIR / "uploads")))
OUTPUT_DIR = Path(os.getenv("OUTPUT_FOLDER", str(BACKEND_DIR / "outputs")))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# -----------------------------------------------------------------------------
# In-process job tracker
# -----------------------------------------------------------------------------
@dataclass
class Job:
    job_id: str
    file_id: str
    status: str = "queued"   # queued | running | done | error
    progress: int = 0
    transcript: Optional[str] = None
    audio_filename: Optional[str] = None
    error: Optional[str] = None
    created_at: float = field(default_factory=time.time)
    finished_at: Optional[float] = None
    client_ip: str = "0.0.0.0"

    def to_public(self) -> dict:
        audio_url = f"/web/v1/jobs/{self.job_id}/audio" if self.audio_filename else None
        return {
            "job_id": self.job_id,
            "status": self.status,
            "progress": self.progress,
            "transcript": self.transcript,
            "audio_url": audio_url,
            "error": self.error,
            "created_at": self.created_at,
            "finished_at": self.finished_at,
        }


_jobs: dict[str, Job] = {}
_jobs_lock = threading.Lock()
_gen_lock = threading.Lock()  # global: one generation at a time
_recent_ip_jobs: dict[str, deque[float]] = {}
_recent_lock = threading.Lock()


def _gc_jobs() -> None:
    """Drop jobs older than JOB_TTL_S; also delete the audio file."""
    cutoff = time.time() - JOB_TTL_S
    with _jobs_lock:
        stale = [jid for jid, j in _jobs.items() if (j.finished_at or j.created_at) < cutoff]
        for jid in stale:
            j = _jobs.pop(jid)
            if j.audio_filename:
                try:
                    (OUTPUT_DIR / j.audio_filename).unlink(missing_ok=True)
                except OSError:
                    pass


def _record_ip_job(ip: str) -> None:
    with _recent_lock:
        dq = _recent_ip_jobs.setdefault(ip, deque())
        dq.append(time.time())


def _ip_is_throttled(ip: str) -> bool:
    cutoff = time.time() - RATE_LIMIT_WINDOW_S
    with _recent_lock:
        dq = _recent_ip_jobs.get(ip)
        if not dq:
            return False
        while dq and dq[0] < cutoff:
            dq.popleft()
        return len(dq) >= RATE_LIMIT_MAX_JOBS


def _client_ip() -> str:
    # We're behind nginx-proxy-manager + the portfolio Next.js proxy on the VPS,
    # which both pass X-Forwarded-For. Trust the first value.
    fwd = request.headers.get("X-Forwarded-For", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.remote_addr or "0.0.0.0"


# -----------------------------------------------------------------------------
# Worker
# -----------------------------------------------------------------------------
def _friendly_error(raw: str) -> str:
    """Map a raw exception string to a user-facing message."""
    low = raw.lower()
    if "timed out" in low or "timeout" in low:
        return ("The language model timed out — it may be cold-loading or the "
                "GPU is busy. Please try again in a minute.")
    if "unreachable" in low or "connection" in low or "ollama" in low:
        return "The local LLM service was unreachable. Please try again shortly."
    if "topic generation failed" in low:
        return ("Transcript generation failed — the model returned nothing. "
                "Try again, or try a shorter PDF.")
    if "no such file" in low or "fitz" in low or "pdf" in low:
        return "Could not read that PDF. Try a different file (text-based, not scanned)."
    if "empty" in low and "transcript" in low:
        return "The generated transcript was empty. Try a PDF with more readable text."
    # Fall back to a trimmed raw message rather than something opaque.
    return f"Generation failed: {raw[:200]}"


def _run_job(job_id: str, speakers: list, title: str, tts_model: str, llm_model: str) -> None:
    job = _jobs[job_id]
    acquired = _gen_lock.acquire(timeout=600)
    if not acquired:
        job.status = "error"
        job.error = "Server busy: waited 10 min for GPU slot"
        job.finished_at = time.time()
        return
    try:
        job.status = "running"
        job.progress = 5

        cfg = {
            "title": title,
            "hosts": [s["name"] for s in speakers[:2]],
            "guest": speakers[2]["name"] if len(speakers) > 2 else None,
            "speakers": speakers,
            "language": "en",
            "tts_model": tts_model,
            # OllamaLLMProvider also reads OLLAMA_MODEL from env; pin per-job here:
            "llm_model_name": llm_model,
        }
        # Make the env see the per-job model name so the provider's default picks it up.
        os.environ["OLLAMA_MODEL"] = llm_model

        # podcast_service.generate_podcast is synchronous and writes files into OUTPUT_FOLDER.
        # It returns {"fileID", "transcript", "output_path"}.
        result = podcast_service.generate_podcast(job.file_id, cfg)

        out_path = Path(result["output_path"])
        # We expose just the filename; the audio endpoint resolves it under OUTPUT_DIR.
        job.audio_filename = out_path.name
        job.transcript = result.get("transcript")
        job.progress = 100
        job.status = "done"
    except Exception as exc:  # podcast_service can raise broad errors
        import traceback
        traceback.print_exc()
        job.status = "error"
        job.error = _friendly_error(str(exc))
    finally:
        job.finished_at = time.time()
        _gen_lock.release()
        _gc_jobs()


# -----------------------------------------------------------------------------
# Flask app
# -----------------------------------------------------------------------------
app = Flask(__name__)
app.config.from_object(Config)
app.config["UPLOAD_FOLDER"] = str(UPLOAD_DIR)
app.config["OUTPUT_FOLDER"] = str(OUTPUT_DIR)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES

CORS(
    app,
    resources={r"/web/v1/*": {"origins": WEB_ORIGINS}},
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
    max_age=600,
)


@app.get("/web/v1/health")
def health():
    with _jobs_lock:
        active = sum(1 for j in _jobs.values() if j.status in {"queued", "running"})
    return jsonify({
        "ok": True,
        "active_jobs": active,
        "tracked_jobs": len(_jobs),
        "concurrency_held": _gen_lock.locked(),
        "now": datetime.utcnow().isoformat() + "Z",
    })


@app.post("/web/v1/jobs")
def create_job():
    ip = _client_ip()
    _gc_jobs()

    if _ip_is_throttled(ip):
        return jsonify({
            "error": "rate_limited",
            "detail": f"At most {RATE_LIMIT_MAX_JOBS} job(s) per {RATE_LIMIT_WINDOW_S // 60} min from your IP.",
        }), 429

    # One active job globally — match ComfyUI semantics.
    with _jobs_lock:
        active = sum(1 for j in _jobs.values() if j.status in {"queued", "running"})
    if active >= 1:
        return jsonify({
            "error": "server_busy",
            "detail": "Another podcast is generating. Try again in a couple of minutes.",
        }), 503

    if "file" not in request.files:
        return jsonify({"error": "missing_file", "detail": "Send a multipart 'file' field."}), 400

    f = request.files["file"]
    if not f.filename or not f.filename.lower().endswith(".pdf"):
        return jsonify({"error": "bad_file", "detail": "Only PDF uploads are accepted."}), 400

    # Speakers + title come as a JSON string in the 'config' field.
    cfg_raw = request.form.get("config", "{}")
    try:
        cfg = json.loads(cfg_raw)
    except json.JSONDecodeError:
        return jsonify({"error": "bad_config", "detail": "config must be JSON."}), 400

    speakers = cfg.get("speakers") or [
        {"name": "Jamie", "gender": "female", "tone": "warm"},
        {"name": "Taylor", "gender": "male", "tone": "neutral"},
    ]
    title = (cfg.get("title") or "Generated Podcast").strip()[:120]

    # Defensive: cap speaker count to keep TTS time bounded.
    if not isinstance(speakers, list) or len(speakers) < 2 or len(speakers) > 3:
        return jsonify({"error": "bad_speakers", "detail": "Provide 2 or 3 speakers."}), 400

    # TTS / LLM choice from the request, whitelisted. Falls back to env defaults.
    tts_choice = (cfg.get("tts_model") or os.getenv("PODCAST_WEB_TTS", "piper")).strip().lower()
    if tts_choice not in {"piper", "kokoro-real", "bark"}:
        return jsonify({"error": "bad_tts", "detail": "tts_model must be one of: piper, kokoro-real, bark."}), 400
    # llama3.2:3b is the safe default — it fits in RAM on the 16 GB Mac Mini
    # with zero swap pressure, so cold starts don't blow the LLM timeout.
    llm_choice = (cfg.get("llm_model") or os.getenv("OLLAMA_MODEL", "llama3.2:3b")).strip()

    file_id = str(uuid.uuid4())
    save_path = UPLOAD_DIR / secure_filename(f"{file_id}.pdf")
    f.save(save_path)
    if save_path.stat().st_size == 0:
        save_path.unlink(missing_ok=True)
        return jsonify({"error": "empty_file"}), 400

    job_id = file_id  # reuse uuid so existing podcast_service output filenames line up
    job = Job(job_id=job_id, file_id=file_id, client_ip=ip)
    with _jobs_lock:
        _jobs[job_id] = job
    _record_ip_job(ip)

    threading.Thread(
        target=_run_job,
        args=(job_id, speakers, title, tts_choice, llm_choice),
        name=f"podcast-{job_id[:8]}",
        daemon=True,
    ).start()

    return jsonify({"job_id": job_id, "status": "queued"}), 202


@app.get("/web/v1/jobs/<job_id>")
def get_job(job_id: str):
    with _jobs_lock:
        job = _jobs.get(job_id)
    if not job:
        return jsonify({"error": "not_found"}), 404
    return jsonify(job.to_public())


@app.get("/web/v1/jobs/<job_id>/audio")
def get_audio(job_id: str):
    with _jobs_lock:
        job = _jobs.get(job_id)
    if not job or not job.audio_filename:
        return jsonify({"error": "not_ready"}), 404
    audio_path = OUTPUT_DIR / job.audio_filename
    if not audio_path.is_file():
        return jsonify({"error": "audio_missing"}), 404
    return send_file(str(audio_path), mimetype="audio/mpeg", conditional=True)


if __name__ == "__main__":
    # Threaded so background workers can run alongside the request loop.
    app.run(host=WEB_HOST, port=WEB_PORT, threaded=True, debug=False)
