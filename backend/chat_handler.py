# chat_handler.py
import os
import json
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
    "Keep answers, concise and brief unless it is necessary to expand on details"
    "Support both English and Arabic users where needed. Avoid overly casual language unless the user prompts you to be informal."
)

CHAT_HISTORY_FILENAME = "chat_history.json"


def get_chatbot_reply(message: str, task_id: str = "default") -> str:
    safe_task = task_id.strip().lower().replace(" ", "_")
    task_folder = os.path.join("storage", safe_task)
    os.makedirs(task_folder, exist_ok=True)

    history_path = os.path.join(task_folder, CHAT_HISTORY_FILENAME)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if os.path.exists(history_path):
        try:
            with open(history_path, "r") as f:
                messages += json.load(f)
        except Exception:
            pass

    messages.append({"role": "user", "content": message})

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages
        )

        reply = response.choices[0].message.content.strip()
        messages.append({"role": "assistant", "content": reply})

        with open(history_path, "w") as f:
            json.dump(messages[1:], f, indent=2)

        return reply

    except Exception as e:
        return f"⚠️ Error: {str(e)}"
