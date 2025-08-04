import React, { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Create a fresh client directly in this component
const testClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const SimpleLoginTest = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult('Starting test...')
    
    try {
      console.log('Testing with:', { email, password })
      
      const { data, error } = await testClient.auth.signInWithPassword({
        email,
        password
      })
      
      console.log('Direct result:', { data, error })
      
      if (error) {
        setResult(`Error: ${error.message}`)
      } else {
        setResult(`Success! User: ${data.user.email}`)
        
        // Try to notify Electron
        if (window.electronAPI) {
          window.electronAPI.loginSuccess(data.user)
        }
      }
    } catch (err) {
      console.error('Catch error:', err)
      setResult(`Catch error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>Simple Login Test</h2>
      
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: 'block', margin: '10px 0', padding: '5px', width: '200px' }}
      />
      
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: 'block', margin: '10px 0', padding: '5px', width: '200px' }}
      />
      
      <button 
        onClick={testLogin} 
        disabled={loading}
        style={{ padding: '10px 20px', margin: '10px 0' }}
      >
        {loading ? 'Testing...' : 'Test Login'}
      </button>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <strong>Result:</strong> {result}
      </div>
    </div>
  )
}

export default SimpleLoginTest