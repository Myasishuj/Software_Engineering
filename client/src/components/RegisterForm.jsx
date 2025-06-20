import React, { useState } from 'react';
// Adjusted import path: Assuming 'config' is one level up from this component's directory.
// For example, if RegisterForm.jsx is in 'src/components/auth/' and config.js is in 'src/config/',
// you might need to go up two levels. If RegisterForm.jsx is in 'src/auth/' and config.js in 'src/config/',
// you would need to go up one level. This path assumes the latter.
import { API_BASE_URL } from '../config/config'; 
import './RegisterForm.css'; // Import CSS for styling

// Register Form Component
const RegisterForm = ({ setIsLoading, setMessage, onRegistrationSuccess, onSwitchView }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); // New state for email to store the user's email input
  const [role, setRole] = useState(""); 

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
    <div className="register-fullscreen">
      <div className="register-form-box">
        <form className="register-form"></form>
        <h4 className="register-title">Register</h4>
        <form onSubmit={handleSubmit} className="register-form">
      <div className='animated-input'>
        <input
          type="text"
          id="new-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder=" "
        />
        <label htmlFor="new-username">Username</label>
      </div>
      <div className="animated-input">
        <input
          type="password"
          id="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder=" "
        />
        <label htmlFor="new-password">Password</label>
      </div>
      
      {/* THIS IS THE EMAIL INPUT FIELD */}
      <div className="animated-input">
        <input
          type="email"
          id="new-email"
          placeholder=" "
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required // Making email a required field for registration
        />
        <label htmlFor="new-email">Email</label>
      </div>
      
      {/* Optional role selection for registration */}
      <div className="animated-input">
        <select
          id="new-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required // Making role selection a required field for registration
        >
          <option value=" ">Select Role</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="tester">Tester</option> {/* Added Tester role option */}
        </select>
      </div>
      <button type="submit" className="register-submit-button">Register</button>
        <p className="toggle-auth-text">
          Already have an account?{' '}
          <button type="button" onClick={onSwitchView}>
            Back to Login
          </button>
        </p>
      </form>
    </div>
  </div>
  );
};

export default RegisterForm;
