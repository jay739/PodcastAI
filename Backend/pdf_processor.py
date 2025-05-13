import os
import re
import logging
from typing import Tuple, Optional, Dict, Any, List
from pypdf import PdfReader
import fitz
from collections import Counter, defaultdict
import textstat
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import nltk; nltk.download('vader_lexicon', quiet=True)
import spacy

from eda_metrics import (
    generate_word_frequencies,
    analyze_sentiment_by_chunk,
    get_topic_model
)

# Global stopwords set
STOPWORDS = set([
    "this", "that", "with", "from", "were", "have", "which", "about",
    "the", "and", "for", "then", "than", "however", "into", "onto", "until",
    "also", "these", "those", "such", "their", "been", "some", "many", "most",
    "like", "used", "using", "between", "other", "only", "more", "each", "same"
])


def extract_text(pdf_path: str) -> Tuple[str, Dict]:
    doc = fitz.open(pdf_path)
    try:
        text = "\n".join(page.get_text() for page in doc)
        metadata = {
            "title": doc.metadata.get("title", os.path.basename(pdf_path)),
            "author": doc.metadata.get("author", "Unknown"),
            "page_count": len(doc),
            "file_size": os.path.getsize(pdf_path)
        }
        return clean_text(text), metadata
    finally:
        doc.close()


def extract_keywords(text: str, top_n: int = 10) -> List[Tuple[str, int]]:
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
    filtered = [word for word in words if word not in STOPWORDS]
    return Counter(filtered).most_common(top_n)


def clean_text(text: str) -> str:
    text = text.replace('\x00', '')
    text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def chunk_text(text: str, chunk_size=1500, overlap=200) -> List[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, current_chunk, current_length = [], [], 0

    for sentence in sentences:
        if current_length + len(sentence) > chunk_size and current_chunk:
            chunks.append(' '.join(current_chunk))
            current_chunk = current_chunk[-overlap//20:]
            current_length = sum(len(s) for s in current_chunk)
        current_chunk.append(sentence)
        current_length += len(sentence)

    if current_chunk:
        chunks.append(' '.join(current_chunk))
    return chunks


def analyze_pdf(pdf_path: Optional[str]) -> Dict:
    if not pdf_path:
        raise ValueError("PDF path is required for analyze_pdf in current implementation")

    full_text, metadata = extract_text(pdf_path)
    if not full_text:
        raise ValueError("Failed to extract text from PDF")

    pages = metadata.get("page_count", 0)
    word_count = len(full_text.split())
    char_count = len(full_text)
    keyword_tuples = extract_keywords(full_text, top_n=10)
    keywords, keyword_counts = zip(*keyword_tuples) if keyword_tuples else ([], [])

    unique_words = len(set(full_text.split()))
    diversity = unique_words / word_count if word_count else 0
    lexical_density = diversity * 100 if word_count else 0

    try:
        flesch = textstat.flesch_reading_ease(full_text)
        grade = textstat.flesch_kincaid_grade(full_text)
        gunning_fog = textstat.gunning_fog(full_text)
        smog = textstat.smog_index(full_text)
        coleman_liau = textstat.coleman_liau_index(full_text)
        automated_readability = textstat.automated_readability_index(full_text)
    except Exception:
        flesch = grade = gunning_fog = smog = coleman_liau = automated_readability = None

    per_page_readability = []
    if pages > 1:
        reader = PdfReader(pdf_path)
        for page in reader.pages:
            page_text = page.extract_text() or ""
            try:
                per_page_readability.append({
                    "flesch": textstat.flesch_reading_ease(page_text),
                    "grade": textstat.flesch_kincaid_grade(page_text),
                    "gunning_fog": textstat.gunning_fog(page_text),
                    "smog": textstat.smog_index(page_text),
                })
            except Exception:
                per_page_readability.append(None)
    else:
        per_page_readability = None

    analyzer = SentimentIntensityAnalyzer()
    page_sents = []
    if pages > 1:
        reader = PdfReader(pdf_path)
        for page in reader.pages:
            page_text = page.extract_text() or ""
            score = analyzer.polarity_scores(page_text)['compound']
            page_sents.append(score)
    else:
        page_sents.append(analyzer.polarity_scores(full_text)['compound'])

    avg_sentiment = sum(page_sents)/len(page_sents) if page_sents else 0.0

    try:
        nlp = spacy.load("en_core_web_sm")
        doc = nlp(full_text[:100000])
        entities = [(ent.text, ent.label_) for ent in doc.ents]
    except Exception:
        entities = re.findall(r'\b[A-Z][a-z]{3,}\b', full_text)
        entities = [(e, "PROPN") for e in entities]

    entity_counts = Counter([e for e, label in entities if label not in ("CARDINAL", "ORDINAL", "DATE", "TIME", "QUANTITY", "PERCENT", "MONEY")])
    top_entities = [ent for ent, _ in entity_counts.most_common(5)]

    chunks = chunk_text(full_text)
    word_freq = generate_word_frequencies(full_text, top_n=50)
    chunk_sentiments = analyze_sentiment_by_chunk(chunks)
    topics = get_topic_model(chunks)

    return {
        "full_text": full_text,
        "metadata": metadata,
        "chunks": chunks,
        "chunk_sentiment": chunk_sentiments,
        "word_frequencies": word_freq,
        "topics": topics,
        "page_count": pages,
        "word_count": word_count,
        "char_count": char_count,
        "speakers": [],
        "keywords": list(keywords),
        "keyword_counts": list(keyword_counts),
        "sentiment": {"average": avg_sentiment, "per_page": page_sents},
        "readability": {
            "flesch_ease": flesch,
            "grade_level": grade,
            "gunning_fog": gunning_fog,
            "smog": smog,
            "coleman_liau": coleman_liau,
            "automated_readability": automated_readability,
            "per_page": per_page_readability
        },
        "entities": top_entities,
        "diversity": diversity,
        "unique_words": unique_words,
        "lexical_density": lexical_density
    }
