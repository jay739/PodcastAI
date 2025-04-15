import os
import uuid
from datetime import datetime, timedelta
from typing import Dict
from llm_service import generate_podcast_script
from tts_service import generate_audio

class PodcastService:
    def __init__(self, output_folder: str = 'outputs'):
        self.output_folder = output_folder
        os.makedirs(self.output_folder, exist_ok=True)

    def generate_podcast(self, file_id: str, config: Dict) -> Dict:
        """Orchestrate podcast generation pipeline"""
        job_id = str(uuid.uuid4())
        output_path = os.path.join(self.output_folder, f"{job_id}.mp3")

        # Step 1: Generate script
        script = generate_podcast_script(file_id, config)
        
        # Step 2: Generate audio
        generate_audio(script, output_path, config.get('voice_settings', {}))
        
        return {
            'job_id': job_id,
            'output_path': output_path,
            'expires_at': datetime.now() + timedelta(days=1),
            'download_url': f"/download/{job_id}"
        }

podcast_service = PodcastService()