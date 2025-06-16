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
          onSwitchView={() => setIsLoginView(false)}
        />
      ) : (
        <RegisterForm
          setIsLoading={setIsLoading}
          setMessage={setMessage}
          onRegistrationSuccess={() => {
            setMessage('Registration successful! Please log in.');
            setIsLoginView(true); // Switch to login view after successful registration
          }}
          onSwitchView={() => setIsLoginView(true)}
        />
      )}

    </>
  );
};

export default AuthView;