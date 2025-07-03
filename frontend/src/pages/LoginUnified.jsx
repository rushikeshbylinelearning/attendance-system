// src/pages/LoginUnified.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import '@/styles/LoginUnified.css'; // Your new, unified CSS file

import { AlternateEmail as EmailIcon, Lock as LockIcon } from '@mui/icons-material';

function LoginUnified() {
  // All your state and logic is preserved perfectly
  const navigate = useNavigate();
  const [stage, setStage] = useState(null); // 'employee' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password, loginType: stage });
      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <>
      <div className="login-header">
        <h1 className="login-title">
          {stage === 'admin' ? 'Admin / Technician' : 'Employee Portal'}
        </h1>
        <p className="login-subtitle">Welcome back! Please sign in.</p>
      </div>

      <form onSubmit={handleLogin} className="login-form">
        {error && <div className="login-error">{error}</div>}

        <div className="login-form-group">
          <input
            id="email"
            type="email"
            className="login-input"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <EmailIcon className="login-input-icon" />
        </div>

        <div className="login-form-group">
          <input
            id="password"
            type="password"
            className="login-input"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <LockIcon className="login-input-icon" />
        </div>

        <button type="submit" className={`login-submit-btn ${loading ? 'is-loading' : ''}`} disabled={loading}>
          {loading ? <div className="login-spinner"></div> : 'Log In'}
        </button>
      </form>
      <div className="back-btn" onClick={() => setStage(null)}>
        ⬅ Back to Portal Selection
      </div>
    </>
  );

  const renderPortalSelection = () => (
    <>
      <div className="login-header">
        <h1 className="login-title">IT Management Portal</h1>
        <p className="login-subtitle">Please select your login portal to begin.</p>
      </div>
      <div className="login-form">
        <button className="portal-btn primary" onClick={() => setStage('employee')}>
          Employee Portal
        </button>
        <button className="portal-btn secondary" onClick={() => setStage('admin')}>
          Admin / Technician Portal
        </button>
      </div>
    </>
  );

  return (
    <div className="login-page-container">
      <div className="login-card-wrapper">
        {stage ? renderLoginForm() : renderPortalSelection()}
      </div>
    </div>
  );
}

export default LoginUnified;