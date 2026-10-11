import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from pypdf import PdfReader


def normalize_extracted_text(text: str) -> str:
    """Normalize extracted text, cleaning strange spacing and excessive newlines."""
    if not text:
        return ""
    # Remove null bytes
    text = text.replace("\x00", "")
    # Normalize CRLF
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Fix words unnaturally broken by isolated newlines mid-sentence
    text = re.sub(r'(\w)\n\s*\n(\w)', r'\1 \2', text)
    # Collapse 3+ newlines to standard paragraph break
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Collapse multiple inline spaces/tabs to a single space
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()


def extract_pdf_text(file_path: str) -> List[Dict[str, Any]]:
    """Extract page-by-page text from a PDF file."""
    pages = []
    try:
        reader = PdfReader(file_path)
        for page_num, page in enumerate(reader.pages):
            raw_text = page.extract_text() or ""
            clean_text = normalize_extracted_text(raw_text)
            if clean_text:
                pages.append({
                    "page": page_num + 1,
                    "text": clean_text
                })
    except Exception as e:
        print(f"Error reading PDF {file_path}: {e}")
    return pages


def extract_text_file(file_path: str) -> List[Dict[str, Any]]:
    """Extract text from plain text or markdown files without fabricating page numbers."""
    path = Path(file_path)
    text = ""
    for enc in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
        try:
            with open(path, "r", encoding=enc) as f:
                text = f.read()
            break
        except UnicodeDecodeError:
            continue
        except Exception as e:
            print(f"Error reading text file {file_path}: {e}")
            return []

    clean_text = normalize_extracted_text(text)
    if not clean_text:
        return []

    return [{
        "page": None,
        "text": clean_text
    }]


def extract_document_text(file_path: str) -> List[Dict[str, Any]]:
    """Dispatch document extraction based on file extension."""
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        return extract_pdf_text(file_path)
    elif suffix in [".txt", ".md", ".csv", ".json", ".log"]:
        return extract_text_file(file_path)
    else:
        # Fallback to text reading
        return extract_text_file(file_path)