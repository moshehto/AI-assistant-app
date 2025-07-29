import React from 'react';
import '../styling/floatingbar.css';
import UploadFile from './UploadFile'; // ⬅️ Import your new component

export default function FloatingBar() {
  function openHelloWindow() {
    console.log('🧠 click fired');
    window.electronAPI?.openHelloWindow?.();
  }

  return (
    <div className="floating-bar">
      <button className="bar-btn" title="Start">🎙️</button>
      <button className="bar-btn" title="Stop">⏹️</button>
      <UploadFile /> {/* ⬅️ Replaces the Get Form button */}
      <button className="bar-btn" title="Summary" onClick={openHelloWindow}>🧠</button>
      <div className="drag-fill" />
      <button className="bar-btn close-btn" title="Minimize" onClick={() => window.electronAPI?.minimizeWindow?.()}>─</button>
    </div>
  );
}
