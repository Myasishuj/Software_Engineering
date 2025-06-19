import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, Settings, Eye, Download, CheckCircle, XCircle, Clock, Trash2, Mail, Search } from 'lucide-react'; // Import Mail and Search icons
import './AdminDashboardView.css'; // Import CSS styles

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
    <div className="admin-dashboard">
      <h2 className="admin-header">Admin Dashboard</h2>

      {/* Admin Controls / Logout */}
      <div className="admin-actions">
        <button
          onClick={refreshAllAdminData}
          disabled={dataLoading || isLoading}
          className="admin-button refresh-button"
          >
          {dataLoading || isLoading ? (
            <div className="loading-spinner"></div>
          ) : (
            <Eye className="icon" />
          )}
          {dataLoading || isLoading ? 'Refreshing Data...' : 'Refresh All Admin Data'}
        </button>

        <button
          onClick={handleDownloadAllExcel}
          disabled={approvedDailyData.length === 0 || isLoading}
          className="admin-button download-button" 
          >
          <Download className="icon" />
          Download All Approved Data (Excel)
        </button>

        {/* Clear Data Button */}
        <button
          onClick={() => setShowClearConfirm(true)}
          disabled={approvedDailyData.length === 0 || isLoading}
          className="admin-button delete-button"
           >
          <Trash2 className="icon" />
          Clear All Submissions
        </button>

        <button
          onClick={onLogout}
          className="admin-button logout-button"
           >
          <LogOut className="icon" />
          Logout
        </button>
      </div>

      {dataError && (
        <div className="error-alert">
          {dataError}
        </div>
      )}

      <div className="admin-welcome">
        <Settings className="icon warning-icon" />
        <p>Welcome, **Admin**! Here you can manage all user data and download comprehensive reports.</p>
      </div>

      {/* Confirmation Modal for Clearing Data */}
      {showClearConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">Confirm Data Deletion</h3>
            <p className="modal-message">
              Are you sure you want to permanently delete ALL submissions (pending, approved, rejected)? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                onClick={handleClearApprovedData}
                className="confirm-button"
              >
                Yes, Delete All Data
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Admin User Search Section */}
      <div className="search-box">
        <h2 className="section-title">
          <Search className="icon purple-icon" />
          Search User Submissions
        </h2>
        <div className="search-controls">
          <input
            type="text"
            placeholder="Enter username to search"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            className="input-field" 
          />
          <button
            onClick={handleSearchUserSubmissions}
            disabled={isLoading || dataLoading || !searchUsername.trim()}
            className="search-button"
            >
            {isLoading || dataLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <Search className="icon" />
            )}
            Search User
          </button>
        </div>

        {searchedUserData !== null && (
          <div className="search-results">
            <h3 className="results-title">
              Results for "{searchUsername}" ({searchedUserData.length} submissions)
            </h3>
            {searchedUserData.length > 0 ? (
              <div className="results-list">
                {searchedUserData.map(submission => (
                  <div key={submission._id} className="result-card">
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
              <p className="no-results">No submissions found for this user.</p>
            )}
          </div>
        )}
      </div>

      {/* Send Expired Notifications Section */}
      <div className="notification-section">
        <h2 className="section-title">
          <Mail className="icon indigo-icon" />
          Send Expired Item Notifications
        </h2>
        <p className="section-description">
          Send an email notification about items expiring or recently expired based on a threshold.
        </p>
        <div className="notification-grid">
          <div className="form-group">
            <label htmlFor="notification-mode" className="label" >Target Audience:</label>
            <select
              id="notification-mode"
              value={notificationMode}
              onChange={(e) => setNotificationMode(e.target.value)}
              className="input-field"
              >
              <option value="all">All Users</option>
              <option value="specific">Specific User</option>
            </select>
          </div>
          {notificationMode === 'specific' && (
            <div className="form-group">
              <label htmlFor="specific-username-input" className="label">Specific Username:</label>
              <input
                type="text"
                id="specific-username-input"
                placeholder="e.g., tester1"
                value={notificationSpecificUsername}
                onChange={(e) => setNotificationSpecificUsername(e.target.value)}
                className="input-field"
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="days-threshold-input" className="label">Days Threshold (Past/Future):</label>
            <input
              type="number"
              id="days-threshold-input"
              value={daysThreshold}
              onChange={(e) => setDaysThreshold(parseInt(e.target.value) || 0)} // Ensure integer, default to 0 if invalid
              className="input-field"
              min="0"
            />
          </div>
        </div>
        <button
          onClick={handleSendExpiredNotifications}
          disabled={isLoading || dataLoading}
          className="notification-button"
          >
          {isLoading || dataLoading ? (
            <div className="loading-spinner"></div>
          ) : (
            <Mail className="icon" />
          )}
          Send Notifications
        </button>
        {emailNotificationStatus && (
          <div className={`notification-status ${emailNotificationStatus.includes('Failed') ? 'error' : 'success'}`}>
            {emailNotificationStatus}
          </div>
        )}
      </div>

      {/* Display Pending Requests */}
      <div className="pending-section">
        <h3 className="section-title">
          <Clock className="icon blue-icon" />
          Pending User Requests ({pendingRequests.length})
        </h3>
        {pendingRequests.length === 0 && !dataLoading && !dataError ? (
          <p className="no-results">No pending requests at the moment.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
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
                      <div className="action-buttons">
                        <button
                          onClick={() => handleApproveRequest(request._id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <CheckCircle className="icon" /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request._id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <XCircle className="icon" /> Reject
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
      <div className="approved-section">
        <h3 className="section-title">
          <Download className="icon teal-icon" />
          Currently Approved Data ({approvedDailyData.length} entries)
          {approvedDailyData.length > 0 && (
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="toggle-json-button"
            >
              {showRawData ? <Eye className="icon" /> : <Eye className="icon" />}
              {showRawData ? 'Hide Raw JSON' : 'Show Raw JSON'}
            </button>
          )}
        </h3>

        {approvedDailyData.length === 0 && !dataLoading && !dataError && (
          <p className="no-results">No approved data found yet.</p>
        )}

        {showRawData ? (
          <pre className="json-viewer">
            {JSON.stringify(approvedDailyData, null, 2)}
          </pre>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
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
  
