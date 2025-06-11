import React, { useState } from 'react';
import { API_BASE_URL } from '../config/config';

// User Dashboard View Component
const UserDashboardView = ({ authToken, currentUser, onLogout, setIsLoading, setMessage }) => {
  const [dataInput, setDataInput] = useState('');

  const handleDataSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      let records;
      try {
        records = JSON.parse(dataInput);
        if (!Array.isArray(records) || !records.every(item => typeof item === 'object' && item !== null)) {
          throw new Error('Input must be a JSON array of objects.');
        }
      } catch (parseError) {
        setMessage('Invalid data format. Please enter a JSON array of objects (e.g., [{"col1": "val1"}, {"col2": "val2"}]).');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/dashboard/submit-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` // Include JWT token
        },
        body: JSON.stringify(records),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.msg);
        setDataInput(''); // Clear input after successful submission
      } else {
        setMessage(data.msg || 'Failed to submit data.');
      }
    } catch (error) {
      console.error('Data submission error:', error);
      setMessage('Network error or invalid data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
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
        let filename = 'daily_data.xlsx';

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
        As a **User**, you can submit your own data batches and download your daily reports.
      </p>

      {/* Data Submission Section */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Submit Your Batch Data</h2>
        <form onSubmit={handleDataSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="data-input">
              Enter Data (JSON Array of Objects):
            </label>
            <textarea
              id="data-input"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 resize-y"
              rows="6"
              placeholder='[{"item": "apple", "quantity": 10}, {"item": "banana", "quantity": 5}]'
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
              required
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-300 transform hover:scale-105"
          >
            Submit Data
          </button>
        </form>
      </div>

      {/* Excel Download Section */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Daily Excel Report</h2>
        <p className="text-gray-700 mb-4">Download an Excel file containing all data **you** submitted today.</p>
        <button
          onClick={handleDownloadExcel}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition duration-300 transform hover:scale-105"
        >
          Download Today's Data as Excel
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

export default UserDashboardView;