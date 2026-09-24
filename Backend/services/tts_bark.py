# services/tts_bark.py
#
# Self-hosted Bark TTS on Apple MPS / CUDA / CPU. No external services.
# Replaces the prior Modal-Labs wrapper which relied on a removed SDK call
# (Function.lookup) and a disabled deployment.
#
# Preloading happens in __init__, so the cost is paid only when a generator
# is actually instantiated (i.e. when tts_model="bark" is selected). The
# tts_service.get_tts_generator() dispatcher is lazy-imported, so this
# module is not loaded unless requested.

import inspect
import random
from contextlib import nullcontext

import torch
from bark import generate_audio as bark_generate_audio, preload_models
from bark.generation import SAMPLE_RATE
from pydub import AudioSegment

# Device selection: prefer Metal on Apple Silicon, then CUDA, then CPU.
device = torch.device(
    "mps" if torch.backends.mps.is_available()
    else "cuda" if torch.cuda.is_available()
    else "cpu"
)

# Bark's checkpoints contain a few torch scalar globals that the newer
# torch.serialization safety checks block by default. Whitelist them.
if hasattr(torch, "serialization") and hasattr(torch.serialization, "add_safe_globals"):
    torch.serialization.add_safe_globals([
        torch.float32, torch.float64, torch.float16, torch.bfloat16,
        torch.int32, torch.int64,
    ])


class BarkTTSGenerator:
    _models_loaded = False

    def __init__(self):
        # Preload once per process.
        if not BarkTTSGenerator._models_loaded:
            on_gpu = device.type != "cpu"
            preload_models(
                text_use_gpu=on_gpu,
                coarse_use_gpu=on_gpu,
                fine_use_gpu=on_gpu,
                codec_use_gpu=on_gpu,
            )
            BarkTTSGenerator._models_loaded = True

        self.voice_presets = {
            "male_positive":   ["v2/en_speaker_6", "v2/en_speaker_7"],
            "male_serious":    ["v2/en_speaker_2"],
            "male_neutral":    ["v2/en_speaker_4"],
            "female_positive": ["v2/en_speaker_1", "v2/en_speaker_3"],
            "female_skeptical": ["v2/en_speaker_5"],
            "female_neutral":  ["v2/en_speaker_8"],
        }
        self.speaker_voice_map: dict[str, str] = {}

    def _preset_for(self, gender: str, tone: str, speaker_name: str) -> str:
        key = f"{gender.lower()}_{tone.lower()}"
        if speaker_name not in self.speaker_voice_map:
            options = self.voice_presets.get(key, ["v2/en_speaker_9"])
            self.speaker_voice_map[speaker_name] = random.choice(options)
        return self.speaker_voice_map[speaker_name]

    def generate_segment(
        self,
        text: str,
        gender: str = "male",
        tone: str = "neutral",
        speaker_name: str = "unknown",
    ) -> AudioSegment:
        preset = self._preset_for(gender, tone, speaker_name)
        autocast = (
            torch.autocast(device_type="cuda", dtype=torch.float16)
            if device.type == "cuda" else nullcontext()
        )
        with torch.no_grad(), autocast:
            if "history_prompt" in inspect.signature(bark_generate_audio).parameters:
                audio_array = bark_generate_audio(text, history_prompt=preset)
            else:
                audio_array = bark_generate_audio(text)
        audio_int16 = (audio_array * 32767).astype("int16")
        return AudioSegment(
            audio_int16.tobytes(),
            frame_rate=SAMPLE_RATE,
            sample_width=2,
            channels=1,
        )
