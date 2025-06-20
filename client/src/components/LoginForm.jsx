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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
          Username
        </label>
        <div class="box_divider"/>
        <input
          type="text"
          id="username"
          className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div class="divider"/>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
          Password
        </label>
        <div class="box_divider"/>
        <input
          type="password"
          id="password"
          className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button class="btn2 neon-pulse"
        type="submit">
        <span>Log In</span>
      </button>
    </form>
  );
};

export default LoginForm;
