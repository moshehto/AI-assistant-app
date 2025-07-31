# embedding_store.py
import os, json
import faiss
import numpy as np
from openai import OpenAI
from tiktoken import get_encoding

client = OpenAI()
EMBED_MODEL = "text-embedding-3-small"
ENC = get_encoding("cl100k_base")

CHUNK_SIZE = 300
CHUNK_OVERLAP = 40

def chunk_text(text):
    tokens = ENC.encode(text)
    chunks = []
    for i in range(0, len(tokens), CHUNK_SIZE - CHUNK_OVERLAP):
        chunk = tokens[i:i + CHUNK_SIZE]
        chunks.append(ENC.decode(chunk))
    return chunks

def embed_text(texts):
    result = client.embeddings.create(model=EMBED_MODEL, input=texts)
    return [r.embedding for r in result.data]

def save_embeddings(task_id, texts, embeddings):
    task_path = f"storage/{task_id}/"
    os.makedirs(task_path, exist_ok=True)

    dim = len(embeddings[0])
    index = faiss.IndexFlatL2(dim)
    index.add(np.array(embeddings).astype('float32'))

    faiss.write_index(index, os.path.join(task_path, "index.faiss"))

    with open(os.path.join(task_path, "chunks.json"), "w") as f:
        json.dump(texts, f)

def load_embeddings(task_id):
    task_path = f"storage/{task_id}/"
    index = faiss.read_index(os.path.join(task_path, "index.faiss"))
    with open(os.path.join(task_path, "chunks.json"), "r") as f:
        chunks = json.load(f)
    return index, chunks

def search(task_id, query, k=5):
    index, chunks = load_embeddings(task_id)
    query_vec = embed_text([query])[0]
    D, I = index.search(np.array([query_vec]).astype('float32'), k)
    return [chunks[i] for i in I[0]]
