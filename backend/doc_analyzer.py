import os
import fitz  # PyMuPDF
from PIL import Image
import pytesseract
import pandas as pd


def analyze_document(file_path):
    ext = os.path.splitext(file_path)[-1].lower()

    if ext in ['.pdf']:
        return extract_text_from_pdf(file_path)
    elif ext in ['.png', '.jpg', '.jpeg']:
        return extract_text_from_image(file_path)
    elif ext in ['.xlsx', '.xls']:
        return extract_text_from_excel(file_path)
    else:
        return "Unsupported file format."



def extract_text_from_excel(file_path):
    dfs = pd.read_excel(file_path, sheet_name=None)
    all_text = ""
    for name, df in dfs.items():
        all_text += f"Sheet: {name}\n"
        all_text += df.to_string(index=False) + "\n\n"
    return all_text


def extract_text_from_pdf(filepath):
    text = ""
    with fitz.open(filepath) as doc:
        for page in doc:
            text += page.get_text()
    return text



def extract_text_from_image(image_path):
    image = Image.open(image_path)
    return pytesseract.image_to_string(image)
