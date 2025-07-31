import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from embedding_store import search  # Make sure this is implemented
from doc_analyzer import analyze_document  # Optional if used for initial processing

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = (
    "You are an intelligent, professional workplace assistant running locally on the user's device. "
    "Respond using Markdown formatting: use **bold**, _italic_, `code blocks`, bullet points, and headers where helpful. "
    "Always prioritize clarity and structure. Keep answers concise unless detail is explicitly needed. "
    "Support both English and Arabic users where needed. Avoid overly casual language unless the user prompts you to be informal."
)

CHAT_HISTORY_FILENAME = "chat_history.json"

def get_chatbot_reply(message: str, task_id: str = "default") -> str:
    safe_task = task_id.strip().lower().replace(" ", "_")
    task_folder = os.path.join("storage", safe_task)
    os.makedirs(task_folder, exist_ok=True)

    history_path = os.path.join(task_folder, CHAT_HISTORY_FILENAME)
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Load chat history if exists
    if os.path.exists(history_path):
        try:
            with open(history_path, "r") as f:
                messages += json.load(f)
        except Exception:
            pass

    # Append the new user message
    messages.append({"role": "user", "content": message})

    # ✅ Always perform semantic search against task documents
    try:
        top_chunks = search(safe_task, message, k=5)
        if top_chunks:
            retrieved = "\n---\n".join(top_chunks)
            messages.append({
                "role": "system",
                "content": f"Relevant information retrieved from uploaded documents:\n{retrieved}"
            })
    except Exception as e:
        print(f"[⚠️ Document Search Failed] {str(e)}")

    # 🔁 Call OpenAI Chat API
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages
        )
        reply = response.choices[0].message.content.strip()
        messages.append({"role": "assistant", "content": reply})

        with open(history_path, "w") as f:
            json.dump(messages[1:], f, indent=2)  # Skip the system prompt in saved history

        return reply

    except Exception as e:
        return f"⚠️ Error: {str(e)}"
