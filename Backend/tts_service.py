import os
import re
import pandas as pd
import torch
import numpy as np
from typing import Dict
from datetime import datetime
from pydub import AudioSegment

from services.transcript_utils import parse_transcript
from services.tts_bark import BarkTTSGenerator
from services.tts_coqui import CoquiXTTSGenerator
from services.tts_kokoro import KokoroTTSGenerator

# Dispatcher for model selection
def get_tts_generator(model: str):
    if model == "xtts":
        return CoquiXTTSGenerator()
    elif model == "kokoro":
        return KokoroTTSGenerator()
    else:
        return BarkTTSGenerator()  # default to Bark Small

# Optional filter to clean system-like dialogue lines
def remove_system_like_lines(df: pd.DataFrame) -> pd.DataFrame:
    patterns = [
        r"strictly adheres to", r"this transcript", r"this concludes",
        r"above discussion", r"maintaining professionalism",
        r"generated podcast follows", r"structure and format outlined",
        r"for further engagement", r"leave room for reflection",
        r"this summary was prepared by"
    ]
    def is_unwanted(text): return any(re.search(pat, text.lower()) for pat in patterns)
    return df[~df["Dialogue"].apply(is_unwanted)].reset_index(drop=True)

# Main audio synthesis function
def synthesize_podcast_audio(script_df: pd.DataFrame, output_path: str, speakers_config: Dict[str, Dict[str, str]], tts_model: str = "bark") -> str:
    tts = get_tts_generator(tts_model)
    combined = AudioSegment.silent(duration=500)

    # Load background music if present
    bg_music_path = "assets/bg_music.mp3"
    if os.path.exists(bg_music_path):
        raw_bg = AudioSegment.from_file(bg_music_path).low_pass_filter(2000) - 20
    else:
        raw_bg = AudioSegment.silent(duration=5000)

    script_df = remove_system_like_lines(script_df)
    if script_df.empty:
        raise ValueError("Transcript is empty after filtering")

    for i, row in script_df.iterrows():
        speaker = row["Name"]
        dialogue = row["Dialogue"]

        gender = speakers_config.get(speaker, {}).get("gender", "male")
        tone = speakers_config.get(speaker, {}).get("tone", "neutral")

        timestamp = f"[{(i * 30) // 60:02d}:{(i * 30) % 60:02d}]"
        timestamp_audio = tts.generate_segment(timestamp, gender, tone, speaker_name=speaker)

        print(f"🔊 {speaker} ({gender}, {tone}): {dialogue[:40]}...")
        segment = tts.generate_segment(dialogue, gender, tone, speaker_name=speaker)

        combined += timestamp_audio + segment + AudioSegment.silent(duration=300)

    # Match background music length and overlay
    loops = int(len(combined) / len(raw_bg)) + 1
    background = (raw_bg * loops)[:len(combined)]
    final_mix = background.overlay(combined, gain_during_overlay=-10)

    # Export result
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final_mix.export(output_path, format="mp3", bitrate="192k")
    print(f"✅ Podcast saved: {output_path}")
    return output_path
