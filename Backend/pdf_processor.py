import os
import re
import logging
from typing import Tuple, Optional, Dict, Any, List
from pypdf import PdfReader
import pymupdf

def extract_text(pdf_path: str) -> Tuple[str, Dict]:
    # Open outside the try: if opening fails there is no document to close,
    # and the original error should surface instead of an UnboundLocalError.
    doc = pymupdf.open(pdf_path)
    try:
        text = "\n".join(page.get_text() for page in doc)
        # PyMuPDF reports missing metadata as "", so fall back on falsy values.
        meta = doc.metadata or {}
        metadata = {
            "title": meta.get("title") or os.path.basename(pdf_path),
            "author": meta.get("author") or "Unknown",
            "page_count": len(doc),
            "file_size": os.path.getsize(pdf_path)
        }
        return clean_text(text), metadata
    finally:
        doc.close()

def clean_text(text: str) -> str:
    """Centralized text cleaning"""
    text = text.replace('\x00', '')
    text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)  
    text = re.sub(r'\s+', ' ', text)  
    return text.strip()

def _tail_overlap(sentences: List[str], overlap: int) -> List[str]:
    """The trailing sentences whose combined length fits within overlap chars."""
    tail, length = [], 0
    for sentence in reversed(sentences):
        if length + len(sentence) > overlap:
            break
        tail.insert(0, sentence)
        length += len(sentence)
    return tail

def chunk_text(text: str, chunk_size=1500, overlap=200) -> List[str]:
    """Sentence-aware chunking. Each chunk starts with up to `overlap`
    characters of trailing sentences from the previous chunk."""
    sentences = [s for s in re.split(r'(?<=[.!?])\s+', text) if s]
    chunks = []
    current_chunk = []
    current_length = 0

    for sentence in sentences:
        sentence_length = len(sentence)
        if current_length + sentence_length > chunk_size and current_chunk:
            chunks.append(' '.join(current_chunk))
            current_chunk = _tail_overlap(current_chunk, overlap)
            current_length = sum(len(s) for s in current_chunk)
        current_chunk.append(sentence)
        current_length += sentence_length
    
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks

def analyze_pdf(pdf_path: str) -> Dict:
    full_text, metadata = extract_text(pdf_path)
    if not full_text:
        raise ValueError("Failed to extract text from PDF")
    
    return {
        "full_text": full_text,
        "metadata": metadata,
        "chunks": chunk_text(full_text),
        "page_count": metadata.get("page_count", 0),
        "word_count": len(full_text.split()),
        "char_count": len(full_text)
    }