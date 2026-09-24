# services/tts_kokoro.py
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
import torch
import numpy as np
from pydub import AudioSegment

class KokoroTTSGenerator:
    def __init__(self):
        self.model_id = "CAMB-AI/MARS5-tts"
        self.device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")

        self.processor = AutoProcessor.from_pretrained(self.model_id)
        self.model = AutoModelForSpeechSeq2Seq.from_pretrained(self.model_id, torch_dtype=torch.float16 if self.device.type != "cpu" else torch.float32)
        self.pipe = pipeline("text-to-speech", model=self.model, tokenizer=self.processor, device=0 if self.device.type == "cuda" else -1)

    def generate_segment(self, text, gender="male", tone="neutral", speaker_name="unknown"):
        out = self.pipe(text)
        audio_array = (out["audio"] * 32767).astype(np.int16)
        return AudioSegment(
            audio_array.tobytes(),
            frame_rate=out["sampling_rate"],
            sample_width=2,
            channels=1
        )
