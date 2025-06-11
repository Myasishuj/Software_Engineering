import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

// Authentication View Component (Login/Register Forms)
const AuthView = ({ setIsLoading, setMessage, onAuthSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <>
      {isLoginView ? (
        <LoginForm
          setIsLoading={setIsLoading}
          setMessage={setMessage}
          onAuthSuccess={onAuthSuccess}
        />
      ) : (
        <RegisterForm
          setIsLoading={setIsLoading}
          setMessage={setMessage}
          onRegistrationSuccess={() => {
            setMessage('Registration successful! Please log in.');
            setIsLoginView(true); // Switch to login view after successful registration
          }}
        />
      )}

      {/* Toggle between login and register views */}
      <p className="text-center text-sm text-gray-600 mt-6">
        {isLoginView ? "Don't have an account?" : "Already have an account?"}{' '}
        <button
          onClick={() => setIsLoginView(!isLoginView)}
          className="text-blue-600 hover:text-blue-800 font-medium transition duration-300"
        >
          {isLoginView ? 'Register here.' : 'Login here.'}
        </button>
      </p>
    </>
  );
};

export default AuthView;