import os
import re
import pandas as pd
from typing import Dict, Optional
from datetime import datetime
from pydub import AudioSegment

from services.transcript_utils import parse_transcript
from services.tts_bark import BarkTTSGenerator
from services.tts_coqui import CoquiXTTSGenerator
from services.tts_kokoro import KokoroTTSGenerator

# ----------------------------
# 🔁 Dispatcher
# ----------------------------
def get_tts_generator(model: str):
    if model == "xtts":
        return CoquiXTTSGenerator()
    elif model == "kokoro":
        return KokoroTTSGenerator()
    else:
        return BarkTTSGenerator()  # default

# For preview route
def preview_voice(text: str, voice_type: str = "neutral", speaker_name: str = "preview", tts_model: str = "bark") -> AudioSegment:
    generator = get_tts_generator(tts_model)
    return generator.generate(text, voice_type)

# ----------------------------
# 🧹 Filter unwanted/system lines
# ----------------------------
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

# ----------------------------
# ✅ Synthesize Audio from Transcript
# ----------------------------
def synthesize_podcast_audio(script_df: pd.DataFrame, output_path: str, 
                             speakers_config: Dict[str, Dict[str, str]], 
                             tts_model: str = "bark", 
                             bg_music: Optional[str] = None) -> str:

    tts = get_tts_generator(tts_model)
    use_batch = hasattr(tts, "generate_batch_segments")

    print(f"🎙️ Synthesizing podcast with model: {tts_model}")
    print(f"🧑‍🤝‍🧑 Speakers config: {list(speakers_config.keys())}")

    # Optional background music
    if bg_music is None:
        bg_path = "assets/bg_music.mp3"
    elif bg_music.lower() == "none":
        bg_path = None
    else:
        bg_path = bg_music  # custom track path
    if bg_path and os.path.exists(bg_path):
        raw_bg = AudioSegment.from_file(bg_path).low_pass_filter(2000) - 20
    else:
        raw_bg = AudioSegment.silent(duration=5000)

    # Filter system-like junk
    script_df = remove_system_like_lines(script_df)

    if script_df.empty:
        raise ValueError("Transcript is empty after filtering")

    # 🎯 Prepare segments
    segments = []
    for i, row in script_df.iterrows():
        speaker = row["Name"]
        dialogue = row["Dialogue"]

        normalized_name = speaker.strip().lower()

        if normalized_name not in speakers_config:
            print(f"⚠️ Unknown speaker: {speaker}. Using fallback voice.")
            gender = "male"
            tone = "neutral"
        else:
            gender = speakers_config[normalized_name].get("gender", "male")
            tone = speakers_config[normalized_name].get("tone", "neutral")

        segments.append(
            {"text": dialogue, "gender": gender, "tone": tone, "speaker_name": normalized_name}
        )

    print(f"📦 Prepared {len(segments)} segments for synthesis (batch: {use_batch})")

    # 🛠️ Synthesize all segments
    audio_segments = []

    if use_batch:
        try:
            audio_segments = tts.generate_batch_segments(segments)
            if hasattr(audio_segments, "__await__"):  # async
                import asyncio
                audio_segments = asyncio.run(audio_segments)
        except Exception as e:
            print(f"❌ Batch synthesis failed: {e}. Falling back to single mode.")
            use_batch = False

    if not use_batch:
        for seg in segments:
            try:
                audio = tts.generate_segment(
                    seg["text"], seg["gender"], seg["tone"], seg["speaker_name"]
                )
                audio_segments.append(audio)
            except Exception as e:
                print(f"❌ Failed [{seg['speaker_name']}]: {seg['text'][:40]}... ({e})")

    # 🧃 Combine segments
    SILENCE_BEFORE = 500
    SILENCE_AFTER = 300
    combined = AudioSegment.silent(duration=SILENCE_BEFORE)
    for audio in audio_segments:
        combined += audio + AudioSegment.silent(duration=SILENCE_AFTER)

    # 🎶 Overlay background music
    loops = int(len(combined) / len(raw_bg)) + 1
    background = (raw_bg * loops)[:len(combined)]
    final_mix = background.overlay(combined, gain_during_overlay=-10)

    # 💾 Export MP3
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final_mix.export(output_path, format="mp3", bitrate="192k")
    print(f"✅ Podcast saved: {output_path}")
    return output_path
