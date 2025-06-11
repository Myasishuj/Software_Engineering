// src/components/RegisterForm.jsx
import React, { useState } from 'react';
import { API_BASE } from '../api';

export default function RegisterForm({ setIsLoading, setMessage, onRegistrationSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok) {
        onRegistrationSuccess();
      } else {
        setMessage(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      setMessage('Network error: Backend not reachable');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="new-username" className="block text-gray-700">Username</label>
        <input
          id="new-username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="new-password" className="block text-gray-700">Password</label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">
        Register
      </button>
    </form>
  );
}
