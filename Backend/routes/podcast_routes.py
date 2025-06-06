from flask import Blueprint, jsonify, request
from services.podcast_service import podcast_service
from datetime import datetime, timedelta

podcast_blueprint = Blueprint('podcast', __name__)

@podcast_blueprint.route('/generate', methods=['POST'])
def generate_podcast():
    try:
        data = request.get_json(force=True)
        fileID = data['fileID']
        speakers = data.get('speakers', [])
        config = {
            "title": data.get("title", "Generated Podcast"),
            "hosts": [s["name"] for s in speakers[:2]],
            "guest": speakers[2]["name"] if len(speakers) > 2 else None
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