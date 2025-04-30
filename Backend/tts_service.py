import os
import sys
import torch
import numpy as np
import pandas as pd
import re
from datetime import datetime
from pydub import AudioSegment

# === STEP 1: ADD MARS5 PATH TO PYTHON PATH ===
MARS5_PATH = os.path.abspath("voice_models/MARS5-TTS")  # Adjust this if MARS5 is elsewhere
if MARS5_PATH not in sys.path:
    sys.path.append(MARS5_PATH)

# === STEP 2: IMPORT FROM MARS5 ===
from inference import TTSInference  # this is the correct path in MARS5-TTS

class MarsTTSGenerator:
    def __init__(self):
        checkpoint = os.path.join(MARS5_PATH, "checkpoints/mars5.pth")
        config = os.path.join(MARS5_PATH, "configs/mars5.yaml")
        device = "cuda" if torch.cuda.is_available() else "cpu"

        self.tts = TTSInference(
            checkpoint_path=checkpoint,
            config_path=config,
            device=device
        )

    def generate_segment(self, text: str, speaker_id: int = 0) -> AudioSegment:
        wav, sr = self.tts.infer(text, speaker_id=speaker_id)
        audio_array = (wav * 32767).astype(np.int16)
        return AudioSegment(
            audio_array.tobytes(),
            frame_rate=sr,
            sample_width=2,
            channels=1
        )


def parse_transcript(path: str) -> pd.DataFrame:
    with open(path, "r", encoding="utf-8") as f:
        lines = f.read().strip().splitlines()

    pattern = re.compile(r"^([\w\s\.\-]+):\s(.+)")
    conversation = []
    current_speaker, current_line = None, ""

    for line in lines:
        match = pattern.match(line)
        if match:
            if current_speaker:
                conversation.append((current_speaker, current_line.strip()))
            current_speaker = match.group(1).strip()
            current_line = match.group(2).strip()
        else:
            if current_speaker:
                current_line += " " + line

    if current_speaker:
        conversation.append((current_speaker, current_line.strip()))

    return pd.DataFrame(conversation, columns=["Name", "Dialogue"])


def generate_audio(script_df: pd.DataFrame, output_path: str) -> str:
    tts = MarsTTSGenerator()
    combined = AudioSegment.silent(duration=500)

    for _, row in script_df.iterrows():
        speaker = row["Name"]
        text = row["Dialogue"]
        print(f"🔊 {speaker}: {text[:40]}...")
        segment = tts.generate_segment(text)
        combined += segment + AudioSegment.silent(duration=300)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    combined.export(output_path, format="mp3", bitrate="192k")
    print(f"✅ Podcast saved: {output_path}")
    return output_path
