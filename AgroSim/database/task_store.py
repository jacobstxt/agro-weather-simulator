from enum import Enum

class TaskStatus(str, Enum):
    running = "running"
    done = "done"
    error = "error"

tasks = {}

def create_task(task_id: int):
    tasks[task_id] = {"status": TaskStatus.running, "result": None, "error": None}

def update_task(task_id: int, result: dict):
    tasks[task_id] = {"status": TaskStatus.done, "result": result, "error": None}

def fail_task(task_id: int, error: str):
    tasks[task_id] = {"status": TaskStatus.error, "result": None, "error": error}

def get_task(task_id: int):
    return tasks.get(task_id)