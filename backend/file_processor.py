# file_processor.py
import os
from doc_analyzer import analyze_document
from embedding_store import chunk_text, embed_text, save_embeddings

def index_uploaded_files(task_id: str):
    safe_task = task_id.strip().lower().replace(" ", "_")
    task_folder = os.path.join("storage", safe_task)

    all_text = ""
    for file in os.listdir(task_folder):
        file_path = os.path.join(task_folder, file)
        try:
            text = analyze_document(file_path)
            all_text += f"\n--- File: {file} ---\n{text}\n"
        except Exception as e:
            print(f"⚠️ Failed to process {file}: {e}")

    if all_text.strip():
        chunks = chunk_text(all_text)
        embeddings = embed_text(chunks)
        save_embeddings(safe_task, chunks, embeddings)
        print(f"✅ Indexed {len(chunks)} chunks for task: {safe_task}")

