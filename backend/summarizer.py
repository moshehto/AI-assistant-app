import os
import openai
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

def generate_summary(transcript: str, language: str = "english") -> str:
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": f"Summarize this transcript in {language}."},
            {"role": "user", "content": transcript}
        ]
    )
    return response.choices[0].message.content
