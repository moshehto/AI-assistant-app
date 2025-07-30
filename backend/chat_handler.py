import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = (
    "You are an intelligent, professional workplace assistant running locally on the user's device. "
    "Your role is to help with tasks, answer questions, and analyze content from local files when available. "
    "You have access to private files stored on the user's machine, but you only reference them when explicitly asked. "
    "Maintain a helpful, clear, and respectful tone. Never invent information, and always prioritize accuracy, context-awareness, and privacy. "
    "If a file or document is relevant, refer to it only if it’s available. "
    "Support both English and Arabic users where needed. Avoid overly casual language unless the user prompts you to be informal."
)

def get_chatbot_reply(message: str) -> str:
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # You can use "gpt-4" if needed
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": message}
            ],
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"⚠️ Error: {str(e)}"


