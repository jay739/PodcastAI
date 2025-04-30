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
    
    fileID = str(uuid.uuid4())
    filename = secure_filename(f"{fileID}.pdf")
    file.save(os.path.join('uploads', filename))
    
    return jsonify({
        "success": True,
        "fileID": fileID,
        "filename": filename
    })

@file_blueprint.route('/analyze/<fileID>', methods=['GET'])
def analyze_file(fileID):
    file_path = os.path.join('uploads', f"{fileID}.pdf")
    
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    try:
        analysis = analyze_pdf(file_path)
        return jsonify({
        "success":True,
        "page_count": analysis.get("page_count", 0),
        "word_count": analysis.get("word_count", 0),
        "char_count": analysis.get("char_count", 0),
        "speakers": analysis.get("speakers", [])
    })
    except Exception as e:
        return jsonify({"error": str(e)}), 500