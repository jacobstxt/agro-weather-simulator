from enum import Enum
import threading

class TaskStatus(str, Enum):
    running = "running"
    done = "done"
    error = "error"

tasks = {}
_lock = threading.Lock()

def create_task(task_id: int, user_id: int):
    with _lock:
        tasks[task_id] = {"status": TaskStatus.running, "result": None, "error": None, "user_id": user_id}

def update_task(task_id: int, result: dict):
    with _lock:
        tasks[task_id] = {"status": TaskStatus.done, "result": result, "error": None}

def fail_task(task_id: int, error: str):
    with _lock:
        tasks[task_id] = {"status": TaskStatus.error, "result": None, "error": error}

def get_task(task_id: int):
    with _lock:
        return tasks.get(task_id)