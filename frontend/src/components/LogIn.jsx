import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import '../styling/login.css';

const LoginWindow = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    organizationCode: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  console.log('🔧 LoginWindow: Component rendered')
  const { login, register } = useAuth()
  console.log('🔧 LoginWindow: useAuth returned:', { login, register })

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (error) setError('')
    if (successMessage) setSuccessMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('🔧 LoginWindow: handleSubmit called')
      let result

      if (isLogin) {
        console.log('🔧 LoginWindow: Calling login function...')
        result = await login(formData.email, formData.password)
        console.log('🔧 LoginWindow: Login result:', result)
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match')
        }
        if (!formData.organizationCode.trim()) {
          throw new Error('Organization code is required')
        }
        if (!formData.fullName.trim()) {
          throw new Error('Full name is required')
        }

        console.log('🔧 LoginWindow: Calling register function...')
        result = await register(
          formData.email,
          formData.password,
          formData.organizationCode.trim(),
          formData.fullName.trim()
        )
        console.log('🔧 LoginWindow: Register result:', result)
      }

      if (result.success) {
        if (result.requiresConfirmation) {
          setSuccessMessage('Account created successfully! Please check your email to confirm your account.')
          setFormData({
            email: formData.email, // Keep email for convenience
            password: '',
            confirmPassword: '',
            fullName: '',
            organizationCode: ''
          })
          setIsLogin(true) // Switch to login mode
        }
        // If login successful, the AuthContext will handle navigation automatically
      } else {
        setError(result.error || 'Authentication failed')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setSuccessMessage('')
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      organizationCode: ''
    })
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <h1 className="login-title">
            {isLogin ? 'Welcome Back' : 'Join Your Team'}
          </h1>
          <p className="login-subtitle">
            {isLogin 
              ? 'Sign in to access your workspace' 
              : 'Create your account to get started'
            }
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            <p>{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Full Name - Only for registration */}
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your full name"
                required={!isLogin}
              />
            </div>
          )}

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Organization Code - Only for registration */}
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="organizationCode" className="form-label">
                Organization Code
              </label>
              <input
                type="text"
                id="organizationCode"
                name="organizationCode"
                value={formData.organizationCode}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your organization code"
                required={!isLogin}
              />
              <p className="form-helper">
                Get this code from your organization admin
              </p>
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Confirm Password - Only for registration */}
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Confirm your password"
                required={!isLogin}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`submit-button ${loading ? 'loading' : ''}`}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="toggle-section">
          <button
            type="button"
            onClick={toggleMode}
            className="toggle-button"
          >
            {isLogin 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"
            }
          </button>
        </div>

        {/* Organization Code Info */}
        {isLogin && (
          <div className="info-section">
            <p className="info-text">
              Need to join a new organization?{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="info-link"
              >
                Create an account
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LoginWindow