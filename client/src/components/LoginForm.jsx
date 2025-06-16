import React, { useState } from 'react';
import './LoginForm.css'; // Import CSS for styling

// Base URL for the backend API (needs to be consistent across components)
const API_BASE_URL = 'http://127.0.0.1:5000';

// Login Form Component
const LoginForm = ({ setIsLoading, setMessage, onAuthSuccess,onSwitchView }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // Use the correct API_BASE_URL and the /login endpoint
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Pass token, username, AND role to parent
        onAuthSuccess(data.access_token, username, data.role);
      } else {
        setMessage(data.msg || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error (check backend server):', error);
      setMessage('Network error. Please ensure the backend server is running and accessible at ' + API_BASE_URL);
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <div className="login-fullscreen">
    <div className="box">
      <div className="form">
        <h4>Log In</h4>
        <form onSubmit={handleSubmit}>
          <div className="inputBox">
            <input
              type="text"
              id="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <span>Username</span>
            <i></i>
          </div>

          <div className="inputBox">
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span>Password</span>
            <i></i>
          </div>

          <div className="loglinks">
            <a href="#">Forgot Password</a>
          </div>

          <button type="submit" className="submit-btn">
            Log In
          </button>
          <p className="toggle-auth-text">
            Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchView}
            className="text-blue-600 hover:text-blue-800 font-medium"
  >
            Register here.
  </button>
</p>
        </form>
      </div>
    </div>
  </div>
);
};

export default LoginForm;
