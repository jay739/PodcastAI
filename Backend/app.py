from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
import pypdf
import fitz
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from routes.file_routes import file_blueprint
from config import Config
from pdf_processor import analyze_pdf, chunk_text
from tts_service import synthesize_podcast_audio
from services.podcast_service import podcast_service

app = Flask(__name__)
CORS(app)

app.config.from_object(Config)
app.register_blueprint(file_blueprint, url_prefix='/api')

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

@app.route('/api/upload', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        filename = secure_filename(file.filename)
        file_id = str(uuid.uuid4())
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}.pdf")
        file.save(save_path)

        return jsonify({"success": True, "fileID": file_id, "filename": filename})


@app.route('/api/debug-pdf/<fileID>', methods=['GET'])
def debug_pdf(fileID):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{fileID}.pdf")
    
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    try:
        text_mupdf = ""
        try:
            doc = fitz.open(file_path)
            for page in doc:
                text_mupdf += page.get_text() + "\n"
            doc.close()
        except Exception as e:
            text_mupdf = f"PyMuPDF error: {str(e)}"
        
        text_pypdf = ""
        try:
            pdf = pypdf.PdfReader(file_path)
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

@app.route('/api/generate', methods=['POST'])
def generate_podcast():
    print("Generation started")
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

        print("Generation completed successfully")
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

@app.route('/api/status/<job_id>', methods=['GET'])  
def get_status(job_id):  
    return jsonify({
        "job_id": job_id,  
        "status": "completed",
        "progress": 100,
        "resultUrl": f"/api/download/{job_id}"  
    })

@app.route('/api/download/<job_id>', methods=['GET'])
def download_podcast(job_id): 
    return jsonify({
        "url": f"/api/audio/{job_id}.mp3",
        "expires": (datetime.now() + timedelta(days=1)).isoformat()
    })

@app.route('/api/audio/<filename>', methods=['GET'])
def serve_audio(filename):
    audio_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    if not os.path.exists(audio_path):
        return jsonify({"error": "Audio file not found"}), 404
    return send_file(
        audio_path,
        mimetype='audio/mpeg',
        as_attachment=False
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
