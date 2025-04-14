import pypdf
import pymupdf
from typing import Dict, List
import os

def analyze_pdf(pdf_path: str) -> Dict:
    """Analyze PDF with enhanced text extraction"""
    result = {
        "page_count": 0,
        "word_count": 0,
        "char_count": 0,
        "speakers": [],
        "full_text": "",
        "chunks": []
    }

    # Try both libraries with proper fallbacks
    extraction_attempts = []
    
    # Attempt 1: PyMuPDF
    try:
        doc = pymupdf.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text() + "\n"
        result["page_count"] = len(doc)
        doc.close()
        extraction_attempts.append(("PyMuPDF", text))
    except Exception as e:
        extraction_attempts.append(("PyMuPDF", f"Error: {str(e)}"))

    # Attempt 2: PyPDF
    try:
        with pypdf.PdfReader(pdf_path) as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() + "\n"
            if not result["page_count"]:  # Only set if PyMuPDF failed
                result["page_count"] = len(pdf.pages)
            extraction_attempts.append(("PyPDF", text))
    except Exception as e:
        extraction_attempts.append(("PyPDF", f"Error: {str(e)}"))

    # Determine which extraction worked best
    successful_extractions = [t for _, t in extraction_attempts if not t.startswith("Error:")]
    if successful_extractions:
        # Choose the extraction with most text
        chosen_text = max(successful_extractions, key=len)
        result["full_text"] = chosen_text.strip()
        
        # Calculate metrics only if we got text
        if result["full_text"]:
            result["word_count"] = len(result["full_text"].split())
            result["char_count"] = len(result["full_text"])
            result["speakers"] = identify_speakers(result["full_text"])
            result["chunks"] = chunk_text(result["full_text"])
    
    # Add debug info
    result["debug"] = {
        "extraction_attempts": extraction_attempts,
        "file_size": os.path.getsize(pdf_path),
        "file_path": pdf_path
    }
    
    return result

def get_pdf_metadata(pdf_path: str) -> Dict:
    """Extract PDF metadata"""
    try:
        with pypdf.PdfReader(pdf_path) as pdf:
            return {
                "page_count": len(pdf.pages),
                "title": pdf.metadata.get("/Title", ""),
                "author": pdf.metadata.get("/Author", "")
            }
    except Exception as e:
        print(f"Metadata extraction warning: {str(e)}")
        return {"page_count": 0, "title": "", "author": ""}

def identify_speakers(text: str) -> List[Dict]:
    """Simple speaker identification from text"""
    speakers = []
    # Basic pattern: Look for lines ending with ":"
    for line in text.split('\n'):
        if ':' in line:
            speaker = line.split(':')[0].strip()
            speakers.append({
                "name": speaker,
                "type": "dialogue",
                "frequency": text.count(speaker + ':')
            })
    
    # Add narrator if no speakers found
    if not speakers:
        speakers.append({
            "name": "Narrator",
            "type": "narrative",
            "frequency": 1
        })
    
    return speakers

def chunk_text(text: str, chunk_size: int = 1000) -> List[str]:
    """Split text into manageable chunks"""
    words = text.split()
    chunks = []
    current_chunk = []
    
    for word in words:
        current_chunk.append(word)
        if len(' '.join(current_chunk)) > chunk_size:
            chunks.append(' '.join(current_chunk))
            current_chunk = []
    
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks