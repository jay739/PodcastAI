import os
import uuid
from typing import Dict
from werkzeug.utils import secure_filename
from pdf_processor import analyze_pdf
from config import Config

class FileService:
    def __init__(self, upload_folder: str = Config.UPLOAD_FOLDER):
        self.upload_folder = upload_folder
        os.makedirs(self.upload_folder, exist_ok=True)

    def save_uploaded_file(self, file) -> Dict:
        """Handle file upload and return file metadata"""
        if not file.filename.lower().endswith('.pdf'):
            raise ValueError("Only PDF files are allowed")
        if file.content_length > 10 * 1024 * 1024:  
            raise ValueError("File too large")

        fileID = str(uuid.uuid4())
        filename = secure_filename(f"{fileID}.pdf")
        file_path = os.path.join(self.upload_folder, filename)
        file.save(file_path)

        return {
            'fileID': fileID,
            'filename': filename,
            'file_path': file_path,
            'file_size': os.path.getsize(file_path)
        }

    def analyze_pdf_file(self, fileID: str) -> Dict:
        """Analyze a PDF file and return structured data"""
        file_path = os.path.join(self.upload_folder, f"{fileID}.pdf")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file {fileID} not found")

        return analyze_pdf(file_path)
        

file_service = FileService()