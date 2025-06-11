// src/App.jsx
import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

export default function App() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleAuthSuccess = token => {
    console.log('JWT Token:', token);
    setMessage('Login successful! 🎉');
    // e.g. localStorage.setItem('token', token);
  };

  const onRegistrationSuccess = () => {
    setMessage('Registration successful! Please log in.');
    setIsLoginView(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-6">
          {isLoginView ? 'Welcome Back!' : 'Join Us!'}
        </h1>

        {message && (
          <div className={`p-3 mb-4 rounded-md text-sm font-medium ${
            message.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {isLoginView ? (
          <LoginForm
            setIsLoading={setIsLoading}
            setMessage={setMessage}
            onAuthSuccess={handleAuthSuccess}
          />
        ) : (
          <RegisterForm
            setIsLoading={setIsLoading}
            setMessage={setMessage}
            onRegistrationSuccess={onRegistrationSuccess}
          />
        )}

        {isLoading && <p className="text-center text-blue-600 mt-4">Processing...</p>}

        <p className="text-center text-sm text-gray-600 mt-6">
          {isLoginView ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => setIsLoginView(!isLoginView)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {isLoginView ? 'Register here.' : 'Login here.'}
          </button>
        </p>
      </div>
    </div>
  );
}
