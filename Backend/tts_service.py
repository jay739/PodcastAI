import pandas as pd
import os
import subprocess
from pydub import AudioSegment

VOICE_MODEL_DIR = "voice_models"
os.makedirs(VOICE_MODEL_DIR, exist_ok=True)

# Map characters to voice models
VOICE_MODELS = {
    "male": os.path.join(VOICE_MODEL_DIR, "en_US-lessac-medium.onnx"),
    "female": os.path.join(VOICE_MODEL_DIR, "en_US-amy-medium.onnx")
}

def run_piper(text, voice_path, output_path):
    """Call Piper CLI to synthesize speech"""
    if not os.path.exists(voice_path):
        raise FileNotFoundError(f"Voice model not found at {voice_path}. Please download the required voice models.")
    subprocess.run([
        "./piper",  # Make sure piper binary is in same directory or update path
        "--model", voice_path,
        "--output_file", output_path,
        "--text", text
    ], check=True)

def generate_audio(script_df: pd.DataFrame, output_path: str, background_music: bool = False):
    """Generate audio using Piper CLI"""
    combined = AudioSegment.silent(duration=0)
    
    for _, row in script_df.iterrows():
        voice_type = "male" if row["Name"] == "Host" else "female"
        voice_model = VOICE_MODELS[voice_type]
        temp_wav = f"temp_{row['Order']}.wav"

        run_piper(row["Dialogue"], voice_model, temp_wav)
        
        segment = AudioSegment.from_wav(temp_wav)
        combined += segment + AudioSegment.silent(duration=500)
        os.remove(temp_wav)
    
    if background_music:
        music = AudioSegment.from_mp3("assets/bg_music.mp3") - 10
        combined = combined.overlay(music, loop=True)

    combined.export(output_path, format="mp3")
