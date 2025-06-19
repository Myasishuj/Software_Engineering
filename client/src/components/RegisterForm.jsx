import React, { useState } from 'react';
// Adjusted import path: Assuming 'config' is one level up from this component's directory.
// For example, if RegisterForm.jsx is in 'src/components/auth/' and config.js is in 'src/config/',
// you might need to go up two levels. If RegisterForm.jsx is in 'src/auth/' and config.js in 'src/config/',
// you would need to go up one level. This path assumes the latter.
import { API_BASE_URL } from '../config/config'; 

// Register Form Component
const RegisterForm = ({ setIsLoading, setMessage, onRegistrationSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); // New state for email to store the user's email input
  const [role, setRole] = useState('user'); // Default role is 'user'

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
        // IMPORTANT: Ensure 'email' is included in the JSON body sent to the backend
        body: JSON.stringify({ username, password, email, role }), 
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
          New Username
        </label>
        <div class="box_divider"/>
        <input
          type="text"
          id="new-username"
          className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div class="divider"/>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-password">
          New Password
        </label>
        <div class="box_divider"/>
        <input
          type="password"
          id="new-password"
          className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      {/* THIS IS THE EMAIL INPUT FIELD */}
      <div class="divider"/>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-email">
          Email
        </label>
        <div class="box_divider3"/>
        <input
          type="email"
          id="new-email"
          className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required // Making email a required field for registration
        />
      </div>
      
      {/* Optional role selection for registration */}
      <div class="divider"/>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-role">
          Role
        </label>
        <div class="box_divider3"/>
        <select
          id="new-role"
          className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="tester">Tester</option> {/* Added Tester role option */}
        </select>
      </div>
      <button class="btn neon-pulse"
        type="submit">
        <span>Register</span>
      </button>
    </form>
  );
};

export default RegisterForm;
