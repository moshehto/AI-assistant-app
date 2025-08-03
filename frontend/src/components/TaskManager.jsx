import React, { useState, useEffect } from 'react';
import '../styling/taskmanager.css';

export default function TaskManager() {
  const [newTaskName, setNewTaskName] = useState('');
  const [localTasks, setLocalTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = 'https://chatbot-backend-fwl6.onrender.com';

  // Fetch tasks from backend
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/tasks`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const tasks = data.tasks || [];
      
      // Map tasks to display format
      const mapped = tasks.map(value => {
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
      
      // Also update Electron if available (for local storage sync)
      if (window.electronAPI?.updateTaskList) {
        window.electronAPI.updateTaskList(tasks);
      }
      
    } catch (err) {
      console.error('❌ Failed to fetch tasks:', err);
      setError('Failed to load tasks from server');
      
      // Fallback to Electron API if available
      try {
        if (window.electronAPI?.getTaskList) {
          const rawTasks = await window.electronAPI.getTaskList();
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
          setError('Using local tasks (server unavailable)');
        }
      } catch (electronErr) {
        console.error('❌ Electron fallback failed:', electronErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const trimmed = newTaskName.trim();
    if (!trimmed) return;

    const value = trimmed.toLowerCase().replace(/\s+/g, '_');
    const exists = localTasks.some(t => t.value === value);
    if (exists) {
      setError('Task already exists');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Add to backend
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: trimmed })
      });

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.statusText}`);
      }

      // Add to local state immediately for better UX
      const newTask = { label: `🆕 ${trimmed}`, value };
      setLocalTasks(prev => [...prev, newTask]);

      // Update Electron if available
      if (window.electronAPI?.sendNewTask) {
        window.electronAPI.sendNewTask(trimmed);
      }

      setNewTaskName('');
      
      // Refresh tasks from server to ensure sync
      setTimeout(() => fetchTasks(), 1000);

    } catch (err) {
      console.error('❌ Failed to add task:', err);
      setError(`Failed to create task: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (value) => {
    if (value === 'default') {
      // For default task, we'll clear its contents instead of deleting
      handleClearDefaultTask();
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Delete from backend
      const response = await fetch(`${API_BASE}/api/tasks/${encodeURIComponent(value)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.statusText}`);
      }

      // Remove from local state immediately
      setLocalTasks(prev => prev.filter(t => t.value !== value));

      // Update Electron if available
      if (window.electronAPI?.deleteTask) {
        window.electronAPI.deleteTask(value);
      }

      // Refresh tasks from server to ensure sync
      setTimeout(() => fetchTasks(), 1000);

    } catch (err) {
      console.error('❌ Failed to delete task:', err);
      setError(`Failed to delete task: ${err.message}`);
      
      // Restore the task in local state if deletion failed
      fetchTasks();
    } finally {
      setLoading(false);
    }
  };

  const handleClearDefaultTask = async () => {
    setLoading(true);
    setError('');

    try {
      // Get all files for default task and delete them
      const filesResponse = await fetch(`${API_BASE}/api/files?task=default`);
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        const files = filesData.files || [];

        // Delete each file
        for (const file of files) {
          try {
            await fetch(`${API_BASE}/api/files/${encodeURIComponent(file.id)}`, {
              method: 'DELETE'
            });
          } catch (fileErr) {
            console.error(`Failed to delete file ${file.name}:`, fileErr);
          }
        }
      }

      setError('Default task cleared successfully');
      
    } catch (err) {
      console.error('❌ Failed to clear default task:', err);
      setError(`Failed to clear default task: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="task-manager-overlay">
      <div className="task-manager-modal">
        <div className="task-manager-header">
          <h3>🧠 Manage Tasks</h3>
          <button 
            className="refresh-btn"
            onClick={fetchTasks}
            disabled={loading}
            title="Refresh tasks"
          >
            {loading ? '⏳' : '🔄'}
          </button>
        </div>

        {error && (
          <div className={`error-message ${error.includes('successfully') ? 'success' : 'error'}`}>
            {error}
          </div>
        )}

        <div className="tasks-container">
          {loading && localTasks.length === 0 ? (
            <div className="loading-state">Loading tasks...</div>
          ) : (
            <ul>
              {localTasks.map((task, i) => (
                <li key={i} className="task-item">
                  <span className="task-label">{task.label}</span>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(task.value)}
                    disabled={loading}
                    title={task.value === 'default' ? 'Clear default task files' : 'Delete task and all files'}
                  >
                    {task.value === 'default' ? '🗑️ Clear' : '🗑️'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="task-input">
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="New Task Name"
            disabled={loading}
          />
          <button 
            onClick={handleAdd}
            disabled={loading || !newTaskName.trim()}
          >
            {loading ? '⏳' : '➕ Add'}
          </button>
        </div>
        
        <div className="task-count">
          {localTasks.length} task{localTasks.length !== 1 ? 's' : ''} total
        </div>
      </div>
    </div>
  );
}