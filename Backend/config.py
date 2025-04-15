import os
from shared import load_dotenv

load_dotenv()

class Config:
    # Flask Server Configuration
    HOST = os.getenv('FLASK_HOST', 'localhost')
    PORT = int(os.getenv('FLASK_PORT', 5001))
    API_BASE_URL = f"http://{HOST}:{PORT}/api"
    
    # File Handling
    UPLOAD_FOLDER = 'uploads'
    OUTPUT_FOLDER = 'outputs'
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS = {'pdf'}
    
    # Security
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:8080').split(',')
    
    @staticmethod
    def init_app(app):
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

config = Config()