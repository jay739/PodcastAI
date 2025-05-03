# services/tts_bark.py
import torch
import random
import inspect
from typing import Dict
from pydub import AudioSegment
from bark import generate_audio as bark_generate_audio, preload_models
from bark.generation import SAMPLE_RATE

# Setup device
device = torch.device("mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu")

# Allow unsafe globals
torch.serialization.add_safe_globals([
    torch.float64, torch.float32, torch.int32
])

# Preload Bark Small models
preload_models(
    use_small=True,
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
        self.speaker_voice_map = {}

    def generate_segment(self, text: str, gender: str = "male", tone: str = "neutral", speaker_name: str = "unknown") -> AudioSegment:
        key = f"{gender.lower()}_{tone.lower()}"
        if speaker_name not in self.speaker_voice_map:
            options = self.voice_presets.get(key, ["v2/en_speaker_9"])
            self.speaker_voice_map[speaker_name] = random.choice(options)

        preset = self.speaker_voice_map[speaker_name]

        with torch.no_grad():
            with torch.autocast(device_type=device.type, dtype=torch.float16 if device.type == "mps" else torch.float32):
                if "history_prompt" in inspect.signature(bark_generate_audio).parameters:
                    audio_array = bark_generate_audio(text, history_prompt=preset)
                else:
                    audio_array = bark_generate_audio(text)

        audio_int16 = (audio_array * 32767).astype("int16")
        return AudioSegment(
            audio_int16.tobytes(),
            frame_rate=SAMPLE_RATE,
            sample_width=2,
            channels=1
        )
