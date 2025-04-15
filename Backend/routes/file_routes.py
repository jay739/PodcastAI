from flask import Blueprint, jsonify, request
from services.file_service import file_service
from werkzeug.utils import secure_filename
import os
import uuid
from pdf_processor import analyze_pdf

file_blueprint = Blueprint('file', __name__)

@file_blueprint.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Only PDF files are allowed"}), 400
    
    file_id = str(uuid.uuid4())
    filename = secure_filename(f"{file_id}.pdf")
    file.save(os.path.join('uploads', filename))
    
    return jsonify({
        "success": True,
        "fileId": file_id,
        "filename": filename
    })

@file_blueprint.route('/analyze/<file_id>', methods=['GET'])
def analyze_file(file_id):
    file_path = os.path.join('uploads', f"{file_id}.pdf")
    
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    try:
        analysis = analyze_pdf(file_path)
        return jsonify({
            "success": True,
            "analysis": analysis
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500