"""Two more upstream fixes:

10. OllamaLLMProvider.generate_response misuses `num_ctx: max_tokens`.
    num_ctx is the *context window* (how many tokens the model can read);
    output length is `num_predict`. The bug caps the context at max_tokens
    (e.g. 100) so the model can't read the prompt at all.

11. _clean_response's regex `\\[(?!Host)[^\\]]+\\]` strips any bracketed
    content not starting with "Host", which destroys `[Jamie]:` speaker
    tags (leaving stray colons that the parser can't match). Tighten the
    regex to only strip brackets *not* immediately followed by `:` —
    those aren't speaker tags.

Both idempotent.
"""
from pathlib import Path
import sys

p = Path(__file__).resolve().parent / "llm_service.py"
src = p.read_text()

# --- Fix 10 ---
SENTINEL_CTX = "# llm_service:num_ctx_vs_predict:v1"
if SENTINEL_CTX not in src:
    old = (
        '            "options": {\n'
        '                "temperature": 0.7,\n'
        '                "num_ctx": max_tokens\n'
        '            }\n'
    )
    new = (
        f'            # {SENTINEL_CTX[2:]}\n'
        '            "options": {\n'
        '                "temperature": 0.7,\n'
        '                "num_ctx": 8192,\n'
        '                "num_predict": max_tokens,\n'
        '            },\n'
    )
    if old not in src:
        print("ERROR: num_ctx block not found", file=sys.stderr); sys.exit(1)
    src = src.replace(old, new)
    print("fix 10 applied")

# --- Fix 11 ---
SENTINEL_BR = "# llm_service:keep_speaker_brackets:v1"
if SENTINEL_BR not in src:
    old = 'text = re.sub(r"\\[(?!Host)[^\\]]+\\]", "", text)'
    new = (
        f'# {SENTINEL_BR[2:]}\n'
        '        # Only strip bracketed content that is NOT a speaker tag.\n'
        '        # Speaker tags are `[Name]:` (close-bracket followed by colon).\n'
        '        text = re.sub(r"\\[(?!Host)[^\\]]+\\](?!:)", "", text)'
    )
    if old not in src:
        print("ERROR: clean_response bracket regex not found", file=sys.stderr); sys.exit(1)
    src = src.replace(old, new)
    print("fix 11 applied")

p.write_text(src)
print(f"saved {p}")
