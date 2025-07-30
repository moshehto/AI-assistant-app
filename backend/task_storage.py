# backend/task_storage.py
import json
import os

TASK_FILE = "tasks.json"

def load_tasks():
    if not os.path.exists(TASK_FILE):
        return ["default"]
    with open(TASK_FILE, "r") as f:
        return json.load(f)

def save_tasks(tasks):
    with open(TASK_FILE, "w") as f:
        json.dump(tasks, f)

def add_task(task):
    tasks = load_tasks()
    if task not in tasks:
        tasks.append(task)
        save_tasks(tasks)

def delete_task(task):
    tasks = load_tasks()
    if task in tasks and task != "default":
        tasks.remove(task)
        save_tasks(tasks)
