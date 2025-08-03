import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import FloatingBar from './components/FloatingBar'
import Chatbot from './components/Chatbot'
import './App.css'
import './styling/floatingbar.css'

function App() {
  return (
    <Router>
      <FloatingBar /> {/* will show on all routes */}
      <Routes>
        <Route path="/chatbot" element={<Chatbot />} />
      </Routes>
    </Router>
  );
}

export default App



