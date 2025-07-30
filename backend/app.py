# app.py
from fastapi import FastAPI, UploadFile, File, Form, Request, HTTPException
from whisper_transcriber import transcribe_audio
from summarizer import generate_summary
from chat_handler import get_chatbot_reply
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import tempfile, shutil, os, json
from typing import List

app = FastAPI()

UPLOAD_DIR = "storage"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# 🔓 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
    task_id = data.get("task", "default")  # changed key to match frontend
    reply = get_chatbot_reply(user_message, task_id=task_id)
    return {"reply": reply}

@app.get("/chat-history")
async def get_chat_history(task: str):
    safe_task = task.strip().lower().replace(" ", "_")
    history_path = os.path.join(UPLOAD_DIR, safe_task, "chat_history.json")

    if not os.path.exists(history_path):
        return JSONResponse(content={"history": []})

    with open(history_path, "r") as f:
        data = json.load(f)

    return {"history": data}

@app.post("/upload")
async def upload_file(
    task_id: str = Form(...),
    files: List[UploadFile] = File(...)
):
    safe_task = task_id.strip().lower().replace(" ", "_")
    task_folder = os.path.join(UPLOAD_DIR, safe_task)
    os.makedirs(task_folder, exist_ok=True)

    saved_files = []
    for file in files:
        file_location = os.path.join(task_folder, file.filename)
        with open(file_location, "wb") as f:
            f.write(await file.read())
        saved_files.append(file.filename)

    return {
        "status": "success",
        "task": safe_task,
        "filenames": saved_files
    }

@app.post("/delete-task-folder")
async def delete_task(task_name: str = Form(...)):
    safe_task = task_name.strip().lower().replace(" ", "_")
    task_folder = os.path.join(UPLOAD_DIR, safe_task)

    if os.path.exists(task_folder) and os.path.isdir(task_folder):
        shutil.rmtree(task_folder)
        return {"status": "deleted", "task": safe_task}
    else:
        raise HTTPException(status_code=404, detail="Folder not found")
