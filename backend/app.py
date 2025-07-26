from fastapi import FastAPI, UploadFile, File, Form
from whisper_transcriber import transcribe_audio
from summarizer import generate_summary
import tempfile
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 👇 Allow access from frontend during dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # You can also use ["*"] for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/transcribe-and-summarize")
async def transcribe_and_summarize(
    audio: UploadFile = File(...),
    summary_language: str = Form("english")
):
    # Save uploaded audio to a temporary file
    with tempfile.NamedTemporaryFile(delete=True, suffix=".webm") as temp_file:
        temp_file.write(await audio.read())
        temp_file.flush()  # Ensure it's written to disk

        # Transcribe and summarize
        transcript = transcribe_audio(temp_file.name)
        summary = generate_summary(transcript, language=summary_language)

    return {
        "transcript": transcript,
        "summary": summary
    }
