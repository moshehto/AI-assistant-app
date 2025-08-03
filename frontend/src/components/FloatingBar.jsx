import React, { useState, useEffect } from 'react';
import '../styling/floatingbar.css';
import UploadFile from './UploadFile';

export default function FloatingBar() {
  const [tasks, setTasks] = useState([
    { label: '🗂️ Default Task', value: 'default' },
    { label: '⚙️ Manage Tasks', value: 'manage_tasks' }
  ]);

  const [selectedTask, setSelectedTask] = useState('default');

  // ✅ Load tasks from disk on app start
  useEffect(() => {
    const loadTasks = async () => {
      const rawTasks = await window.electronAPI?.getTaskList?.();
      const mapped = rawTasks.map(value => {
        const label = value === 'default'
          ? '🗂️ Default Task'
          : `🆕 ${value.replace(/_/g, ' ')}`;
        return { label, value };
      });

      // Add Manage Tasks option at end
      setTasks([...mapped, { label: '⚙️ Manage Tasks', value: 'manage_tasks' }]);
    };

    loadTasks();
  }, []);

  

  // ✅ Handle adding tasks from TaskManager
  useEffect(() => {
    const handleNewTask = (_, taskName) => {
      const value = taskName.toLowerCase().replace(/\s+/g, '_');
      const newTask = {
        label: `🆕 ${taskName}`,
        value
      };

      setTasks(prev => {
        const exists = prev.some(task => task.value === value);
        if (exists) return prev;

        const withoutManage = prev.filter(t => t.value !== 'manage_tasks');
        return [...withoutManage, newTask, { label: '⚙️ Manage Tasks', value: 'manage_tasks' }];
      });

      setSelectedTask(value);
    };

    window.electronAPI?.onNewTask?.(handleNewTask);
    return () => window.electronAPI?.removeNewTaskListener?.(handleNewTask);
  }, []);

  // ✅ Handle deleting tasks from TaskManager
  useEffect(() => {
    const handleDeleteTask = (_, valueToDelete) => {
      if (valueToDelete === 'default') return;

      setTasks(prev => {
        const filtered = prev.filter(t => t.value !== valueToDelete && t.value !== 'manage_tasks');
        return [...filtered, { label: '⚙️ Manage Tasks', value: 'manage_tasks' }];
      });

      if (selectedTask === valueToDelete) {
        setSelectedTask('default');
      }
    };

    window.electronAPI?.onDeleteTask?.(handleDeleteTask);
    return () => window.electronAPI?.removeDeleteTaskListener?.(handleDeleteTask);
  }, [selectedTask]);

  const handleTaskChange = (e) => {
    const selected = e.target.value;
    if (selected === 'manage_tasks') {
      window.electronAPI?.openTaskManagerWindow?.();
    } else {
      setSelectedTask(selected);
    }
  };

  return (
    <div className="floating-bar">
      <select
        className="task-dropdown"
        value={selectedTask}
        onChange={handleTaskChange}
        title="Choose Task Context"
      >
        {tasks.map((task, index) => (
          <option key={index} value={task.value}>
            {task.label}
          </option>
        ))}
      </select>

      <button className="bar-btn" title="Start">🎙️</button>
      <button className="bar-btn" title="Stop">⏹️</button>
      
      {/* ✅ Now matches your theme perfectly */}
      <UploadFile 
        currentTask={selectedTask} 
        className="bar-btn"
        title="Upload File"
      />
      
      <button className="bar-btn" title="Summary" onClick={() => window.electronAPI?.openChatbotWindow?.(selectedTask)}>🧠</button>
      <div className="drag-fill" />
      <button className="bar-btn close-btn" title="Minimize" onClick={() => window.electronAPI?.minimizeWindow?.()}>─</button>
    </div>
  );
}
