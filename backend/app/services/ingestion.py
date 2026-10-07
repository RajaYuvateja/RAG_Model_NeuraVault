from pathlib import Path
from typing import List, Dict, Any
from pypdf import PdfReader


def extract_pdf_text(file_path: str) -> List[Dict[str, Any]]:
    """Extract page-by-page text from a PDF file."""
    pages = []
    try:
        reader = PdfReader(file_path)
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            pages.append({
                "page": page_num + 1,
                "text": text.strip()
            })
    except Exception as e:
        print(f"Error reading PDF {file_path}: {e}")
    return pages


def extract_text_file(file_path: str) -> List[Dict[str, Any]]:
    """Extract text from plain text or markdown files."""
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

    return [{
        "page": 1,
        "text": text.strip()
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