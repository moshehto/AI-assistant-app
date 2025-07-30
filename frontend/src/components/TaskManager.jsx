import React, { useState, useEffect } from 'react';
import '../styling/taskmanager.css';

export default function TaskManager() {
  const [newTaskName, setNewTaskName] = useState('');
  const [localTasks, setLocalTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const tasks = await window.electronAPI?.getTaskList?.();
      setLocalTasks(tasks.map(value => ({
        label: value === 'default' ? '🗂️ Default Task' : `🆕 ${value}`,
        value
      })));
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
    if (value === 'default') return;
  
    // Frontend update
    setLocalTasks(prev => prev.filter(t => t.value !== value));
  
    // Notify main window
    window.electronAPI?.deleteTask(value);
  
    // 🧹 Notify backend to delete folder
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
  

  return (
    <div className="task-manager-overlay">
      <div className="task-manager-modal">
        <h3>🧠 Manage Tasks</h3>
        <ul>
          {localTasks.map((task, i) => (
            <li key={i} className="task-item">
              {task.label}
              {task.value !== 'default' && (
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
