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
                           bg_music: Optional[str] = None,
                           is_batch: bool = False,
                           batch_number: int = 1,
                           total_batches: int = 1) -> str:

    tts = get_tts_generator(tts_model)
    audio_segments = []
    
    # Load background music if provided
    raw_bg = AudioSegment.silent(duration=1000)  # Default silent segment
    if bg_music and os.path.exists(bg_music):
        raw_bg = AudioSegment.from_file(bg_music)

    # Convert DataFrame to segments
    segments = []
    for _, row in script_df.iterrows():
        speaker_name = row['speaker']
        speaker_config = speakers_config.get(speaker_name.lower(), {})
        segments.append({
            "text": row['text'],
            "gender": speaker_config.get('gender', 'male'),
            "tone": speaker_config.get('tone', 'neutral'),
            "speaker_name": speaker_name
        })

    # Try batch processing first
    use_batch = hasattr(tts, 'generate_batch_segments')

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
        for i, seg in enumerate(segments):
            try:
                audio = tts.generate_segment(
                    seg["text"], seg["gender"], seg["tone"], seg["speaker_name"]
                )
                audio_segments.append(audio)
                
                # Report progress for single mode
                if not is_batch:
                    progress = (i + 1) / len(segments) * 100
                    print(f"Progress: {progress:.1f}% - Generated segment {i + 1}/{len(segments)}")
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
    
    # For batched processing, append to existing file
    if is_batch:
        if batch_number == 1:
            final_mix.export(output_path, format="mp3", bitrate="192k")
        else:
            # Append to existing file
            existing = AudioSegment.from_mp3(output_path)
            combined = existing + final_mix
            combined.export(output_path, format="mp3", bitrate="192k")
        
        print(f"✅ Batch {batch_number}/{total_batches} processed and saved")
    else:
        final_mix.export(output_path, format="mp3", bitrate="192k")
        print(f"✅ Podcast saved: {output_path}")
    
    return output_path
