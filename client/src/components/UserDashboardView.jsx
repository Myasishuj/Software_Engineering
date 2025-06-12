import React, { useState } from 'react';
import { Plus, Trash2, Upload, Download, LogOut, Eye, EyeOff } from 'lucide-react';

// Mock API_BASE_URL for demo
const API_BASE_URL = 'http://127.0.0.1:5000';

const UserDashboardView = ({ authToken, currentUser, onLogout, setIsLoading, setMessage }) => {
  const [dataEntries, setDataEntries] = useState([{ key: '', value: '' }]);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [submissionMode, setSubmissionMode] = useState('form'); // 'form' or 'json'
  const [jsonInput, setJsonInput] = useState('');

  // Add a new empty row
  const addNewEntry = () => {
    setDataEntries([...dataEntries, { key: '', value: '' }]);
  };

  // Remove an entry by index
  const removeEntry = (index) => {
    if (dataEntries.length > 1) {
      setDataEntries(dataEntries.filter((_, i) => i !== index));
    }
  };

  // Update an entry
  const updateEntry = (index, field, value) => {
    const newEntries = [...dataEntries];
    newEntries[index][field] = value;
    setDataEntries(newEntries);
  };

  // Convert form data to JSON
  const convertToJson = () => {
    const validEntries = dataEntries
      .filter(entry => entry.key.trim() && entry.value.trim())
      .reduce((obj, entry) => {
        obj[entry.key.trim()] = entry.value.trim();
        return obj;
      }, {});
    
    return Object.keys(validEntries).length > 0 ? [validEntries] : [];
  };

  // Handle form-based submission
  const handleFormSubmit = async () => {
    
    const jsonData = convertToJson();
    if (jsonData.length === 0) {
      setMessage('Please enter at least one key-value pair with both fields filled.');
      return;
    }

    await submitData(jsonData);
  };

  // Handle JSON-based submission
  const handleJsonSubmit = async () => {
    
    let records;
    try {
      records = JSON.parse(jsonInput);
      if (!Array.isArray(records) || !records.every(item => typeof item === 'object' && item !== null)) {
        throw new Error('Input must be a JSON array of objects.');
      }
    } catch (parseError) {
      setMessage('Invalid JSON format. Please enter a valid JSON array of objects.');
      return;
    }

    await submitData(records);
  };

  // Common submission logic
  const submitData = async (records) => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/submit-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(records),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Data submitted successfully!');
        // Reset form
        if (submissionMode === 'form') {
          setDataEntries([{ key: '', value: '' }]);
        } else {
          setJsonInput('');
        }
      } else {
        setMessage(data.msg || 'Failed to submit data.');
      }
    } catch (error) {
      console.error('Data submission error:', error);
      setMessage('Network error. Please try again.');
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
          'Authorization': `Bearer ${authToken}`
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
        setMessage(errorData.msg || 'Failed to download Excel file.');
      }
    } catch (error) {
      console.error('Excel download error:', error);
      setMessage('Network error during Excel download. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {currentUser}!</h1>
        <p className="text-gray-700">
          Submit your data using the easy form below or upload JSON directly. Download your daily reports anytime.
        </p>
      </div>

      {/* Data Submission Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Submit Your Data</h2>
          
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSubmissionMode('form')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                submissionMode === 'form' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Easy Form
            </button>
            <button
              onClick={() => setSubmissionMode('json')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                submissionMode === 'json' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              JSON Mode
            </button>
          </div>
        </div>

        {submissionMode === 'form' ? (
          /* Form Mode */
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-gray-700 text-sm font-semibold">
                  Data Fields
                </label>
                <button
                  type="button"
                  onClick={() => setShowJsonPreview(!showJsonPreview)}
                  className="flex items-center text-sm text-purple-600 hover:text-purple-800"
                >
                  {showJsonPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  {showJsonPreview ? 'Hide' : 'Preview'} JSON
                </button>
              </div>
              
              {dataEntries.map((entry, index) => (
                <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Field name (e.g., item, product, name)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={entry.key}
                      onChange={(e) => updateEntry(index, 'key', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Value (e.g., apple, laptop, John)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={entry.value}
                      onChange={(e) => updateEntry(index, 'value', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEntry(index)}
                    disabled={dataEntries.length === 1}
                    className="p-2 text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addNewEntry}
                className="w-full flex items-center justify-center py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Another Field
              </button>
            </div>

            {/* JSON Preview */}
            {showJsonPreview && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">JSON Preview:</h4>
                <pre className="text-sm text-gray-600 overflow-x-auto">
                  {JSON.stringify(convertToJson(), null, 2)}
                </pre>
              </div>
            )}

            <button
              onClick={handleFormSubmit}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-300 transform hover:scale-105 flex items-center justify-center"
            >
              <Upload className="w-5 h-5 mr-2" />
              Submit Data
            </button>
          </div>
        ) : (
          /* JSON Mode */
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                JSON Array of Objects
              </label>
              <div className="text-sm text-gray-600 mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <strong>Example format:</strong>
                <pre className="mt-1 text-xs">
{`[
  {"item": "apple", "quantity": 10, "price": 1.5},
  {"item": "banana", "quantity": 5, "price": 0.8}
]`}
                </pre>
              </div>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                rows="8"
                placeholder='[{"field1": "value1", "field2": "value2"}]'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                required
              />
            </div>
            
            <button
              onClick={handleJsonSubmit}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-300 transform hover:scale-105 flex items-center justify-center"
            >
              <Upload className="w-5 h-5 mr-2" />
              Submit JSON Data
            </button>
          </div>
        )}
      </div>

      {/* Excel Download Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Daily Report</h2>
        <p className="text-gray-700 mb-4">
          Download an Excel file containing all the data you've submitted today.
        </p>
        <button
          onClick={handleDownloadExcel}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition duration-300 transform hover:scale-105 flex items-center justify-center"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Today's Excel Report
        </button>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-300 transform hover:scale-105 flex items-center justify-center"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Logout
      </button>
    </div>
  );
};

export default UserDashboardView;