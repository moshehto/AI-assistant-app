//AuthScreen.jsx
import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Loader, Eye, EyeOff, Shield } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import '../styling/authscreen.css';

export default function AuthScreen() {
  const { api, state } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    organizationName: ''
  });

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://chatbot-backend-fwl6.onrender.com';

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
    <div className="private-auth-container">
      <div className="private-auth-content">
        <div className="private-auth-card">
          <div className="private-auth-header">
            <div className="private-auth-logo">
              <Shield size={32} className="private-logo-icon" />
              <h1>Private.ly</h1>
            </div>
            <p className="private-auth-subtitle">
              {isLogin ? 'Welcome back to your secure workspace' : 'Create your private account to get started'}
            </p>
          </div>

          {error && (
            <div className="private-error-banner">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="private-success-banner">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={isLogin ? handleLogin : handleSignup} className="private-auth-form">
            {!isLogin && (
              <div className="private-form-group">
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
                  className="private-form-input"
                />
              </div>
            )}

            <div className="private-form-group">
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
                className="private-form-input"
              />
            </div>

            <div className="private-form-group">
              <label htmlFor="password">Password</label>
              <div className="private-password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder={isLogin ? "Enter your password" : "Create a password (min 6 characters)"}
                  disabled={state.loading}
                  minLength={isLogin ? undefined : 6}
                  className="private-form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="private-password-toggle"
                  disabled={state.loading}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="private-form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="private-password-input">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required={!isLogin}
                    placeholder="Confirm your password"
                    disabled={state.loading}
                    className="private-form-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="private-password-toggle"
                    disabled={state.loading}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="private-auth-submit"
              disabled={state.loading}
            >
              {state.loading ? (
                <>
                  <Loader size={16} className="spinning" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="private-auth-footer">
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                type="button" 
                onClick={toggleMode}
                className="private-auth-toggle"
                disabled={state.loading}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        <div className="private-auth-features">
          <div className="private-feature-card">
            <Shield size={24} className="private-feature-icon" />
            <h3>Enterprise Security</h3>
            <p>Military-grade encryption protects your sensitive data and conversations.</p>
          </div>
          <div className="private-feature-card">
            <CheckCircle size={24} className="private-feature-icon" />
            <h3>Private by Design</h3>
            <p>Your documents and chats remain completely confidential and secure.</p>
          </div>
          <div className="private-feature-card">
            <Eye size={24} className="private-feature-icon" />
            <h3>Full Control</h3>
            <p>You own your data. Manage access, export, or delete anytime.</p>
          </div>
        </div>
      </div>
    </div>
  );
}