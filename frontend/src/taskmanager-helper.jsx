import React from 'react';
import { createRoot } from 'react-dom/client';
import TaskManager from './components/TaskManager';

createRoot(document.getElementById('taskmanager-root')).render(<TaskManager />);
