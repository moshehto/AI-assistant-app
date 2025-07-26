import React, { useState, useEffect } from 'react'
import '../styling/floatingbar.css'

export default function FloatingBar({ onShowForm }) {
  const [appWindow, setAppWindow] = useState(null)

  useEffect(() => {
    if (window.__TAURI__) {
      import('@tauri-apps/api/window').then((mod) => {
        setAppWindow(mod.getCurrent())
      })
    }
  }, [])

  const handleClick = () => {
    console.log('📄 Get Form clicked')
    if (onShowForm) {
      onShowForm()
    }
  }

  return (
    <div className="floating-bar" data-tauri-drag-region>
      <button className="bar-btn" title="Start">🎙️</button>
      <button className="bar-btn" title="Stop">⏹️</button>
      <button className="bar-btn" title="Get Form" onClick={handleClick}>📄</button>
      <button className="bar-btn" title="Summary">🧠</button>
      <div className="drag-fill" data-tauri-drag-region />
      <button
        className="bar-btn close-btn"
        onClick={() => appWindow?.minimize()}
        title="Minimize"
      >─</button>
    </div>
  )
}
