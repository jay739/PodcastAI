import re
import pandas as pd

def parse_transcript(transcript_path: str) -> pd.DataFrame:
    """
    Parse a markdown-formatted transcript from file into a DataFrame
    with columns: Name, Dialogue
    """
    dialogue_data = []
    pattern = re.compile(r"^([\w\s\.\-]+):\s(.+)")

    with open(transcript_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            match = pattern.match(line)
            if match:
                speaker = match.group(1).strip()
                dialogue = match.group(2).strip()
                if speaker and dialogue:
                    dialogue_data.append({"Name": speaker, "Dialogue": dialogue})

    return pd.DataFrame(dialogue_data)
