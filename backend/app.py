from fastapi import FastAPI, UploadFile, File, Form, Request
from whisper_transcriber import transcribe_audio
from summarizer import generate_summary
from chat_handler import get_chatbot_reply
import tempfile
import os
from fastapi.middleware.cors import CORSMiddleware
import shutil
from typing import List



app = FastAPI()

# 👇 Allow access from frontend during dev

if not os.path.exists("storage"):
    os.makedirs("storage")

UPLOAD_DIR = "storage"


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Or ["*"] for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/transcribe-and-summarize")
async def transcribe_and_summarize(
    audio: UploadFile = File(...),
    summary_language: str = Form("english")
):
    with tempfile.NamedTemporaryFile(delete=True, suffix=".webm") as temp_file:
        temp_file.write(await audio.read())
        temp_file.flush()
        transcript = transcribe_audio(temp_file.name)
        summary = generate_summary(transcript, language=summary_language)

    return {
        "transcript": transcript,
        "summary": summary
    }

@app.post("/chat")
async def chat(request: Request):
    data = await request.json()
    user_message = data.get("message", "")
    reply = get_chatbot_reply(user_message)
    return {"reply": reply}

from typing import List
from fastapi import UploadFile, File, Form

@app.post("/upload")
async def upload_file(
    task_id: str = Form(...),
    files: List[UploadFile] = File(...)
):
    safe_task_id = task_id.strip().lower().replace(" ", "_")
    task_folder = os.path.join("storage", safe_task_id)
    os.makedirs(task_folder, exist_ok=True)

    saved_files = []

    for file in files:
        file_location = os.path.join(task_folder, file.filename)
        with open(file_location, "wb") as f:
            f.write(await file.read())
        saved_files.append(file.filename)

    return {
        "status": "success",
        "task": safe_task_id,
        "filenames": saved_files
    }


def delete_task_folder(task_name: str):
    task = task_name.lower().replace(" ", "_")
    task_folder = os.path.join(UPLOAD_DIR, task)

    if os.path.exists(task_folder) and os.path.isdir(task_folder):
        shutil.rmtree(task_folder)

from fastapi import HTTPException

@app.post("/delete-task-folder")
async def delete_task(task_name: str = Form(...)):
    safe_task_name = task_name.strip().lower().replace(" ", "_")
    task_folder = os.path.join(UPLOAD_DIR, safe_task_name)

    if os.path.exists(task_folder) and os.path.isdir(task_folder):
        shutil.rmtree(task_folder)
        return {"status": "deleted", "task": safe_task_name}
    else:
        raise HTTPException(status_code=404, detail="Folder not found")

