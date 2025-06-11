import React from 'react';
import { API_BASE_URL } from '../config/config';

// Admin Dashboard View Component
const AdminDashboardView = ({ authToken, currentUser, onLogout, setIsLoading, setMessage }) => {

  const handleDownloadAllExcel = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/download-excel`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}` // Include JWT token
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'all_users_daily_data.xlsx'; // Default filename for admin

        if (contentDisposition && contentDisposition.includes('filename=')) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setMessage('Excel file downloaded successfully!');
      } else {
        const errorData = await response.json();
        setMessage(errorData.msg || 'Failed to download Excel file. No data for today or server error.');
      }
    } catch (error) {
      console.error('Excel download error:', error);
      setMessage('Network error during Excel download. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-700 text-center">
        Welcome, **Admin**! Here you can manage all user data and download comprehensive reports.
      </p>

      {/* Admin specific features */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Admin Features</h2>
        <p className="text-gray-700 mb-4">Download an Excel file containing **all data submitted by all users today**.</p>
        <button
          onClick={handleDownloadAllExcel}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-300 transform hover:scale-105"
        >
          Download All Daily Data as Excel (Admin)
        </button>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 transform hover:scale-105 mt-6"
      >
        Logout
      </button>
    </div>
  );
};

export default AdminDashboardView;