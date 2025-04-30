import os
import re
import torch
import numpy as np
import pandas as pd
from pydub import AudioSegment
from datetime import datetime
from bark import generate_audio as bark_generate_audio, preload_models
from bark.generation import SAMPLE_RATE
from services.transcript_utils import parse_transcript  # ✅ Use shared utility
import inspect

# Allow unsafe globals (needed for newer PyTorch)
torch.serialization.add_safe_globals([
    np.core.multiarray.scalar,
    np.dtype,
    np.dtypes.Float64DType
])

# Preload Bark models
preload_models(
    text_use_gpu=torch.cuda.is_available(),
    coarse_use_gpu=torch.cuda.is_available(),
    fine_use_gpu=torch.cuda.is_available(),
    codec_use_gpu=torch.cuda.is_available()
)

class BarkTTSGenerator:
    def __init__(self):
        self.voice_presets = {
            "male": "v2/en_speaker_6",        # e.g., positive
            "female": "v2/en_speaker_1",    # e.g., skeptical
        }

    def generate_segment(self, text: str, speaker: str) -> AudioSegment:
        preset = self.voice_presets.get(speaker.lower(), "v2/en_speaker_9")
        if "history_prompt" in inspect.signature(bark_generate_audio).parameters:
            audio_array = bark_generate_audio(text, history_prompt=preset)
        else:
            audio_array = bark_generate_audio(text)
        audio_int16 = (audio_array * 32767).astype(np.int16)

        return AudioSegment(
            audio_int16.tobytes(),
            frame_rate=SAMPLE_RATE,
            sample_width=2,
            channels=1
        )

def remove_system_like_lines(df: pd.DataFrame) -> pd.DataFrame:
    patterns = [
        r"strictly adheres to",
        r"this transcript",
        r"this concludes",
        r"above discussion",
        r"maintaining professionalism",
        r"generated podcast follows",
        r"structure and format outlined",
        r"for further engagement",
        r"leave room for reflection",
        r"this summary was prepared by"
    ]
    def is_unwanted(text): return any(re.search(pat, text.lower()) for pat in patterns)
    return df[~df["Dialogue"].apply(is_unwanted)].reset_index(drop=True)

def synthesize_podcast_audio(script_df: pd.DataFrame, output_path: str) -> str:
    tts = BarkTTSGenerator()
    combined = AudioSegment.silent(duration=500)

    # Optional background music
    bg_music_path = "assets/bg_music.mp3"
    if os.path.exists(bg_music_path):
        background = AudioSegment.from_file(bg_music_path).low_pass_filter(2000) - 20
    else:
        background = AudioSegment.silent(duration=5000)

    script_df = remove_system_like_lines(script_df)
    if script_df.empty:
        raise ValueError("Transcript is empty after filtering")

    for i, row in script_df.iterrows():
        speaker = row["Name"]
        dialogue = row["Dialogue"]

        # Generate timestamp
        timestamp = f"[{(i * 30) // 60:02d}:{(i * 30) % 60:02d}]"
        timestamp_audio = tts.generate_segment(timestamp, speaker)

        print(f"🔊 {speaker}: {dialogue[:40]}...")
        segment = tts.generate_segment(dialogue, speaker)

        combined += timestamp_audio + segment + AudioSegment.silent(duration=300)

    # Mix with background music
    if len(background) > len(combined):
        combined = background.overlay(combined)
    else:
        combined = combined.overlay(background)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    combined.export(output_path, format="mp3", bitrate="192k")
    print(f"✅ Podcast saved: {output_path}")
    return output_path
