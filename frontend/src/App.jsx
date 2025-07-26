import React from 'react'
import { useState } from 'react'
import UploadForm from './components/UploadForm'
import FloatingBar from './components/FloatingBar'
import './App.css'
import './styling/floatingbar.css'

function App() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      <FloatingBar onShowForm={() => setShowForm(!showForm)} />
      {showForm && (
        <div id="content">
          <UploadForm />
        </div>
      )}
    </div>
  )
}

export default App




