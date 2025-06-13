import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, Settings, Eye, Download, CheckCircle, XCircle, Clock, Trash2, Mail, Search } from 'lucide-react'; // Import Mail and Search icons

// Base URL for the backend API (needs to be consistent across components)
const API_BASE_URL = 'http://127.0.0.1:5000';

const AdminDashboardView = ({ authToken, currentUser, onLogout, setIsLoading, setMessage, isLoading }) => {
  const [approvedDailyData, setApprovedDailyData] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showRawData, setShowRawData] = useState(false);
  const [dataLoading, setDataLoading] = useState(false); // Local loading state for data fetching
  const [dataError, setDataError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false); // State for confirmation modal

  // State for Email Notifications
  const [notificationMode, setNotificationMode] = useState('all'); // 'all' or 'specific'
  const [notificationSpecificUsername, setNotificationSpecificUsername] = useState(''); // Specific username for notifications
  const [daysThreshold, setDaysThreshold] = useState(30); // Default 30 days for expiry notifications
  const [emailNotificationStatus, setEmailNotificationStatus] = useState('');

  // State for Admin User Search
  const [searchUsername, setSearchUsername] = useState(''); // Input for admin search
  const [searchedUserData, setSearchedUserData] = useState(null); // Results of admin search

  // Helper to render records in a readable way (re-introduced from previous AdminPanel)
  const renderRecords = (records) => {
    if (!records || records.length === 0) {
      return <span className="text-gray-500">No records</span>;
    }
    return (
      <ul className="list-disc list-inside text-sm text-gray-700">
        {records.map((record, idx) => (
          <li key={idx} className="mb-1 p-1 bg-gray-100 rounded-md">
            {Object.entries(record).map(([key, value]) => (
              <span key={key} className="inline-block mr-2">
                <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            ))}
          </li>
        ))}
      </ul>
    );
  };

  // Function to fetch all APPROVED daily data for admin (for download)
  const fetchApprovedDailyData = useCallback(async () => {
    setDataLoading(true);
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
      setDataLoading(false);
    }
  }, [authToken, setMessage]);

  // Function to fetch all PENDING requests for admin
  const fetchPendingRequests = useCallback(async () => {
    setDataLoading(true);
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
      setDataLoading(false);
    }
  }, [authToken, setMessage]);

  // Combined fetch function for initial load and refresh
  const refreshAllAdminData = useCallback(() => {
    fetchApprovedDailyData();
    fetchPendingRequests();
  }, [fetchApprovedDailyData, fetchPendingRequests]);

  // Fetch data on component mount or when auth token changes
  useEffect(() => {
    if (authToken) {
      refreshAllAdminData();
    }
  }, [authToken, refreshAllAdminData]);

  // Function to handle approving a request
  const handleApproveRequest = async (requestId) => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  // Function to handle rejecting a request
  const handleRejectRequest = async (requestId) => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  // Function to download all daily data as Excel via backend endpoint
  const handleDownloadAllExcel = async () => {
    setIsLoading(true);
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
        let filename = `all_approved_data_${new Date().toISOString().slice(0, 10)}.xlsx`;

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
      setIsLoading(false);
    }
  };

  // Function to handle clearing all approved data
  const handleClearApprovedData = async () => {
    setShowClearConfirm(false); // Hide confirmation modal
    setIsLoading(true);
    setMessage('');
    setDataError('');

    try {
      // The backend endpoint is /admin/clear-all-data, which clears ALL submissions.
      // The current frontend button text "Clear All Approved Data" is slightly misleading
      // if it clears all, including pending/rejected. I'll keep the backend endpoint name,
      // but remind the user to be aware of what it clears.
      const response = await fetch(`${API_BASE_URL}/admin/clear-all-data`, { // Corrected endpoint for all data
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
        setMessage(data.msg || 'Failed to clear all data.');
        setDataError(data.msg || 'Failed to clear all data.');
      }
    } catch (error) {
      console.error('Error clearing all data:', error);
      setMessage('Network error during data clearing. Please try again.');
      setDataError('Network error during data clearing.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to send expired item notifications
  const handleSendExpiredNotifications = async () => {
    setIsLoading(true);
    setMessage('');
    setDataError('');
    setEmailNotificationStatus(''); // Clear previous status

    let targetUsernameToSend = notificationMode === 'all' ? 'all' : notificationSpecificUsername;

    if (notificationMode === 'specific' && !notificationSpecificUsername.trim()) {
      setMessage('Please enter a specific username for notifications, or select "All Users".');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/send-expired-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          target_username: targetUsernameToSend,
          days_threshold: parseInt(daysThreshold, 10), // Ensure it's an integer
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailNotificationStatus(data.msg + (data.successful_sends.length > 0 ? " Successful: " + data.successful_sends.join(', ') : "") + (data.failed_sends.length > 0 ? ". Failed: " + data.failed_sends.join(', ') : ""));
        setMessage('Expired notifications sent successfully!');
      } else {
        setEmailNotificationStatus(data.msg || 'Failed to send expired notifications.');
        setMessage(data.msg || 'Failed to send expired notifications.');
      }
    } catch (error) {
      console.error('Error sending expired notifications:', error);
      setEmailNotificationStatus('Network error during notification sending. Please check server logs.');
      setMessage('Network error during notification sending.');
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Handler for admin searching user submissions
  const handleSearchUserSubmissions = async () => {
    if (!searchUsername.trim()) {
      setMessage('Please enter a username to search.');
      setSearchedUserData(null);
      return;
    }

    setIsLoading(true); // Use global loading
    setMessage('');
    setSearchedUserData(null); // Clear previous search results

    try {
      const response = await fetch(`${API_BASE_URL}/admin/search-user-submissions?username=${encodeURIComponent(searchUsername)}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setSearchedUserData(data.user_submissions);
        setMessage(`Found ${data.user_submissions.length} submissions for '${searchUsername}'.`);
      } else {
        setMessage(data.msg || `Failed to retrieve data for user '${searchUsername}'.`);
        setSearchedUserData([]); // Set to empty array on 404/failure for clear display
      }
    } catch (error) {
      console.error('Error searching user submissions:', error);
      setMessage('Network error or backend issue during user search.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="space-y-6 p-4 md:p-8 bg-gray-50 min-h-screen">
      <h2 className="text-3xl md:text-4xl font-extrabold text-blue-800 text-center mb-6 md:mb-8">Admin Dashboard</h2>

      {/* Admin Controls / Logout */}
      <div className="flex flex-wrap justify-center md:justify-between items-center gap-4 mb-6">
        <button
          onClick={refreshAllAdminData}
          disabled={dataLoading || isLoading}
          className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 w-full sm:w-auto"
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
          disabled={approvedDailyData.length === 0 || isLoading}
          className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:bg-gray-400 w-full sm:w-auto"
        >
          <Download className="w-4 h-4 mr-2" />
          Download All Approved Data (Excel)
        </button>

        {/* Clear Data Button */}
        <button
          onClick={() => setShowClearConfirm(true)}
          disabled={approvedDailyData.length === 0 || isLoading}
          className="flex items-center justify-center bg-red-700 hover:bg-red-800 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 disabled:bg-gray-400 w-full sm:w-auto"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All Submissions
        </button>

        <button
          onClick={onLogout}
          className="flex items-center justify-center bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 w-full sm:w-auto"
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

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm flex items-center shadow-md">
        <Settings className="w-5 h-5 mr-3 text-yellow-600" />
        <p>Welcome, **Admin**! Here you can manage all user data and download comprehensive reports.</p>
      </div>

      {/* Confirmation Modal for Clearing Data */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
            <h3 className="text-lg font-bold text-red-700 mb-4">Confirm Data Deletion</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to permanently delete ALL submissions (pending, approved, rejected)? This action cannot be undone.
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

      {/* NEW: Admin User Search Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Search className="w-5 h-5 mr-2 text-purple-500" />
          Search User Submissions
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="Enter username to search"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleSearchUserSubmissions}
            disabled={isLoading || dataLoading || !searchUsername.trim()}
            className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-300 disabled:bg-gray-400 w-full sm:w-auto"
          >
            {isLoading || dataLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Search User
          </button>
        </div>

        {searchedUserData !== null && (
          <div className="mt-6 border-t pt-4 border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Results for "{searchUsername}" ({searchedUserData.length} submissions)
            </h3>
            {searchedUserData.length > 0 ? (
              <div className="space-y-4">
                {searchedUserData.map(submission => (
                  <div key={submission._id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <p className="text-gray-700 mb-1"><strong>Submission ID:</strong> {submission._id.substring(0, 8)}...</p>
                    <p className="text-gray-700 mb-1"><strong>Username:</strong> {submission.username}</p>
                    <p className="text-gray-700 mb-1">
                      <strong>Status:</strong> <span className={`font-semibold ${
                        submission.status === 'approved' ? 'text-green-600' :
                        submission.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                      }`}>{submission.status}</span>
                    </p>
                    <p className="text-gray-700 mb-3">
                      <strong>Submitted On:</strong> {new Date(submission.submission_timestamp).toLocaleString()}
                    </p>
                    {submission.status === 'approved' && submission.approval_timestamp && (
                       <p className="text-gray-700 mb-3">
                        <strong>Approved On:</strong> {new Date(submission.approval_timestamp).toLocaleString()}
                      </p>
                    )}
                     {submission.status === 'rejected' && submission.rejection_timestamp && (
                       <p className="text-gray-700 mb-3">
                        <strong>Rejected On:</strong> {new Date(submission.rejection_timestamp).toLocaleString()}
                      </p>
                    )}
                    <h4 className="text-md font-medium text-gray-800 mb-2">Records:</h4>
                    {renderRecords(submission.records)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No submissions found for this user.</p>
            )}
          </div>
        )}
      </div>

      {/* Send Expired Notifications Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Mail className="w-5 h-5 mr-2 text-indigo-500" />
          Send Expired Item Notifications
        </h2>
        <p className="text-gray-700 mb-4">
          Send an email notification about items expiring or recently expired based on a threshold.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col">
            <label htmlFor="notification-mode" className="text-gray-700 text-sm font-medium mb-2">Target Audience:</label>
            <select
              id="notification-mode"
              value={notificationMode}
              onChange={(e) => setNotificationMode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Users</option>
              <option value="specific">Specific User</option>
            </select>
          </div>
          {notificationMode === 'specific' && (
            <div className="flex flex-col">
              <label htmlFor="specific-username-input" className="text-gray-700 text-sm font-medium mb-2">Specific Username:</label>
              <input
                type="text"
                id="specific-username-input"
                placeholder="e.g., tester1"
                value={notificationSpecificUsername}
                onChange={(e) => setNotificationSpecificUsername(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
          <div className="flex flex-col">
            <label htmlFor="days-threshold-input" className="text-gray-700 text-sm font-medium mb-2">Days Threshold (Past/Future):</label>
            <input
              type="number"
              id="days-threshold-input"
              value={daysThreshold}
              onChange={(e) => setDaysThreshold(parseInt(e.target.value) || 0)} // Ensure integer, default to 0 if invalid
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min="0"
            />
          </div>
        </div>
        <button
          onClick={handleSendExpiredNotifications}
          disabled={isLoading || dataLoading}
          className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-300 disabled:bg-gray-400 w-full"
        >
          {isLoading || dataLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Mail className="w-4 h-4 mr-2" />
          )}
          Send Notifications
        </button>
        {emailNotificationStatus && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${emailNotificationStatus.includes('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {emailNotificationStatus}
          </div>
        )}
      </div>

      {/* Display Pending Requests */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
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
                      {renderRecords(request.records)} {/* Using the helper */}
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
              className="text-sm text-purple-600 hover:text-purple-800 flex items-center ml-auto"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted On</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvedDailyData.map((entry) => (
                  <tr key={entry._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry._id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {entry.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                       <span className={`font-semibold ${
                        entry.status === 'approved' ? 'text-green-600' :
                        entry.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                      }`}>{entry.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(entry.submission_timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {renderRecords(entry.records)} {/* Using the helper */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardView;
