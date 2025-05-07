# # services/tts_bark.py

# import torch
# import random
# import inspect
# from typing import Dict
# from pydub import AudioSegment
# from contextlib import nullcontext
# from bark import generate_audio as bark_generate_audio, preload_models
# from bark.generation import SAMPLE_RATE

# # Setup device
# device = torch.device("mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu")

# # Allow unsafe globals (required by torch serialization in Bark)
# if hasattr(torch, 'serialization') and hasattr(torch.serialization, 'add_safe_globals'):
#     torch.serialization.add_safe_globals([
#         torch.float32,
#         torch.float64,
#         torch.float16,
#         torch.bfloat16,
#         torch.int32,
#         torch.int64
#     ])

# # Preload Bark models
# preload_models(
#     text_use_gpu=(device.type != "cpu"),
#     coarse_use_gpu=(device.type != "cpu"),
#     fine_use_gpu=(device.type != "cpu"),
#     codec_use_gpu=(device.type != "cpu")
# )

# class BarkTTSGenerator:
#     def __init__(self):
#         self.voice_presets = {
#             "male_positive": ["v2/en_speaker_6", "v2/en_speaker_7"],
#             "male_serious": ["v2/en_speaker_2"],
#             "male_neutral": ["v2/en_speaker_4"],
#             "female_positive": ["v2/en_speaker_1", "v2/en_speaker_3"],
#             "female_skeptical": ["v2/en_speaker_5"],
#             "female_neutral": ["v2/en_speaker_8"]
#         }
#         self.speaker_voice_map = {}

#     def generate_segment(self, text: str, gender: str = "male", tone: str = "neutral", speaker_name: str = "unknown") -> AudioSegment:
#         key = f"{gender.lower()}_{tone.lower()}"
#         if speaker_name not in self.speaker_voice_map:
#             options = self.voice_presets.get(key, ["v2/en_speaker_9"])
#             self.speaker_voice_map[speaker_name] = random.choice(options)

#         preset = self.speaker_voice_map[speaker_name]

#         # Use autocast only on CUDA, fallback to nullcontext for MPS and CPU
#         if device.type == "cuda":
#             autocast_context = torch.autocast(device_type="cuda", dtype=torch.float16)
#         else:
#             autocast_context = nullcontext()

#         with torch.no_grad():
#             with autocast_context:
#                 if "history_prompt" in inspect.signature(bark_generate_audio).parameters:
#                     audio_array = bark_generate_audio(text, history_prompt=preset)
#                 else:
#                     audio_array = bark_generate_audio(text)

#         audio_int16 = (audio_array * 32767).astype("int16")
#         return AudioSegment(
#             audio_int16.tobytes(),
#             frame_rate=SAMPLE_RATE,
#             sample_width=2,
#             channels=1
#         )

# services/tts_bark.py
from  modal import Function
from pydub import AudioSegment
from bark.generation import SAMPLE_RATE
import random

# Retrieve deployed Modal functions
generate_bark_audio = Function.lookup("bark-tts", "generate_bark_audio")
generate_bark_batch = Function.lookup("bark-tts", "generate_bark_batch")
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

    def _get_preset(self, gender, tone, speaker_name):
        key = f"{gender.lower()}_{tone.lower()}"
        if speaker_name not in self.speaker_voice_map:
            self.speaker_voice_map[speaker_name] = random.choice(
                self.voice_presets.get(key, ["v2/en_speaker_9"])
            )
        return self.speaker_voice_map[speaker_name]

    def generate_segment(self, text, gender="male", tone="neutral", speaker_name="unknown"):
        preset = self._get_preset(gender, tone, speaker_name)
        audio_bytes = generate_bark_audio.remote(text, preset)
        return AudioSegment(audio_bytes, frame_rate=SAMPLE_RATE, sample_width=2, channels=1)

    async def generate_batch_segments(self, transcript_segments: list[dict]) -> list[AudioSegment]:
        batch = [
            {
                "text": seg["text"],
                "speaker": self._get_preset(seg["gender"], seg["tone"], seg["speaker_name"])
            }
            for seg in transcript_segments
        ]
        audio_bytes_list = await generate_bark_batch.remote.aio(batch)
        return [AudioSegment(data, frame_rate=SAMPLE_RATE, sample_width=2, channels=1)
                for data in audio_bytes_list]
