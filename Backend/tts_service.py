import os
import re
import torch
import numpy as np
import pandas as pd
from pydub import AudioSegment
from datetime import datetime
from bark import generate_audio as bark_generate_audio, preload_models
from bark.generation import SAMPLE_RATE
from services.transcript_utils import parse_transcript
import inspect
import random
from typing import Dict

# Device setup for MPS / CPU / CUDA
device = torch.device("mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu")

# Allow unsafe globals (needed for newer PyTorch)
torch.serialization.add_safe_globals([
    np.core.multiarray.scalar,
    np.dtype,
    np.dtypes.Float64DType
])

# Preload Bark models with device awareness
preload_models(
    text_use_gpu=(device.type != "cpu"),
    coarse_use_gpu=(device.type != "cpu"),
    fine_use_gpu=(device.type != "cpu"),
    codec_use_gpu=(device.type != "cpu")
)

class BarkTTSGenerator:
    def __init__(self):
        self.voice_presets = {
            "male_positive": ["v2/en_speaker_6", "v2/en_speaker_7"],
            "male_serious": ["v2/en_speaker_2"],
            "male_neutral": ["v2/en_speaker_4"],
            "female_positive": ["v2/en_speaker_1", "v2/en_speaker_3"],
            "female_skeptical": ["v2/en_speaker_5"],
            "female_neutral": ["v2/en_speaker_8"]
        }
        self.speaker_voice_map = {}  # 🧠 Ensures consistent voice per speaker

    def generate_segment(self, text: str, gender: str = "male", tone: str = "neutral", speaker_name: str = "unknown") -> AudioSegment:
        key = f"{gender.lower()}_{tone.lower()}"

        # 🔄 Choose a preset once per speaker
        if speaker_name not in self.speaker_voice_map:
            options = self.voice_presets.get(key, ["v2/en_speaker_9"])
            chosen = random.choice(options)
            self.speaker_voice_map[speaker_name] = chosen
            print(f"🎙️ Assigned {chosen} to speaker '{speaker_name}' ({gender}, {tone})")

        preset = self.speaker_voice_map[speaker_name]

        with torch.no_grad():
            with torch.autocast(device_type=device.type, dtype=torch.float16 if device.type == "mps" else torch.float32):
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
        r"strictly adheres to", r"this transcript", r"this concludes",
        r"above discussion", r"maintaining professionalism",
        r"generated podcast follows", r"structure and format outlined",
        r"for further engagement", r"leave room for reflection",
        r"this summary was prepared by"
    ]
    def is_unwanted(text): return any(re.search(pat, text.lower()) for pat in patterns)
    return df[~df["Dialogue"].apply(is_unwanted)].reset_index(drop=True)

def synthesize_podcast_audio(script_df: pd.DataFrame, output_path: str, speakers_config: Dict[str, Dict[str, str]]) -> str:
    tts = BarkTTSGenerator()
    combined = AudioSegment.silent(duration=500)

    # Load background music
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

    # Loop background music to match combined audio length
    loops = int(len(combined) / len(raw_bg)) + 1
    background = (raw_bg * loops)[:len(combined)]

    # Overlay speech on music with ducking
    final_mix = background.overlay(combined, gain_during_overlay=-10)

    # Export final audio
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final_mix.export(output_path, format="mp3", bitrate="192k")
    print(f"✅ Podcast saved: {output_path}")
    return output_path
