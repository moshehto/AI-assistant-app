import React, { useState } from 'react';
import '../styling/taskmanager.css';

export default function TaskManager() {
  const [newTaskName, setNewTaskName] = useState('');
  const [localTasks, setLocalTasks] = useState([
    { label: '🗂️ Default Task', value: 'default' }
  ]);

  const handleAdd = () => {
    const trimmed = newTaskName.trim();
    if (!trimmed) return;

    const value = trimmed.toLowerCase().replace(/\s+/g, '_');
    const exists = localTasks.some(t => t.value === value);
    if (exists) return;

    const newTask = { label: `🆕 ${trimmed}`, value };
    setLocalTasks(prev => [...prev, newTask]);

    // 🔁 Notify main window
    window.electronAPI?.sendNewTask(trimmed);
    setNewTaskName('');
  };

  const handleDelete = (value) => {
    if (value === 'default') return;

    setLocalTasks(prev => prev.filter(t => t.value !== value));
    // ✅ Notify main window of deletion
    window.electronAPI?.deleteTask(value);
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
