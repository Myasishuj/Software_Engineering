import React, { useState, useEffect } from 'react';
import AuthView from './components/AuthView';
import UserDashboardView from './components/UserDashboardView';
import AdminDashboardView from './components/AdminDashboardView';
import { FileSpreadsheet } from 'lucide-react';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleAuthSuccess = (token, username, role) => {
    setAuthToken(token);
    setCurrentUser(username);
    setUserRole(role);
    setMessage('Login successful! Welcome!');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setUserRole(null);
    setMessage('You have been logged out.');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans">
      {authToken ? (
        // Full-width layout for dashboard views
        <div>
          <div className="bg-white p-6 shadow-md">
            <div className="h-screen">
              
              <h1 className="text-xl font-bold text-gray-800 flex items-center">
                <FileSpreadsheet className="w-6 h-6 mr-2 text-green-600" />
                Dashboard of {currentUser} ({userRole})
              </h1>
              
            </div>
          </div>
          
          {message && (
            <div className={`p-3 text-sm font-medium  ${
              message.includes('successful') || message.includes('Welcome') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}
          
          <div className="flex-1">
            {userRole === 'admin' ? (
              <AdminDashboardView
                authToken={authToken}
                currentUser={currentUser}
                onLogout={handleLogout}
                setIsLoading={setIsLoading}
                setMessage={setMessage}
              />
            ) : userRole === 'user' ? (
              <UserDashboardView
                authToken={authToken}
                currentUser={currentUser}
                onLogout={handleLogout}
                setIsLoading={setIsLoading}
                setMessage={setMessage}
              />
            ) : (
              <div className="h-screen p-4">
                <p className="text-center text-red-500 py-8">
                  Your role does not have a designated dashboard
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Centered layout for auth view
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800 text-center mb-6 flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 mr-3 text-green-600" />
              Excel Creator - Login
            </h1>

            {message && (
              <div className={`p-3 mb-4 rounded-md text-sm font-medium ${
                message.includes('successful') || message.includes('Welcome') 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {message}
              </div>
            )}

            {isLoading && (
              <div className="flex justify-center items-center mt-4 text-blue-600">
                <svg className="animate-spin h-5 w-5 mr-3 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            )}

            <AuthView
              setIsLoading={setIsLoading}
              setMessage={setMessage}
              onAuthSuccess={handleAuthSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;