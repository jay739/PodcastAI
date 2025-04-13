import pypdf
import pymupdf
from typing import Dict, List

def analyze_pdf(pdf_path: str) -> Dict:
    """Analyze PDF and return structured data"""
    try:
        # Extract text with PyMuPDF (more reliable than PyPDF)
        doc = pymupdf.open(pdf_path)
        full_text = ""
        for page in doc:
            full_text += page.get_text() + "\n"
        doc.close()

        # Get metadata
        metadata = get_pdf_metadata(pdf_path)

        # Identify speakers
        speakers = identify_speakers(full_text)

        return {
            "page_count": metadata["page_count"],
            "word_count": len(full_text.split()),
            "speakers": speakers,
            "full_text": full_text
        }
    except Exception as e:
        raise Exception(f"PDF analysis failed: {str(e)}")

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