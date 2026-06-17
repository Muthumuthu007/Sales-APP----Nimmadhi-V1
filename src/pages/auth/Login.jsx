import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../../api/auth';
import { AuthContext } from '../../context/AuthContext';
import { ShieldAlert, Moon, Sparkles } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const response = await loginApi({ 
        username: username.trim(), 
        password 
      });
      
      // Centralized authentication mapping for all 3 setups
      const role = response.role;
      
      login({
        token: response.token,
        role: role,
        outletId: response.outletId,
        username: response.username || username.trim(),
        empId: response.empId || null,
        empName: response.name || response.username || null
      });

      // Role-based dynamic routing
      if (role === 'MANAGER') {
        navigate('/dashboard', { replace: true });
      } else if (role === 'OUTLET') {
        navigate('/outlet', { replace: true });
      } else if (role === 'EMPLOYEE') {
        navigate('/employee/attendance', { replace: true });
      } else {
        setError('Unauthorized role detected.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="decor-circle circle-1"></div>
      <div className="decor-circle circle-2"></div>
      <div className="decor-circle circle-3"></div>

      <div className="login-container">
        {/* Left Side Panel - Brand Intro */}
        <div className="login-brand-panel">
          <div className="brand-header">
            <span className="brand-logo-icon">💤</span>
            <span className="brand-pill">PREMIUM SLEEP TECH</span>
          </div>
          
          <div className="brand-showcase">
            <h1 className="brand-title">NIMMADHI MATTRESS</h1>
            <p className="brand-tagline">Your Peace of Mind, Crafted in Sleep.</p>
            <p className="brand-description">
              Experience the perfect harmony of spinal support and luxurious comfort. 
              Designed scientifically to offer uninterrupted sleep, night after night.
            </p>
          </div>

          <div className="brand-features">
            <div className="feature-item">
              <div className="feature-icon"><Moon size={18} /></div>
              <div className="feature-text">
                <strong>Tranquil Comfort</strong>
                <span>Pressure-relieving ergonomic zones.</span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><Sparkles size={18} /></div>
              <div className="feature-text">
                <strong>Premium Materials</strong>
                <span>100% breathable organic latex fabrics.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Panel - Dynamic Login Form */}
        <div className="login-form-panel">
          <div className="form-inner">
            <div className="form-header">
              <h2>NIMMADHI MATTRESS</h2>
              <p>Sign in to manage operations, outlets, and attendance.</p>
            </div>

            {error && (
              <div className="error-alert">
                <ShieldAlert size={20} className="error-icon" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="premium-form">
              <div className="premium-input-group">
                <label className="premium-label">Username / Mobile</label>
                <div className="input-with-icon">
                  <input 
                    type="text" 
                    placeholder="Username or mobile number"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="premium-input"
                    required
                  />
                </div>
              </div>

              <div className="premium-input-group">
                <label className="premium-label">Password</label>
                <div className="input-with-icon">
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="premium-input"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="premium-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="btn-loading-flex">
                    <span className="spinner-mini"></span>
                    Authenticating...
                  </span>
                ) : 'Enter Portal'}
              </button>
            </form>
          </div>

          <div className="form-footer">
            © 2026 NIMMADHI MATTRESS Systems. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
