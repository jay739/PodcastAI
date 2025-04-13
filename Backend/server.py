from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
from werkzeug.utils import secure_filename
from pdf_processor import analyze_pdf
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'outputs'

# Ensure directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Only PDF files are allowed"}), 400
    
    file_id = str(uuid.uuid4())
    filename = secure_filename(f"{file_id}.pdf")
    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    
    return jsonify({
        "success": True,
        "fileId": file_id,
        "filename": filename
    })

@app.route('/api/analyze/<file_id>', methods=['GET'])
def analyze_file(file_id):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}.pdf")
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    try:
        analysis = analyze_pdf(file_path)
        return jsonify({
            "success": True,
            "analysis": analysis
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "fileId": file_id
        }), 500

@app.route('/api/generate', methods=['POST'])
def generate_podcast():
    data = request.json
    if not data or 'fileId' not in data:
        return jsonify({"error": "Invalid request"}), 400
    
    job_id = str(uuid.uuid4())
    # In a real app, you would queue this for processing
    return jsonify({
        "success": True,
        "jobId": job_id,
        "status": "queued"
    })

@app.route('/api/status/<job_id>', methods=['GET'])
def get_status(job_id):
    # Mock status response
    return jsonify({
        "jobId": job_id,
        "status": "completed",
        "progress": 100,
        "resultUrl": f"/api/download/{job_id}"
    })

@app.route('/api/download/<job_id>', methods=['GET'])
def download_podcast(job_id):
    # In a real app, you would serve the generated file
    return jsonify({
        "url": f"/api/audio/{job_id}.mp3",
        "expires": (datetime.now() + timedelta(days=1)).isoformat()
    })

@app.route('/api/audio/<filename>', methods=['GET'])
def serve_audio(filename):
    # Mock audio response
    return send_file(
        "sample.mp3",  # Replace with actual file path
        mimetype='audio/mpeg',
        as_attachment=False
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)