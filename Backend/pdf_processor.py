import os
import re
import logging
from typing import Tuple, Optional, Dict, Any, List
from pypdf import PdfReader
import fitz

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