# services/tts_kokoro_real.py
#
# Kokoro-82M TTS — small, fast, MPS-friendly. ~realtime on the M4.
# This is the *real* Kokoro from hexgrad/Kokoro-82M, not the MARS5 that
# `services/tts_kokoro.py` was incorrectly trying to load through
# transformers' AutoModelForSpeechSeq2Seq.
#
# The kokoro package handles weight downloads + MPS dispatch internally.
# Voice tags follow a stable scheme: <region>_<gender>_<name>. We map
# the same gender/tone keys used by Bark and Piper.

from pydub import AudioSegment
import numpy as np


# Kokoro voice IDs — see hexgrad/Kokoro-82M model card. These all exist
# in the pretrained checkpoint and require no extra downloads beyond the
# base model.
_PRESETS: dict[str, str] = {
    "male_positive":   "am_michael",
    "male_serious":    "am_michael",
    "male_neutral":    "am_adam",
    "female_positive": "af_bella",
    "female_skeptical": "af_sarah",
    "female_neutral":  "af_heart",
}
_FALLBACK_VOICE = "af_heart"


class KokoroRealTTSGenerator:
    """Kokoro-82M backend. One pipeline shared across all speakers."""

    def __init__(self):
        # Import here so module-level `from services.tts_kokoro_real import ...`
        # is cheap; the heavy load only happens on instantiation.
        from kokoro import KPipeline
        # 'a' = American English. The package will pick the right device
        # (MPS on Apple Silicon, CUDA elsewhere, CPU otherwise).
        self._pipeline = KPipeline(lang_code="a")
        self._speaker_voice_map: dict[str, str] = {}

    def _resolve_voice(self, gender: str, tone: str, speaker_name: str) -> str:
        if speaker_name in self._speaker_voice_map:
            return self._speaker_voice_map[speaker_name]
        key = f"{gender.lower()}_{tone.lower()}"
        voice = _PRESETS.get(key, _FALLBACK_VOICE)
        self._speaker_voice_map[speaker_name] = voice
        return voice

    def generate_segment(
        self,
        text: str,
        gender: str = "male",
        tone: str = "neutral",
        speaker_name: str = "unknown",
    ) -> AudioSegment:
        voice = self._resolve_voice(gender, tone, speaker_name)

        # KPipeline returns a generator of (graphemes, phonemes, audio_array).
        # We concatenate the audio arrays in case the text is split across
        # sentences internally.
        chunks: list[np.ndarray] = []
        for _, _, audio in self._pipeline(text, voice=voice):
            chunks.append(np.asarray(audio, dtype=np.float32))
        if not chunks:
            return AudioSegment.silent(duration=200)

        combined = np.concatenate(chunks)
        # Kokoro outputs 24 kHz mono float32 in [-1, 1].
        audio_int16 = (np.clip(combined, -1.0, 1.0) * 32767).astype(np.int16)
        return AudioSegment(
            audio_int16.tobytes(),
            frame_rate=24000,
            sample_width=2,
            channels=1,
        )
