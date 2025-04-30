import re
from typing import List, Dict

def parse_transcript(transcript: str) -> List[Dict[str, str]]:
    """
    Parse a markdown podcast transcript into a list of dialogue blocks.
    Each block will be a dict with 'Name' and 'Dialogue'.
    """
    dialogue_list = []
    lines = transcript.splitlines()
    for line in lines:
        # Match lines like "Alice: Welcome to the podcast!"
        match = re.match(r"^(.*?):\s+(.*)", line)
        if match:
            speaker = match.group(1).strip()
            dialogue = match.group(2).strip()
            dialogue_list.append({
                "Name": speaker,
                "Dialogue": dialogue
            })
    return dialogue_list