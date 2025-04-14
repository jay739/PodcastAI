from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
import pypdf
import pymupdf
from werkzeug.utils import secure_filename
from pdf_processor import analyze_pdf, chunk_text
from datetime import datetime, timedelta
from llm_service import generate_podcast_script
from tts_service import generate_audio

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

@app.route('/api/debug-pdf/<file_id>', methods=['GET'])
def debug_pdf(file_id):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}.pdf")
    
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    try:
        # Try PyMuPDF
        text_mupdf = ""
        try:
            doc = pymupdf.open(file_path)
            for page in doc:
                text_mupdf += page.get_text() + "\n"
            doc.close()
        except Exception as e:
            text_mupdf = f"PyMuPDF error: {str(e)}"
        
        # Try PyPDF
        text_pypdf = ""
        try:
            with pypdf.PdfReader(file_path) as pdf:
                for page in pdf.pages:
                    text_pypdf += page.extract_text() + "\n"
        except Exception as e:
            text_pypdf = f"PyPDF error: {str(e)}"
        
        return jsonify({
            "pymupdf_result": text_mupdf,
            "pypdf_result": text_pypdf,
            "file_size": os.path.getsize(file_path)
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyze/<file_id>', methods=['GET'])
def analyze_file(file_id):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}.pdf")
    print(f"Attempting to analyze: {file_path}")  # Debug log
    
    if not os.path.exists(file_path):
        print("File not found")  # Debug log
        return jsonify({"error": "File not found"}), 404
    
    try:
        analysis = analyze_pdf(file_path)
        print(f"Analysis results: {analysis}")  # Debug log
        return jsonify({
            "success": True,
            "analysis": analysis
        })
    except Exception as e:
        print(f"Analysis error: {str(e)}")  # Debug log
        return jsonify({
            "error": str(e),
            "fileId": file_id
        }), 500

@app.route('/api/generate', methods=['POST'])
def generate_podcast():
    print("Generation started")  # Debug log
    try:
        data = request.json
        file_id = data['fileId']
        print(f"Processing file: {file_id}")  # Debug log
        
        # Add progress updates
        def log_progress(step):
            print(f"STEP: {step}")  # Debug log
            # Optional: Emit SSE/webhook updates here

        log_progress("PDF analysis")
        analysis = analyze_pdf(f"uploads/{file_id}.pdf")
        analysis['chunks'] = chunk_text(analysis['full_text'])

        log_progress("LLM script generation")
        script_df = generate_podcast_script(analysis['chunks'])

        log_progress("TTS synthesis")
        generate_audio(script_df, f"outputs/{file_id}.mp3")

        print("Generation completed successfully")  # Debug log
        return jsonify({"success": True, "url": f"/api/audio/{file_id}.mp3"})

    except Exception as e:
        print(f"ERROR: {str(e)}")  # Debug log
        return jsonify({"error": str(e)}), 500

@app.route('/api/status/<jobId>', methods=['GET'])  # Changed from jobId to job_id
def get_status(jobId):  # Changed parameter name
    return jsonify({
        "jobId": jobId,  # You can keep this as jobId in response
        "status": "completed",
        "progress": 100,
        "resultUrl": f"/api/download/{jobId}"  # Changed from jobId to job_id
    })

@app.route('/api/download/<job_id>', methods=['GET'])
def download_podcast(job_id):  # Changed parameter name
    return jsonify({
        "url": f"/api/audio/{job_id}.mp3",  # Changed from jobId to job_id
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