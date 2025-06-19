import React from 'react';
import { useNavigate } from 'react-router-dom';
import { removeToken, getToken } from './auth'; // Implement token removal in auth.js

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken(); // Clear the token on logout
    navigate('/login');
  };

  // Optionally, parse the username or info from the token if it’s a JWT, or fetch user data

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-10 space-y-8 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900">Dashboard</h1>
        <p className="text-gray-700 text-lg">
          Welcome back! You have successfully logged in.
        </p>

        <button
          onClick={handleLogout}
          className="mt-6 px-8 py-3 rounded-md bg-red-600 text-green text-lg font-semibold hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-red-300"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
