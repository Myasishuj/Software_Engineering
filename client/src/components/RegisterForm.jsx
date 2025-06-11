import React, { useState } from 'react';
import { API_BASE_URL } from '../config/config';

// Register Form Component
const RegisterForm = ({ setIsLoading, setMessage, onRegistrationSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // New state for role during registration (optional, for simple admin creation)
  const [role, setRole] = useState('user');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }), // Include role in registration
      });

      const data = await response.json();

      if (response.ok) {
        onRegistrationSuccess(); // Trigger success callback in parent
      } else {
        setMessage(data.msg || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error (check backend server):', error);
      setMessage('Network error. Please ensure the backend server is running and accessible at ' + API_BASE_URL);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-username">
          Username
        </label>
        <input
          type="text"
          id="new-username"
          className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-password">
          Password
        </label>
        <input
          type="password"
          id="new-password"
          className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {/* Optional role selection for registration. In a real app, this might be controlled on backend or admin panel */}
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-role">
          Role
        </label>
        <select
          id="new-role"
          className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-300 transform hover:scale-105"
      >
        Register
      </button>
    </form>
  );
};

export default RegisterForm;