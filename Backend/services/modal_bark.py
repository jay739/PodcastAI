# modal_bark.py

import modal
from bark import preload_models
preload_models()
app = modal.App("bark-tts")

bark_image = (
    modal.Image.debian_slim(python_version="3.10")
    .pip_install("torch==2.5.1", "numpy", "pydub", "bark")
)


# Single TTS generation
@app.function(image=bark_image, gpu="A100", timeout=300)
def generate_bark_audio(text: str, speaker_id: str = "v2/en_speaker_1") -> bytes:
    import torch
    import numpy as np
    from bark import generate_audio, preload_models

    # ✅ PATCH SAFE GLOBALS
    if hasattr(torch, "serialization") and hasattr(torch.serialization, "add_safe_globals"):
        torch.serialization.add_safe_globals([
            np.core.multiarray.scalar,
            torch.float32, torch.float64, torch.float16,
            torch.bfloat16, torch.int32, torch.int64
        ])

    audio_array = generate_audio(text, history_prompt=speaker_id)
    return (audio_array * 32767).astype(np.int16).tobytes()

# Batch TTS generation
@app.function(image=bark_image, gpu="A100", max_containers=4, timeout=600)
async def generate_bark_batch(batch: list[dict]) -> list[bytes]:
    import torch
    import numpy as np
    from bark import generate_audio, preload_models
    import asyncio

    # ✅ PATCH SAFE GLOBALS
    if hasattr(torch, "serialization") and hasattr(torch.serialization, "add_safe_globals"):
        torch.serialization.add_safe_globals([
            np.core.multiarray.scalar,
            torch.float32, torch.float64, torch.float16,
            torch.bfloat16, torch.int32, torch.int64
        ])

    def _gen(t, s):
        return (generate_audio(t, history_prompt=s) * 32767).astype(np.int16).tobytes()

    loop = asyncio.get_event_loop()
    return await asyncio.gather(
        *[loop.run_in_executor(None, _gen, item["text"], item["speaker"]) for item in batch]
    )
