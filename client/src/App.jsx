import React, { useState, useEffect } from 'react';
import AuthView from './components/AuthView'; // Removed .jsx extension
import UserDashboardView from './components/UserDashboardView'; // Removed .jsx extension
import AdminDashboardView from './components/AdminDashboardView'; // Removed .jsx extension
import { FileSpreadsheet } from 'lucide-react'; // Import icon for consistent styling
import './App.css'; // Import global styles

// Main App component
const App = () => {
  // State to store the current logged-in username
  const [currentUser, setCurrentUser] = useState(null);
  // State to store the current logged-in user's role
  const [userRole, setUserRole] = useState(null);
  // State for messages from the backend (e.g., success, error)
  const [message, setMessage] = useState('');
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);
  // State to manage authentication token (JWT)
  const [authToken, setAuthToken] = useState(null);

  // Clear message after a few seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000); // Clear message after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Function to handle successful authentication
  const handleAuthSuccess = (token, username, role) => {
    setAuthToken(token);
    setCurrentUser(username);
    setUserRole(role); // Set the user's role
    setMessage('Login successful! Welcome!');
  };

  // Function to handle logout
  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setUserRole(null); // Clear the user's role
    setMessage('You have been logged out.');
  };

  // Render AuthView if no token, otherwise render the appropriate DashboardView
  return (
    <div className="userDashBody">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl border border-gray-200"> {/* Increased max-w-md to max-w-4xl to accommodate ExcelCreatorApp */}
        <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-6 flex items-center justify-center">
          <FileSpreadsheet className="w-8 h-8 mr-3 text-green-600" /> {/* Added an icon for consistency */}
          {authToken ? `Welcome, ${currentUser} (${userRole})!` : 'Excel Creator - User Authentication'}
        </h1>

        {/* Display messages from the backend or local state */}
        {message && (
          <div className={`p-3 mb-4 rounded-md text-sm font-medium ${
            message.includes('successful') || message.includes('Welcome') ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center items-center mt-4 text-blue-600">
            <svg className="animate-spin h-5 w-5 mr-3 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </div>
        )}

        {authToken ? (
          // Render dashboard based on userRole
          userRole === 'admin' ? (
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
            // Fallback for unknown roles or roles without a specific dashboard
            <p className="text-center text-red-500">Your role does not have a designated dashboard. Please contact support.</p>
          )
        ) : (
          <AuthView
            setIsLoading={setIsLoading}
            setMessage={setMessage}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default App;
