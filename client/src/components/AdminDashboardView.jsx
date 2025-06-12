import React, { useState, useEffect } from 'react';
import { LogOut, Settings, Eye, Download, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react'; // Import Trash2 icon

// Base URL for the backend API (needs to be consistent across components)
const API_BASE_URL = 'http://127.0.0.1:5000';

// Added 'isLoading' to the destructured props
const AdminDashboardView = ({ authToken, currentUser, onLogout, setIsLoading, setMessage, isLoading }) => {
  const [approvedDailyData, setApprovedDailyData] = useState([]); 
  const [pendingRequests, setPendingRequests] = useState([]); 
  const [showRawData, setShowRawData] = useState(false);
  const [dataLoading, setDataLoading] = useState(false); // Local loading state for data fetching
  const [dataError, setDataError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false); // State for confirmation modal

  // Function to fetch all APPROVED daily data for admin (for download)
  const fetchApprovedDailyData = async () => {
    setDataLoading(true); // Set local loading
    setDataError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/admin/daily-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
      });

      const data = await response.json();

      if (response.ok) {
        setApprovedDailyData(data.daily_data);
        setMessage('Approved daily data fetched successfully!');
      } else {
        setDataError(data.msg || 'Failed to fetch approved daily data.');
        setMessage(data.msg || 'Failed to fetch approved daily data for admin.');
      }
    } catch (error) {
      console.error('Error fetching approved daily data for admin:', error);
      setDataError('Network error while fetching approved daily data. Please try again.');
      setMessage('Network error while fetching approved daily data.');
    } finally {
      setDataLoading(false); // Clear local loading
    }
  };

  // Function to fetch all PENDING requests for admin
  const fetchPendingRequests = async () => {
    setDataLoading(true); // Set local loading
    setDataError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/admin/pending-requests`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
      });

      const data = await response.json();

      if (response.ok) {
        setPendingRequests(data.pending_requests);
        setMessage('Pending requests fetched successfully!');
      } else {
        setDataError(data.msg || 'Failed to fetch pending requests.');
        setMessage(data.msg || 'Failed to fetch pending requests for admin.');
      }
    } catch (error) {
      console.error('Error fetching pending requests for admin:', error);
      setDataError('Network error while fetching pending requests. Please try again.');
      setMessage('Network error while fetching pending requests.');
    } finally {
      setDataLoading(false); // Clear local loading
    }
  };

  // Combined fetch function for initial load and refresh
  const refreshAllAdminData = () => {
    fetchApprovedDailyData();
    fetchPendingRequests();
  };

  // Fetch data on component mount or when auth token changes
  useEffect(() => {
    if (authToken) {
      refreshAllAdminData();
    }
  }, [authToken]); 

  // Function to handle approving a request
  const handleApproveRequest = async (requestId) => {
    setIsLoading(true); // Use global loading indicator
    setMessage('');
    setDataError('');

    try {
      const response = await fetch(`${API_BASE_URL}/admin/approve-request/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Request approved successfully!');
        refreshAllAdminData(); 
      } else {
        setMessage(data.msg || 'Failed to approve request.');
        setDataError(data.msg || 'Failed to approve request.');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      setMessage('Network error during approval. Please try again.');
      setDataError('Network error during approval.');
    } finally {
      setIsLoading(false); // Clear global loading indicator
    }
  };

  // Function to handle rejecting a request
  const handleRejectRequest = async (requestId) => {
    setIsLoading(true); // Use global loading indicator
    setMessage('');
    setDataError('');

    try {
      const response = await fetch(`${API_BASE_URL}/admin/reject-request/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Request rejected successfully!');
        refreshAllAdminData(); 
      } else {
        setMessage(data.msg || 'Failed to reject request.');
        setDataError(data.msg || 'Failed to reject request.');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      setMessage('Network error during rejection. Please try again.');
      setDataError('Network error during rejection.');
    } finally {
      setIsLoading(false); // Clear global loading indicator
    }
  };

  // Function to download all daily data as Excel via backend endpoint
  const handleDownloadAllExcel = async () => {
    setIsLoading(true); // Use global loading indicator
    setMessage('');
    setDataError('');

    try {
      const response = await fetch(`${API_BASE_URL}/admin/download-all-excel`, { 
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}` 
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `all_approved_data_${new Date().toISOString().slice(0,10)}.xlsx`; 

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
        setMessage('Aggregated Excel file downloaded successfully!');
      } else {
        const errorData = await response.json();
        setMessage(errorData.msg || 'Failed to download aggregated Excel file.');
        setDataError(errorData.msg || 'Failed to download aggregated Excel file.');
      }
    } catch (error) {
      console.error('Aggregated Excel download error:', error);
      setMessage('Network error during aggregated Excel download. Please try again.');
      setDataError('Network error during aggregated Excel download.');
    } finally {
      setIsLoading(false); // Clear global loading indicator
    }
  };

  // Function to handle clearing all approved data
  const handleClearApprovedData = async () => {
    setShowClearConfirm(false); // Hide confirmation modal
    setIsLoading(true); // Use global loading indicator
    setMessage('');
    setDataError('');

    try {
      const response = await fetch(`${API_BASE_URL}/admin/clear-approved-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.msg);
        refreshAllAdminData(); // Refresh data to show cleared state
      } else {
        setMessage(data.msg || 'Failed to clear approved data.');
        setDataError(data.msg || 'Failed to clear approved data.');
      }
    } catch (error) {
      console.error('Error clearing approved data:', error);
      setMessage('Network error during data clearing. Please try again.');
      setDataError('Network error during data clearing.');
    } finally {
      setIsLoading(false); // Clear global loading indicator
    }
  };


  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">Admin Dashboard</h2>

      {/* Admin Controls / Logout */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={refreshAllAdminData} 
          disabled={dataLoading || isLoading} // Use both local and global loading
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
        >
          {dataLoading || isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Eye className="w-4 h-4 mr-2" />
          )}
          {dataLoading || isLoading ? 'Refreshing Data...' : 'Refresh All Admin Data'}
        </button>

        <button
          onClick={handleDownloadAllExcel}
          disabled={approvedDailyData.length === 0 || isLoading} // Use global loading
          className="flex items-center bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:bg-gray-400"
        >
          <Download className="w-4 h-4 mr-2" />
          Download All Approved Data (Excel)
        </button>

        {/* Clear Data Button */}
        <button
            onClick={() => setShowClearConfirm(true)}
            disabled={approvedDailyData.length === 0 || isLoading} // Use global loading
            className="flex items-center bg-red-700 hover:bg-red-800 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 disabled:bg-gray-400"
        >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Approved Data
        </button>

        <button
          onClick={onLogout}
          className="flex items-center bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>

      {dataError && (
        <div className="p-3 mb-4 rounded-md text-sm font-medium bg-red-100 text-red-700 border border-red-200">
          {dataError}
        </div>
      )}

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm flex items-center">
        <Settings className="w-5 h-5 mr-3 text-yellow-600" />
        <p>Welcome, **Admin**! Here you can manage all user data and download comprehensive reports.</p>
      </div>

      {/* Confirmation Modal for Clearing Data */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
            <h3 className="text-lg font-bold text-red-700 mb-4">Confirm Data Deletion</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to permanently delete ALL approved user data? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleClearApprovedData}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Yes, Delete All Data
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Display Pending Requests */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 flex justify-between items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-500" />
          Pending User Requests ({pendingRequests.length})
        </h3>
        {pendingRequests.length === 0 && !dataLoading && !dataError ? (
          <p className="text-gray-600">No pending requests at the moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted On</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingRequests.map((request) => (
                  <tr key={request._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request._id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {request.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(request.submission_timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {request.records ? request.records.length : 0} records
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded-md max-h-24 overflow-y-auto">
                        {JSON.stringify(request.records[0], null, 2)}
                      </pre>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveRequest(request._id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request._id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Display Approved Daily Data (for viewing what's been approved) */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 flex justify-between items-center">
          <Download className="w-5 h-5 mr-2 text-teal-500" />
          Currently Approved Data ({approvedDailyData.length} entries)
          {approvedDailyData.length > 0 && (
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
            >
              {showRawData ? <Eye className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showRawData ? 'Hide Raw JSON' : 'Show Raw JSON'}
            </button>
          )}
        </h3>

        {approvedDailyData.length === 0 && !dataLoading && !dataError && (
          <p className="text-gray-600">No approved data found yet.</p>
        )}

        {showRawData ? (
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(approvedDailyData, null, 2)}
          </pre>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Key</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sample Record (First)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvedDailyData.map((entry) => (
                  <tr key={entry._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.date_key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {entry.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {entry.records ? entry.records.length : 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {entry.records && entry.records.length > 0
                        ? JSON.stringify(entry.records[0], null, 2) 
                        : 'No Records'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 transform hover:scale-105 mt-6"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Logout
      </button>
    </div>
  );
};

export default AdminDashboardView;
