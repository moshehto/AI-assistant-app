import React, { useState, useEffect } from 'react';
import '../styling/taskmanager.css';

export default function TaskManager() {
  const [newTaskName, setNewTaskName] = useState('');
  const [localTasks, setLocalTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const rawTasks = await window.electronAPI?.getTaskList?.();
      const mapped = rawTasks.map(value => {
        let label;
        if (value === 'default') {
          label = '🗂️ Default Task';
        } else {
          const name = value.replace(/_/g, ' ');
          label = `🆕 ${name}`;
        }
        return { label, value };
      });
      setLocalTasks(mapped);
    };
    fetchTasks();
  }, []);

  const handleAdd = () => {
    const trimmed = newTaskName.trim();
    if (!trimmed) return;

    const value = trimmed.toLowerCase().replace(/\s+/g, '_');
    const exists = localTasks.some(t => t.value === value);
    if (exists) return;

    const newTask = { label: `🆕 ${trimmed}`, value };
    setLocalTasks(prev => [...prev, newTask]);
    window.electronAPI?.sendNewTask(trimmed);
    setNewTaskName('');
  };

  const handleDelete = async (value) => {
    if (value === 'default') return; // Prevent deletion here, handled separately

    setLocalTasks(prev => prev.filter(t => t.value !== value));
    window.electronAPI?.deleteTask(value);

    try {
      const formData = new FormData();
      formData.append("task_name", value);
      await fetch("http://localhost:8000/delete-task-folder", {
        method: "POST",
        body: formData
      });
    } catch (err) {
      console.error("❌ Failed to delete folder:", err);
    }
  };

  const handleClearDefaultTask = async () => {
    try {
      const formData = new FormData();
      formData.append("task_name", "default");
      await fetch("http://localhost:8000/delete-task-folder", {
        method: "POST",
        body: formData
      });
    } catch (err) {
      console.error("❌ Failed to clear default folder:", err);
    }
  };

  return (
    <div className="task-manager-overlay">
      <div className="task-manager-modal">
        <h3>🧠 Manage Tasks</h3>
        <ul>
          {localTasks.map((task, i) => (
            <li key={i} className="task-item">
              {task.label}
              {task.value === 'default' ? (
                <button onClick={handleClearDefaultTask}>🗑️</button>
              ) : (
                <button onClick={() => handleDelete(task.value)}>🗑️</button>
              )}
            </li>
          ))}
        </ul>
        <div className="task-input">
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="New Task Name"
          />
          <button onClick={handleAdd}>➕ Add</button>
        </div>
      </div>
    </div>
  );
}
