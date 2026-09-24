# services/tts_piper.py
#
# Piper TTS — fast, CPU-friendly, ONNX-based. ~10x realtime on the M4.
# Voice models live under ~/piper-bin/voices/<voice_name>/<voice_name>.onnx
# plus a .onnx.json config file.
#
# Per-speaker voice routing falls back to a reasonable default if a
# specific voice isn't downloaded — installation can grow over time
# without breaking generation.

import io
import os
from pathlib import Path
from typing import Optional

from pydub import AudioSegment


# Resolve voice models from PIPER_VOICES_DIR (default: ~/piper-bin/voices)
_VOICES_DIR = Path(os.getenv("PIPER_VOICES_DIR", os.path.expanduser("~/piper-bin/voices")))

# Gender-tone presets. Each value is a voice slug looked up under _VOICES_DIR.
# All of these may not be installed; the resolver falls back to "en_US-amy-low".
_PRESETS: dict[str, str] = {
    "male_positive":   "en_US-ryan-medium",
    "male_serious":    "en_US-ryan-medium",
    "male_neutral":    "en_US-ryan-medium",
    "female_positive": "en_US-amy-medium",
    "female_skeptical": "en_US-amy-medium",
    "female_neutral":  "en_US-amy-low",
}
_FALLBACK_VOICE = "en_US-amy-low"


def _voice_path(slug: str) -> Path:
    """Return the .onnx file for `slug`, falling back if missing."""
    cand = _VOICES_DIR / slug / f"{slug}.onnx"
    if cand.is_file():
        return cand
    fb = _VOICES_DIR / _FALLBACK_VOICE / f"{_FALLBACK_VOICE}.onnx"
    return fb


class PiperTTSGenerator:
    """Piper backend. One PiperVoice instance per slug, cached across calls."""

    def __init__(self):
        from piper import PiperVoice  # imported lazily so test imports don't pull onnxruntime
        self._PiperVoice = PiperVoice
        self._voices: dict[str, "PiperVoice"] = {}
        self._speaker_voice_map: dict[str, str] = {}

    def _resolve_voice_slug(self, gender: str, tone: str, speaker_name: str) -> str:
        if speaker_name in self._speaker_voice_map:
            return self._speaker_voice_map[speaker_name]
        key = f"{gender.lower()}_{tone.lower()}"
        slug = _PRESETS.get(key, _FALLBACK_VOICE)
        self._speaker_voice_map[speaker_name] = slug
        return slug

    def _get_voice(self, slug: str):
        if slug not in self._voices:
            path = _voice_path(slug)
            self._voices[slug] = self._PiperVoice.load(str(path))
        return self._voices[slug]

    def generate_segment(
        self,
        text: str,
        gender: str = "male",
        tone: str = "neutral",
        speaker_name: str = "unknown",
    ) -> AudioSegment:
        slug = self._resolve_voice_slug(gender, tone, speaker_name)
        voice = self._get_voice(slug)

        # piper-tts 1.x: synthesize() yields AudioChunk objects with raw int16 PCM.
        # Concatenate them and build an AudioSegment directly — no wave wrapper needed.
        pcm_parts: list[bytes] = []
        sample_rate = 16000
        sample_width = 2
        sample_channels = 1
        for chunk in voice.synthesize(text):
            pcm_parts.append(chunk.audio_int16_bytes)
            sample_rate = chunk.sample_rate
            sample_width = chunk.sample_width
            sample_channels = chunk.sample_channels

        if not pcm_parts:
            return AudioSegment.silent(duration=200)

        return AudioSegment(
            b"".join(pcm_parts),
            frame_rate=sample_rate,
            sample_width=sample_width,
            channels=sample_channels,
        )
