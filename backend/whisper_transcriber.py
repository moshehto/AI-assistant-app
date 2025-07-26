import whisper

model = whisper.load_model("small")  # You can use "small", "medium", "large"

def transcribe_audio(file_path: str) -> str:
    result = model.transcribe(file_path)
    return result["text"]
