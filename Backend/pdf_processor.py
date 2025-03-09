import pypdf
import pytesseract
from PIL import Image
import io
import pymupdf  

def extract_text_from_pdf(pdf_path):
    """
    Extract text from a PDF file using both text extraction and OCR if needed.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        dict: Dictionary containing extracted text by page and document structure
    """
    # Extract text using PyPDF
    text_content = {}
    doc_structure = {
        "paragraphs": [],
        "dialogues": []
    }
    
    # Try extracting text with PyPDF first
    try:
        reader = pypdf.PdfReader(pdf_path)
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text.strip():
                text_content[i] = text
    except Exception as e:
        print(f"Error with PyPDF: {e}")
    
    # If PyPDF extraction failed or text is sparse, try PyMuPDF
    if not text_content or any(not text.strip() for text in text_content.values()):
        try:
            doc = pymupdf.open(pdf_path)
            for i, page in enumerate(doc):
                text = page.get_text()
                if text.strip():
                    text_content[i] = text
            doc.close()
        except Exception as e:
            print(f"Error with PyMuPDF: {e}")
    
    # If text extraction failed, try OCR
    if not text_content or any(not text.strip() for text in text_content.values()):
        try:
            doc = pymupdf.open(pdf_path)
            for i, page in enumerate(doc):
                pix = page.get_pixmap()
                img = Image.open(io.BytesIO(pix.tobytes()))
                text = pytesseract.image_to_string(img)
                if text.strip():
                    text_content[i] = text
            doc.close()
        except Exception as e:
            print(f"Error with OCR: {e}")
    
    # Process the extracted text to identify paragraphs and dialogues
    all_text = "\n".join([text_content[i] for i in sorted(text_content.keys())])
    
    # Simple paragraph splitting - can be enhanced with NLP
    paragraphs = [p.strip() for p in all_text.split("\n\n") if p.strip()]
    doc_structure["paragraphs"] = paragraphs
    
    # Simple dialogue detection - look for quotes or dialogue markers
    for paragraph in paragraphs:
        if '"' in paragraph or "'" in paragraph or ":" in paragraph:
            doc_structure["dialogues"].append(paragraph)
    
    return {
        "page_text": text_content,
        "structure": doc_structure,
        "full_text": all_text
    }

def extract_images_from_pdf(pdf_path):
    """
    Extract images from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        list: List of extracted images
    """
    images = []
    
    try:
        doc = pymupdf.open(pdf_path)
        for page_index, page in enumerate(doc):
            # Get the image list
            image_list = page.get_images(full=True)
            
            for img_index, img in enumerate(image_list):
                # Get the XREF of the image
                xref = img[0]
                
                # Extract the image
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                
                # Store the image
                image_data = {
                    "page": page_index,
                    "index": img_index,
                    "bytes": image_bytes,
                    "extension": base_image["ext"]
                }
                
                images.append(image_data)
        
        doc.close()
    except Exception as e:
        print(f"Error extracting images: {e}")
    
    return images

def get_pdf_metadata(pdf_path):
    """
    Extract metadata from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        dict: PDF metadata
    """
    try:
        reader = pypdf.PdfReader(pdf_path)
        metadata = reader.metadata
        info = {
            "title": metadata.get("/Title", ""),
            "author": metadata.get("/Author", ""),
            "creator": metadata.get("/Creator", ""),
            "producer": metadata.get("/Producer", ""),
            "subject": metadata.get("/Subject", ""),
            "page_count": len(reader.pages)
        }
        return info
    except Exception as e:
        print(f"Error getting metadata: {e}")
        return {
            "title": "",
            "author": "",
            "creator": "",
            "producer": "",
            "subject": "",
            "page_count": 0
        }