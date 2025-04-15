from flask import Blueprint, jsonify, request
from services.podcast_service import podcast_service
from datetime import datetime, timedelta
import os
import uuid
from pdf_processor import analyze_pdf 
from llm_service import generate_podcast_script
from tts_service import generate_audio

podcast_blueprint = Blueprint('podcast', __name__)

@podcast_blueprint.route('/generate', methods=['POST'])
def generate_podcast():
    try:
        data = request.json
        file_id = data['fileId']
        job_id = str(uuid.uuid4())
        
        # First analyze the PDF
        analysis = analyze_pdf(f"uploads/{file_id}.pdf")  # Now properly imported
        
        # Generate podcast script
        script_df = generate_podcast_script(analysis['chunks'])
        
        # Generate audio file
        output_path = f"outputs/{job_id}.mp3"
        generate_audio(script_df, output_path)
        
        return jsonify({
            "success": True,
            "jobId": job_id,
            "url": f"/download/{job_id}"
        })
    except Exception as e:
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