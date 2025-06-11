import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/login', {
        username,
        password
      });
      alert("Login success! Token: " + res.data.token);
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input placeholder="Username" onChange={e => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
