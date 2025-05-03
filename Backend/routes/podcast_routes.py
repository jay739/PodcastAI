from flask import Blueprint, jsonify, request
from services.podcast_service import podcast_service
from datetime import datetime, timedelta
import os
import json

podcast_blueprint = Blueprint('podcast', __name__)

@podcast_blueprint.route('/audio/<job_id>.mp3', methods=['GET'])
def stream_audio(job_id):
    audio_path = os.path.join("outputs", f"{job_id}.mp3")
    if not os.path.exists(audio_path):
        return "Audio not found", 404
    return send_file(audio_path, mimetype='audio/mpeg')


@podcast_blueprint.route('/arc/<job_id>.json', methods=['GET'])
def get_arc_json(job_id):
    arc_path = os.path.join("outputs", f"{job_id}_arc.json")
    if not os.path.exists(arc_path):
        return jsonify({"error": "ARC JSON not found"}), 404
    with open(arc_path) as f:
        return jsonify(json.load(f))

@podcast_blueprint.route('/transcript/<job_id>.md', methods=['GET'])
def get_transcript_md(job_id):
    transcript_path = os.path.join("outputs", f"{job_id}.md")
    if not os.path.exists(transcript_path):
        return "Transcript not available", 404
    return send_file(transcript_path, mimetype='text/markdown')

@podcast_blueprint.route('/generate', methods=['POST'])
def generate_podcast():
    try:
        data = request.get_json(force=True)
        fileID = data['fileID']
        speakers = data.get('speakers', [])
        config = {
            "title": data.get("title", "Generated Podcast"),
            "hosts": [s["name"] for s in speakers[:2]],
            "speakers": speakers,
            "guest": speakers[2]["name"] if len(speakers) > 2 else None,
            "tts_model": data.get("tts_model", "bark")
        }

        result = podcast_service.generate_podcast(fileID, config)

        return jsonify({
            "success": True,
            "job_id": result["fileID"],
            "transcript": result["transcript"],
            "audio_path": result["output_path"]
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "message": "Podcast generation failed"
        }), 500

@podcast_blueprint.route('/download/<job_id>', methods=['GET'])
def download_podcast(job_id):
    return jsonify({
        "url": f"/audio/{job_id}.mp3",
        "expires": (datetime.now() + timedelta(days=1)).isoformat()
    })