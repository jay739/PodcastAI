from flask import Flask, request, send_file, jsonify
import os
from flask_cors import CORS
import uuid
from werkzeug.utils import secure_filename
from pydantic import BaseModel
from typing import Optional
import datetime

class GenerationConfig(BaseModel):
    voice: str
    speed: Optional[float] = 1.0
    tone: Optional[str] = "neutral"

app = Flask(__name__)
CORS(app)

# Upload route
@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    if not file.filename.endswith('.pdf'):
        return jsonify({"error": "Only PDF files are allowed"}), 400
    # Secure the filename
    file_id = str(uuid.uuid4())
    filename = secure_filename(f"{file_id}.pdf")
    file.save(os.path.join("uploads", filename))
    return jsonify({"fileId": file_id})

# Analyze route
@app.route('/analyze/<fileId>', methods=['GET'])
def analyze(fileId):
    # Validate fileId format
    try:
        uuid.UUID(fileId)
    except ValueError:
        return jsonify({"error": "Invalid file ID format"}), 400

    file_path = os.path.join("uploads", f"{fileId}.pdf")
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    try:
        # Here you would call your pdf_processor functions
        result = {
            "status": "analyzed", 
            "fileId": fileId,
            "metadata": {},  # Add actual metadata
            "text": ""       # Add extracted text
        }
        return jsonify(result)
    except Exception as e:
        app.logger.error(f"Analysis error for {fileId}: {str(e)}")
        return jsonify({"error": "Analysis failed"}), 500
    
# Generate podcast route
@app.route('/generate', methods=['POST'])
def generate():
    try:
        config = GenerationConfig(**request.json)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
        
    job_id = str(uuid.uuid4())
    # Store the config with the job_id for later processing
    return jsonify({"jobId": job_id})

# Job status route
@app.route('/status/<jobId>', methods=['GET'])
def status(jobId):
    # Simulate checking job status
    status = {"status": "completed", "jobId": jobId}
    return jsonify(status)

# Download podcast route
@app.route('/download/<jobId>', methods=['GET'])
def download(jobId):
    try:
        uuid.UUID(jobId)
    except ValueError:
        return jsonify({"error": "Invalid job ID"}), 400

    audio_path = os.path.join("outputs", f"podcast-{jobId}.mp3")
    
    if not os.path.exists(audio_path):
        # Instead of creating dummy file, return "processing" status
        return jsonify({
            "status": "processing",
            "message": "Your podcast is being generated",
            "estimatedWait": 300  # seconds
        }), 202
    
    return jsonify({
        "url": f"/static/{jobId}.mp3",
        "expires": (datetime.datetime.now() + datetime.timedelta(days=1)).isoformat()
    })

# Serve audio file
@app.route('/static/<jobId>.mp3')
def serve_audio(jobId):
    audio_path = f"outputs/podcast-{jobId}.mp3"
    if not os.path.exists(audio_path):
        return jsonify({"error": "File not found"}), 404
    return send_file(audio_path, mimetype='audio/mpeg')

# Default home route
@app.route('/')
def home():
    return "Welcome to the Podcast Generator API!"

if __name__ == '__main__':
    # Ensure directories exist
    os.makedirs('uploads', exist_ok=True)
    os.makedirs('outputs', exist_ok=True)

    # Start the Flask app
    app.run(host='0.0.0.0',port=5001,debug=True)
