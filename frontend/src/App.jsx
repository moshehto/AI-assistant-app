import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import FloatingBar from './components/FloatingBar'
import UploadForm from './components/UploadForm'
import Chatbot from './components/Chatbot'
import './App.css'
import './styling/floatingbar.css'

function App() {
  return (
    <Router>
      <FloatingBar /> {/* will show on all routes */}
      <Routes>
        <Route path="/" element={<UploadForm />} />
        <Route path="/chatbot" element={<Chatbot />} />
      </Routes>
    </Router>
  );
}

export default App



