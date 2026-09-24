# services/tts_xtts.py
from TTS.api import TTS
from pydub import AudioSegment
import numpy as np

class CoquiXTTSGenerator:
    def __init__(self):
        self.model = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2", progress_bar=False, gpu=False)

    def generate_segment(self, text, gender="male", tone="neutral", speaker_name="unknown"):
        wav = self.model.tts(text)
        audio_array = (np.array(wav) * 32767).astype("int16")
        return AudioSegment(
            audio_array.tobytes(),
            frame_rate=22050,
            sample_width=2,
            channels=1
        )
