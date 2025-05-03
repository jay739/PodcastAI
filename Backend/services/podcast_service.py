from typing import List, Dict, Optional
from datetime import datetime
from pdf_processor import analyze_pdf, chunk_text
from llm_service import OllamaLLMProvider
from tts_service import synthesize_podcast_audio
from vector_db import TextChunk, FaissVectorDB
from services.transcript_utils import parse_transcript
import re

class UnifiedPodcastGenerator:
    def __init__(self, fileID: str, chunks: List[TextChunk], podcast_title: str = "Insights Unpacked",
                 host_names: Optional[List[str]] = None, guest_name: Optional[str] = None):
        if not chunks:
            raise ValueError("Cannot initialize with empty chunks.")
        self.fileID = fileID
        self.chunks = chunks
        self.podcast_title = podcast_title
        self.hosts = host_names or ["Jamie", "Taylor"]
        self.guest = guest_name
        self.vector_db = FaissVectorDB(chunks)
        self.llm = OllamaLLMProvider()
        self.topics = self._determine_topics(top_n=4)
        self.episode_subtitle = self._generate_episode_subtitle()
        self.episode_number = 1

    def _determine_topics(self, top_n: int = 4) -> List[str]:
        sample_size = min(10, len(self.chunks))
        sample_chunks = self.chunks[:sample_size]
        sample_text = "\n\n".join([chunk.text for chunk in sample_chunks])
        prompt = f"Analyze and list the top {top_n} topics from this document:\n{sample_text[:3000]}\n\nTopics:"
        response = self.llm.generate_response(prompt, max_tokens=100)
        if not response:
            raise ValueError("Topic generation failed.")
        return [topic.strip() for topic in response.split('|')][:top_n] if '|' in response else ["General Overview"]

    def _generate_episode_subtitle(self) -> str:
        if len(self.topics) >= 2:
            prompt = f"Create a concise podcast subtitle covering '{self.topics[0]}' and '{self.topics[1]}'. Max 8 words."
        else:
            prompt = f"Create a concise podcast subtitle about '{self.topics[0]}'. Max 8 words."
        subtitle = self.llm.generate_response(prompt, max_tokens=50)
        return subtitle.strip('"\'')

    def _format_dialogue(self, text: str) -> str:
        for host in self.hosts:
            text = re.sub(fr'{host}\s*[-:]\s*', f"{host}: ", text)
        if self.guest:
            text = re.sub(fr'{self.guest}\s*[-:]\s*', f"{self.guest}: ", text)
        text = re.sub(r'(\w+:\s*[^\n]+)(\w+:)', r'\1\n\n\2', text)
        return text.strip()

    def gather_context_for_topic(self, topic: str, context_chunks: int = 3) -> str:
        relevant_chunks = self.vector_db.retrieve_relevant_chunks(query=topic, top_k=context_chunks)
        return "\n\n".join([chunk.text for chunk in relevant_chunks])

    def generate_transcript(self, speakers_config: Dict[str, Dict[str, str]]) -> str:
        context_by_topic = {
            topic: self.gather_context_for_topic(topic)
            for topic in self.topics
        }
        combined_context = "\n\n".join(
            [f"===== CONTEXT FOR TOPIC: {t} =====\n{c}" for t, c in context_by_topic.items()]
        )

        guest_line = f"- {self.guest}: The guest expert who provides deeper insights" if self.guest else ""

        # 🔧 Build emotional alignment descriptions
        speaker_tone_descriptions = "\n".join(
            f"{name} speaks in a {data.get('tone', 'neutral')} tone."
            for name, data in speakers_config.items()
            if data.get("tone")
        )

        # 🧠 Inject tone and personality guidance into the prompt
        prompt = f"""Your task is to generate a podcast titled '{self.podcast_title} - Episode {self.episode_number}: {self.episode_subtitle}'
with hosts {", ".join(self.hosts)}{' and guest ' + self.guest if self.guest else ''}.
Context:
{combined_context[:5000]}

Generate a markdown-formatted podcast transcript. Follow this structure:
1. Introduction
2. Discussion (topics: {", ".join(self.topics)})
3. Conclusion
- Use [Name]: [Dialogue] format.
- Add ---END OF PODCAST--- at the end.

4. Speaker styles:
{self.hosts[0]}: Insightful, guides flow
{self.hosts[1]}: Supportive, asks clarifying questions
{guest_line}

5. Emotional Alignment:
{speaker_tone_descriptions}
"""

        # Run LLM
        transcript = self.llm.generate_response(prompt, max_tokens=5000)
        transcript = self._format_dialogue(transcript)
        transcript_path = f"outputs/{self.fileID}_transcript.md"

        with open(transcript_path, "w", encoding="utf-8") as f:
            f.write(transcript)

        if "---END OF PODCAST---" not in transcript:
            transcript += "\n\n---END OF PODCAST---"

        full_transcript = f"# {self.podcast_title} - Episode {self.episode_number}: {self.episode_subtitle}\n\n{transcript}"
        return full_transcript, transcript_path


class PodcastService:
    def generate_podcast(self, fileID: str, config: Dict) -> Dict:
        pdf_path = f"uploads/{fileID}.pdf"
        analysis = analyze_pdf(pdf_path)
        metadata = analysis["metadata"]
        full_text = analysis["full_text"]
        chunks = chunk_text(full_text)
        text_chunks = [TextChunk(i, chunk, metadata) for i, chunk in enumerate(chunks)]

        # 🔄 Convert speakers list to config dict
        raw_speakers = config.get("speakers", [])  # From frontend: list of {name, gender, tone}
        speakers_config = {
            speaker["name"]: {
                "gender": speaker.get("gender", "male"),
                "tone": speaker.get("tone", "neutral")
            }
            for speaker in raw_speakers if "name" in speaker
        }

        generator = UnifiedPodcastGenerator(
            fileID=fileID,
            chunks=text_chunks,
            podcast_title=config.get("title", "Generated Podcast"),
            host_names=config.get("hosts", ["Host 1", "Host 2"]),
            guest_name=config.get("guest")
        )

        transcript, transcript_path = generator.generate_transcript(speakers_config)
        output_path = f"outputs/{fileID}.mp3"
        tts_model = config.get("tts_model", "bark")
        synthesize_podcast_audio(parse_transcript(transcript_path), output_path, speakers_config, tts_model=tts_model)
        return {
            "fileID": fileID,
            "transcript": transcript,
            "output_path": output_path
        }

podcast_service = PodcastService()
