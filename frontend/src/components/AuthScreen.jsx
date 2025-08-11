//AuthScreen.jsx
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import '../styling/authscreen.css';

export default function AuthScreen() {
  const { api, state } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    organizationName: ''
  });

  const API_BASE = 'https://chatbot-backend-fwl6.onrender.com';

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const result = await api.login(formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error);
    } else {
      // ADDED: Send resize signal to Electron after successful login
      if (window.electronAPI?.send) {
        console.log('Sending auth-success signal to resize window');
        window.electronAPI.send('auth-success');
      }
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.detail || data.message || 'Signup failed';
        throw new Error(errorMsg);
      }

      setSuccess('Account created successfully! Please check your email for a confirmation link, then return here to login.');
      setIsLogin(true);
      setFormData({ 
        ...formData,
        password: '', 
        confirmPassword: '',
        fullName: ''
      });

    } catch (error) {
      console.error('Signup error:', error);
      let errorMessage = error.message;
      if (errorMessage.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please login instead.';
      } else if (errorMessage.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      }
      setError(errorMessage);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({
      email: formData.email,
      password: '',
      confirmPassword: '',
      fullName: '',
      organizationName: ''
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-decoration">
          <div className="floating-orb orb-1"></div>
          <div className="floating-orb orb-2"></div>
          <div className="floating-orb orb-3"></div>
        </div>
      </div>
      
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">🤖</div>
              <h1>AI Assistant</h1>
            </div>
            <p className="auth-subtitle">
              {isLogin ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <span className="alert-icon">✅</span>
              {success}
            </div>
          )}

          <form onSubmit={isLogin ? handleLogin : handleSignup} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required={!isLogin}
                  placeholder="Enter your full name"
                  disabled={state.loading}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
                disabled={state.loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder={isLogin ? "Enter your password" : "Create a password (min 6 characters)"}
                disabled={state.loading}
                minLength={isLogin ? undefined : 6}
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!isLogin}
                  placeholder="Confirm your password"
                  disabled={state.loading}
                />
              </div>
            )}

            <button 
              type="submit" 
              className={`auth-submit ${state.loading ? 'loading' : ''}`}
              disabled={state.loading}
            >
              {state.loading ? (
                <>
                  <span className="loading-spinner"></span>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                type="button" 
                onClick={toggleMode}
                className="auth-toggle"
                disabled={state.loading}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        <div className="auth-info">
          <div className="info-card">
            <h3>🚀 Powerful AI Assistant</h3>
            <p>Chat with your documents, get instant answers, and boost your productivity.</p>
          </div>
          <div className="info-card">
            <h3>🔒 Secure & Private</h3>
            <p>Your data is encrypted and stored securely. We respect your privacy.</p>
          </div>
          <div className="info-card">
            <h3>👥 Team Collaboration</h3>
            <p>Share knowledge with your team and collaborate on projects seamlessly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}