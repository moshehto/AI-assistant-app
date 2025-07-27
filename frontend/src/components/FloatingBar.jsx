import React from 'react';
import '../styling/floatingbar.css';

export default function FloatingBar() {
  // 👇 This function sends an IPC message to the Electron backend
  function openHelloWindow() {
    console.log('🧠 click fired');
    window.electronAPI?.openHelloWindow?.(); // defined in preload.js
  }

  return (
    <div className="floating-bar">
      <button className="bar-btn" title="Start">🎙️</button>
      <button className="bar-btn" title="Stop">⏹️</button>
      <button className="bar-btn" title="Get Form">📄</button>
      <button className="bar-btn" title="Summary" onClick={openHelloWindow}>🧠</button>
      <div className="drag-fill" />
      <button className="bar-btn close-btn" title="Minimize" onClick={() => window.electronAPI?.minimizeWindow?.()}>─</button>
    </div>
  );
}
