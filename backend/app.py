from fastapi import FastAPI, UploadFile, File, Form, Request
from whisper_transcriber import transcribe_audio
from summarizer import generate_summary
from chat_handler import get_chatbot_reply
import tempfile
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 👇 Allow access from frontend during dev
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
