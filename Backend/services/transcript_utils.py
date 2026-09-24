# import re
# import pandas as pd

# def parse_transcript(transcript_path: str) -> pd.DataFrame:
#     """
#     Parse a markdown-formatted transcript from file into a DataFrame
#     with columns: Name, Dialogue
#     """
#     dialogue_data = []
#     pattern = re.compile(r"^([\w\s\.\-]+):\s(.+)")

#     with open(transcript_path, "r", encoding="utf-8") as f:
#         for line in f:
#             line = line.strip()
#             match = pattern.match(line)
#             if match:
#                 speaker = match.group(1).strip()
#                 dialogue = match.group(2).strip()
#                 if speaker and dialogue:
#                     dialogue_data.append({"Name": speaker, "Dialogue": dialogue})

#     return pd.DataFrame(dialogue_data)

# def save_arc_transcript(df: pd.DataFrame, job_id: str):
#     arc_lines = []
#     for i, row in df.iterrows():
#         entry = {
#             "timestamp": f"[{(i * 30) // 60:02d}:{(i * 30) % 60:02d}]",
#             "speaker": row["Name"],
#             "text": row["Dialogue"]
#         }
#         arc_lines.append(entry)

#     out_path = os.path.join("outputs", f"{job_id}_arc.json")
#     with open(out_path, "w") as f:
#         json.dump(arc_lines, f, indent=2)
import re
import os
import json
import pandas as pd

def parse_transcript(transcript_path: str) -> pd.DataFrame:
    """
    Parse a markdown-formatted transcript from file into a DataFrame
    with columns: Name, Dialogue
    """
    dialogue_data = []
    # Flexible regex to match any speaker name before colon
    pattern = re.compile(r"^([\w\s\.\-]+):\s(.+)")

    print(f"\U0001F50D Parsing transcript: {transcript_path}")

    with open(transcript_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            match = pattern.match(line)
            if match:
                speaker = match.group(1).strip()
                dialogue = match.group(2).strip()
                if speaker and dialogue:
                    dialogue_data.append({"Name": speaker, "Dialogue": dialogue})

    print(f"✅ Extracted {len(dialogue_data)} dialogue lines")
    if dialogue_data:
        print("\U0001F9EA Sample line:", dialogue_data[0])
    else:
        print("⚠️ No matching lines found. Check transcript formatting.")

    return pd.DataFrame(dialogue_data)

def save_arc_transcript(df: pd.DataFrame, job_id: str):
    """
    Save timestamped ARC-formatted transcript as JSON.
    """
    arc_lines = []
    for i, row in df.iterrows():
        entry = {
            "timestamp": f"[{(i * 30) // 60:02d}:{(i * 30) % 60:02d}]",
            "speaker": row["Name"],
            "text": row["Dialogue"]
        }
        arc_lines.append(entry)

    out_path = os.path.join("outputs", f"{job_id}_arc.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(arc_lines, f, indent=2)

    print(f"📄 ARC transcript saved to: {out_path}")
