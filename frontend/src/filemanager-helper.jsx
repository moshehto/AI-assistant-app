import React from 'react';
import { createRoot } from 'react-dom/client';
import FileManager from './components/FileManager';

createRoot(document.getElementById('filemanager-root')).render(<FileManager />);