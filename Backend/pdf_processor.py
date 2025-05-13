import os
import re
import logging
from typing import Tuple, Optional, Dict, Any, List
from pypdf import PdfReader
import fitz
import collections
import textstat
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import nltk; nltk.download('vader_lexicon', quiet=True)
from collections import Counter
import spacy
from eda_metrics import (
    generate_word_frequencies,
    analyze_sentiment_by_chunk,
    get_topic_model
)

def extract_text(pdf_path: str) -> Tuple[str, Dict]:
    try:
        doc = fitz.open(pdf_path)
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
    # Tokenize and clean
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())  # words with 4+ letters
    stopwords = {
        "this", "that", "with", "from", "were", "have", "which", "about",
        "the", "and", "for", "then", "than", "however", "into", "onto", "until",
        "also", "these", "those", "such", "their", "been", "some", "many", "most",
        "like", "used", "using", "between", "other", "only", "more", "each", "same"
    }

    filtered = [word for word in words if word not in stopwords]
    counts = Counter(filtered)
    top_keywords = counts.most_common(top_n)

    print("📌 Extracted keyword counts:", top_keywords)
    print("🔍 Filtered words sample:", filtered[:50])
    print("🧮 Counter:", Counter(filtered).most_common(20))

    return top_keywords




def clean_text(text: str) -> str:
    """Centralized text cleaning"""
    text = text.replace('\x00', '')
    text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)  
    text = re.sub(r'\s+', ' ', text)  
    return text.strip()

def chunk_text(text: str, chunk_size=1500, overlap=200) -> List[str]:
    """Improved chunking with sentence awareness"""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    current_chunk = []
    current_length = 0
    
    for sentence in sentences:
        sentence_length = len(sentence)
        if current_length + sentence_length > chunk_size and current_chunk:
            chunks.append(' '.join(current_chunk))
            current_chunk = current_chunk[-overlap//20:] 
            current_length = sum(len(s) for s in current_chunk)
        current_chunk.append(sentence)
        current_length += sentence_length
    
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks

def analyze_pdf(pdf_path: Optional[str]) -> Dict:
    # If pdf_path is None, this function could accept raw text via a parameter, but 
    # let's assume we handle that separately for audio as above.
    full_text = ""
    metadata = {}
    if pdf_path:
        full_text, metadata = extract_text(pdf_path)
    else:
        # If called with no PDF (just text), we would require the text to be passed in;
        # this case can be handled via a separate function or extending this one.
        raise ValueError("PDF path is required for analyze_pdf in current implementation")
    if not full_text:
        raise ValueError("Failed to extract text from PDF")
    # Basic stats
    pages = metadata.get("page_count", 0)
    word_count = len(full_text.split())
    char_count = len(full_text)
    keyword_tuples = extract_keywords(full_text, top_n=10)

    if keyword_tuples:
        keywords, keyword_counts = zip(*keyword_tuples)
        keywords = list(keywords)
        keyword_counts = list(keyword_counts)
    else:
        keywords = []
        keyword_counts = []

    # Lexical diversity
    unique_words = len(set(full_text.split()))
    diversity = unique_words / word_count if word_count else 0
    lexical_density = diversity * 100 if word_count else 0

    # Advanced readability metrics
    try:
        flesch = textstat.flesch_reading_ease(full_text)
        grade = textstat.flesch_kincaid_grade(full_text)
        gunning_fog = textstat.gunning_fog(full_text)
        smog = textstat.smog_index(full_text)
        coleman_liau = textstat.coleman_liau_index(full_text)
        automated_readability = textstat.automated_readability_index(full_text)
    except Exception as e:
        flesch = grade = gunning_fog = smog = coleman_liau = automated_readability = None

    # Per-page readability breakdown
    per_page_readability = []
    if pages > 1:
        reader = PdfReader(pdf_path)
        for i, page in enumerate(reader.pages):
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

    # Sentiment analysis (overall and per page)
    analyzer = SentimentIntensityAnalyzer()
    # Compute sentiment for each page to create a trend
    page_sents = []
    if pages > 1:
        reader = PdfReader(pdf_path)
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            score = analyzer.polarity_scores(page_text)['compound']
            page_sents.append(score)
    else:
        # If single page or text not easily separable by page, just do one chunk
        score = analyzer.polarity_scores(full_text)['compound']
        page_sents.append(score)
    avg_sentiment = sum(page_sents)/len(page_sents) if page_sents else 0.0
    # Named Entity extraction (using a simple regex or spaCy if available)
    entities = []
    try:
        nlp = spacy.load("en_core_web_sm")
        doc = nlp(full_text[:100000])  # limit text for performance
        entities = [(ent.text, ent.label_) for ent in doc.ents]
    except Exception:
        # fallback: simple regex for Capitalized words as proper nouns (not very accurate)
        entities = re.findall(r'\b[A-Z][a-z]{3,}\b', full_text)
        entities = [(e, "PROPN") for e in entities]
    # Count top entities
    entity_counts = Counter([e for e, label in entities if label not in ("CARDINAL", "ORDINAL", "DATE", "TIME")])
    top_entities = [ent for ent, cnt in entity_counts.most_common(5)]
    chunks = chunk_text(full_text)
    word_freq = generate_word_frequencies(full_text, top_n=50)
    chunk_sentiments = analyze_sentiment_by_chunk(chunks)
    topics = get_topic_model(chunks)
    print("🔎 Keywords extracted:", keywords)
    print("📊 Counts:", keyword_counts)

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
        "speakers": [],  # no speaker info in raw text
        "keywords": keywords,
        "keyword_counts": keyword_counts,
        "sentiment": { "average": avg_sentiment, "per_page": page_sents },
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