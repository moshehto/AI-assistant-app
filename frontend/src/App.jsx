// App.jsx - Updated to handle authentication
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContexts'
import { useAuth } from './hooks/useAuth'
import { useElectronAuth } from './hooks/useElectronAuth'
import FloatingBar from './components/FloatingBar'
import Chatbot from './components/Chatbot'
import LoginWindow from './components/LogIn'
import './App.css'
import './styling/floatingbar.css'

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <LoginWindow />
  }
  
  return children
}

// Main app wrapper
const AppContent = () => {
  const { isAuthenticated } = useAuth()
  
  // Add the Electron auth sync hook
  useElectronAuth()
  
  return (
    <Router>
      {isAuthenticated && <FloatingBar />}
      <Routes>
        <Route path="/chatbot" element={
          <ProtectedRoute>
            <Chatbot />
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <Navigate to="/" replace />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App