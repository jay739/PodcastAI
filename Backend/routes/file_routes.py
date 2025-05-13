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
    try:
        info = file_service.save_uploaded_file(file)
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
    return jsonify({
        "success": True,
        "fileID": info['fileID'],
        "filename": info['filename']
    })

@file_blueprint.route('/analyze/<fileID>', methods=['GET'])
def analyze_file(fileID):
    file_path = os.path.join('uploads', f"{fileID}.pdf")
    
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    try:
        analysis = analyze_pdf(file_path)
        print("DEBUG: analysis output →", analysis)
        return jsonify({
        "success": True,
        "full_text": analysis.get("full_text", ""),
        "page_count": analysis.get("page_count", 0),
        "word_count": analysis.get("word_count", 0),
        "char_count": analysis.get("char_count", 0),
        "speakers": analysis.get("speakers", []),
        "top_keywords": [{"word": k, "count": v} for k, v in zip(analysis.get("keywords", []), analysis.get("keyword_counts", []))],
        "keyword_counts": analysis.get("keyword_counts", []),
        "sentiment": analysis.get("sentiment", {}),        # new
        "readability": analysis.get("readability", {}),    # new
        "entities": analysis.get("entities", []),          # new
        "diversity": analysis.get("diversity", None),
        "chunks": analysis.get("chunks", []),
        "chunk_sentiment": analysis.get("chunk_sentiment", []),
        "topics": analysis.get("topics", {}),
        "word_frequencies": analysis.get("word_frequencies", []),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500