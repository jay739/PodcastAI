import requests
import pandas as pd
from typing import List

OLLAMA_HOST = "http://localhost:11434"

def generate_with_ollama(prompt: str, model: str = "llama3") -> str:
    """Generate text using local Ollama model"""
    try:
        response = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False
            },
            timeout=30
        )
    except requests.exceptions.RequestException as e:
        raise Exception(f"Ollama request failed: {str(e)}. Is Ollama running?")
    response.raise_for_status()
    return response.json()["response"]

def generate_podcast_script(text_chunks: List[str]) -> pd.DataFrame:
    """Convert PDF text into podcast dialogue using Ollama"""
    system_prompt = """
    You are a podcast script generator. Convert the given text into a conversation between:
    - Host (curious, asks questions)
    - Expert (knowledgeable, provides details)
    
    Format each line strictly as: "SPEAKER: Dialogue"
    Include natural pauses like [pause]. Keep responses under 3 sentences.
    """
    
    script_lines = []
    for chunk in text_chunks:
        full_prompt = f"{system_prompt}\n\nTEXT TO CONVERT:\n{chunk}"
        response = generate_with_ollama(full_prompt)
        script_lines.extend(line for line in response.split('\n') if ':' in line)
    
    # Parse into DataFrame
    data = []
    for line in script_lines:
        speaker, dialogue = line.split(':', 1)
        data.append({
            "Name": speaker.strip(),
            "Dialogue": dialogue.strip(),
            "Order": len(data) + 1
        })
    
    return pd.DataFrame(data)