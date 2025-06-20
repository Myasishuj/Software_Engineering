import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Upload, Download, LogOut, Eye, EyeOff, Search, AlertCircle } from 'lucide-react';
import JsBarcode from 'jsbarcode'; // Using direct npm import
import './UserDashboardView.css'; // Import CSS for styling

// Base URL for the backend API (needs to be consistent across components)
const API_BASE_URL = 'http://127.0.0.1:5000';

const UserDashboardView = ({ authToken, currentUser, onLogout, setIsLoading, setMessage, isLoading }) => {
  // Initialize dataEntries with the new default column names and expiry placeholder
  const [dataEntries, setDataEntries] = useState([
    { key: 'pid', value: '' },
    { key: 'pname', value: '' },
    { key: 'expiry', value: '', placeholder: 'dd-mm-yyyy' }, // Added placeholder for expiry
    { key: 'quantity', value: '' },
    { key: 'price', value: '' },
    { key: 'type', value: '' }
  ]);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [submissionMode, setSubmissionMode] = useState('form'); // 'form' or 'json'
  const [jsonInput, setJsonInput] = useState('');

  // Barcode specific states
  const [barcodeSearchQuery, setBarcodeSearchQuery] = useState('');
  const [barcodeResult, setBarcodeResult] = useState(null); // Stores the matching record for barcode
  const [barcodeErrorMessage, setBarcodeErrorMessage] = useState('');
  const barcodeCanvasRef = useRef(null); // Ref for the barcode canvas element

  // Expiring items notification states
  const [expiringItems, setExpiringItems] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false); // State to control visibility of notification details

  // Effect to trigger client-side barcode generation when barcodeResult changes AND
  // it doesn't have a backend SVG AND the canvas ref is ready.
  useEffect(() => {
    console.log('Client-side barcode generation useEffect triggered. Barcode Result:', barcodeResult);
    // Only attempt client-side generation if:
    // 1. A barcodeResult exists
    // 2. It DOES NOT contain a backend-generated barcode_svg_base64
    // 3. The canvas ref is connected to the DOM
    if (barcodeResult && !barcodeResult.barcode_svg_base64 && barcodeCanvasRef.current) {
      console.log('Attempting client-side barcode generation for:', barcodeResult);
      generateAndDisplayBarcode(barcodeResult);
    } else if (barcodeResult && barcodeResult.barcode_svg_base64) {
      console.log('Backend-generated barcode SVG present. Skipping client-side generation.');
    } else {
      console.log('Client-side barcode generation conditions not met yet or no result.');
    }
  }, [barcodeResult, barcodeCanvasRef.current]); // Depend on barcodeResult and barcodeCanvasRef.current

  // Effect to fetch expiring items periodically
  useEffect(() => {
    const fetchExpiringItems = async () => {
      if (!authToken) return; // Don't fetch if not authenticated

      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/expiring-items?days=30`, { // Fetch items expiring within 30 days
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
        });
        const data = await response.json();
        if (response.ok && data.expiring_items) {
          setExpiringItems(data.expiring_items);
        } else {
          setExpiringItems([]); // Clear if no expiring items or an error
        }
      } catch (error) {
        console.error('Failed to fetch expiring items:', error);
        // Optionally set a user-facing message here if needed
      }
    };

    fetchExpiringItems(); // Initial fetch on component mount
    const intervalId = setInterval(fetchExpiringItems, 300000); // Poll every 5 minutes (300000 ms)

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [authToken]); // Refetch when authToken changes

  // Helper to derive an 11-digit numeric string for UPC from record.pid
  // This mirrors the backend's logic for client-side generation.
  const getUpcValueFromRecord = (record) => {
    if (!record || !record.pid) {
      // Fallback to a default demo UPC if no PID
      return "01234567890";
    }

    const pid_str = String(record.pid);
    let numeric_pid = '';
    // Extract only digits from pid_str
    for (let i = 0; i < pid_str.length; i++) {
        if (pid_str[i] >= '0' && pid_str[i] <= '9') {
            numeric_pid += pid_str[i];
        }
    }

    if (numeric_pid.length >= 11) {
      return numeric_pid.substring(0, 11); // Take the first 11 digits
    } else if (numeric_pid.length > 0) {
      return numeric_pid.padStart(11, '0'); // Pad with leading zeros
    } else {
      // If pid has no digits, generate a hash-based demo UPC (consistent for same input)
      let hash = 0;
      for (let i = 0; i < pid_str.length; i++) {
        const char = pid_str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
      }
      const demoUpc = String(Math.abs(hash)).padStart(11, '0').substring(0, 11);
      console.warn(`PID '${pid_str}' not suitable for UPC. Generated demo UPC: ${demoUpc}`);
      return demoUpc;
    }
  };

  // Function to generate and display barcode on the canvas (client-side fallback logic)
  const generateAndDisplayBarcode = (record) => {
    // If backend already provided an SVG barcode, do not attempt client-side generation.
    if (record && record.barcode_svg_base64) {
      console.log('Backend SVG barcode already present. Skipping client-side JsBarcode generation.');
      return;
    }

    // Ensure barcodeCanvasRef is connected
    if (!barcodeCanvasRef.current) {
      console.warn('Barcode canvas ref not available for client-side generation. Aborting barcode draw.');
      setBarcodeErrorMessage('Barcode canvas not ready. Please try again.');
      return;
    }

    // Get the 11-digit value for UPC
    const upcInput = getUpcValueFromRecord(record);
    
    console.log('Client-side: Attempting to draw UPC barcode with value:', upcInput);

    if (upcInput.length === 11 && /^\d+$/.test(upcInput)) { 
      try {
        // JsBarcode will automatically calculate the 12th checksum digit for UPC-A
        JsBarcode(barcodeCanvasRef.current, upcInput, {
          format: "UPC", // Changed format to UPC
          displayValue: true, 
          // JsBarcode automatically displays the full 12-digit code for UPC format.
          height: 150, // Increased height for client-side barcode
          width: 3, // Increased bar width
          margin: 15, // Increased margin
          background: "#ffffff",
          lineColor: "#333333",
          font: "monospace", 
          fontSize: 16 
        });
        setBarcodeErrorMessage(''); 
        console.log('Client-side: UPC barcode drawn successfully!');
      } catch (error) {
        console.error("Client-side: Error drawing UPC barcode on canvas:", error);
        setBarcodeErrorMessage("Failed to generate barcode (client-side): " + error.message);
      }
    } else {
      console.warn('Client-side: Invalid UPC input. Must be 11 numeric digits:', upcInput);
      setBarcodeErrorMessage('Invalid UPC input for client-side generation. Must be 11 numeric digits.');
    }
  };

  // Add a new empty row
  const addNewEntry = () => {
    setDataEntries([...dataEntries, { key: '', value: '' }]);
  };

  // Remove an entry by index
  const removeEntry = (index) => {
    // Only allow removing if there's more than one entry
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
      .filter(entry => entry.key.trim() && entry.value.trim()) // Only include entries with both key and value
      .reduce((obj, entry) => {
        obj[entry.key.trim()] = entry.value.trim();
        return obj;
      }, {});
    
    // Wrap in an array if there are valid entries, as expected by the backend
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
      // Validate that the parsed JSON is an array of objects
      if (!Array.isArray(records) || !records.every(item => typeof item === 'object' && item !== null)) {
        throw new Error('Input must be a JSON array of objects.');
      }
    } catch (parseError) {
      setMessage('Invalid JSON format. Please enter a valid JSON array of objects.');
      return;
    }
    await submitData(records);
  };

  // Common submission logic for both form and JSON input
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
        setMessage('Data submitted successfully and is pending admin approval!'); 
        if (submissionMode === 'form') {
          setDataEntries([
            { key: 'pid', value: '' },
            { key: 'pname', value: '' },
            { key: 'expiry', value: '', placeholder: 'dd-mm-yyyy' },
            { key: 'quantity', value: '' },
            { key: 'price', value: '' },
            { key: 'type', value: '' }
          ]);
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

  // Handle downloading Excel file for approved daily data (user or all, based on backend config)
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

  // Handle searching for barcode data
  const handleSearchForBarcode = async () => {
    setIsLoading(true); 
    setBarcodeResult(null); 
    setBarcodeErrorMessage('');
    setMessage(''); 

    if (!barcodeSearchQuery.trim()) {
      setBarcodeErrorMessage('Please enter a search term for the barcode.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/search-approved-data?query=${encodeURIComponent(barcodeSearchQuery.trim())}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
      });

      const data = await response.json();

      if (response.ok && data.matching_records && data.matching_records.length > 0) {
        const firstMatch = data.matching_records[0]; // Take the first matching record
        setBarcodeResult(firstMatch); // Store the entire record, including barcode_svg_base64
        setMessage('Matching record found and barcode ready!');
        // The useEffect will handle rendering the barcode (either SVG or client-side)
      } else {
        setBarcodeResult(null); 
        setBarcodeErrorMessage(data.msg || 'No approved data found matching your search term.');
        setMessage('No approved data found matching your search term.');
      }
    } catch (error) {
      console.error('Error searching for barcode data:', error);
      setBarcodeResult(null); 
      setBarcodeErrorMessage('Network error during barcode search. Please try again.');
      setMessage('Network error during barcode search.');
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div className="user-dashboard">
      {/* Welcome Message Section */}
      <div className="welcome-box">
        <h1 className="welcome-title">Welcome, {currentUser}!</h1>
        <p>
          Submit your data using the easy form below or upload JSON directly. Your data will be reviewed by an admin before it appears in reports. Download your *approved* daily reports anytime.
        </p>
      </div>

      {/* Notification Area */}
      {expiringItems.length > 0 && (
        <div className="notification-alert">
          <div className="notification-text">
            <AlertCircle className="icon" />
            <span>
              You have {expiringItems.length} item(s) expiring soon!
            </span>
          </div>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="notification-toggle"
          >
            {showNotifications ? 'Hide Details' : 'View Details'}
          </button>
        </div>
      )}

      {showNotifications && expiringItems.length > 0 && (
        <div className="notification-details">
          <h3>Expiring Items:</h3>
          <ul>
            {expiringItems.map((item, index) => (
              <li key={index}>
                <strong>{item.pname || item.pid || 'N/A'}</strong> (Expires: {item.expiry || 'N/A'})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Data Submission Section */}
      <div className="submit-section">
        <div className="submit-header">
          <h2>Submit Your Data for Approval</h2>

          {/* Mode Toggle Buttons */}
          <div className="mode-toggle">
            <button
              onClick={() => setSubmissionMode('form')}
              className={`toggle-btn ${submissionMode === 'form' ? 'active' : ''}`}
            >
              Easy Form
            </button>
            <button
              onClick={() => setSubmissionMode('json')}
              className={`toggle-btn ${submissionMode === 'json' ? 'active' : ''}`}
            >
              JSON Mode
            </button>
          </div>
        </div>

        {submissionMode === 'form' ? (
          // Form Input Mode
          <div className="form-mode">
            <div className="form-top-bar">
              <label>Data Fields</label>
              <button
                type="button"
                onClick={() => setShowJsonPreview(!showJsonPreview)}
                className="preview-toggle"
              >
                {showJsonPreview ? <EyeOff className="icon" /> : <Eye className="icon" />}
                {showJsonPreview ? 'Hide' : 'Preview'} JSON
              </button>
            </div>

            {/* Dynamic Form Fields */}
            {dataEntries.map((entry, index) => (
              <div key={index} className="form-entry">
                <input
                  type="text"
                  placeholder="Field name (e.g., item, product, name)"
                  value={entry.key}
                  onChange={(e) => updateEntry(index, 'key', e.target.value)}
                />
                <input
                  type="text"
                  placeholder={entry.placeholder || 'Value (e.g., apple, laptop, John)'}
                  value={entry.value}
                  onChange={(e) => updateEntry(index, 'value', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  disabled={dataEntries.length === 1}
                >
                  <Trash2 className="icon" />
                </button>
              </div>
            ))}

            {/* Add New Field Button */}
            <button
              type="button"
              onClick={addNewEntry}
              className="add-entry-btn"
            >
              <Plus className="icon" />
              Add Another Field
            </button>

            {/* JSON Preview Section */}
            {showJsonPreview && (
              <div className="json-preview">
                <h4>JSON Preview:</h4>
                <pre>{JSON.stringify(convertToJson(), null, 2)}</pre>
              </div>
            )}

            {/* Submit Data Button (Form Mode) */}
            <button
              onClick={handleFormSubmit}
              className="submit-btn"
            >
              <Upload className="icon" />
              Submit Data
            </button>
          </div>
        ) : (
          // JSON Input Mode
          <div className="json-mode">
            <label>JSON Array of Objects</label>
            <div className="text-sm text-gray-600 mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <strong>Example format:</strong>
              <pre className="mt-1 text-xs">
{`[
  {"pid": "A123", "pname": "Product X", "expiry": "12-31-2024", "quantity": 10, "price": 9.99, "type": "Electronics"}
]`}
              </pre>
            </div>
            <textarea
              rows="8"
              placeholder='[{"pid": "P001", "pname": "Item A", "expiry": "01-01-2025", "quantity": 5, "price": 100.00, "type": "Book"}]'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              required
            />
            {/* Submit Data Button (JSON Mode) */}
            <button
              onClick={handleJsonSubmit}
              className="submit-btn"
            >
              <Upload className="icon" />
              Submit JSON Data
            </button>
          </div>
        )}
      </div>

      {/* Barcode Generation Section */}
      <div className="barcode-section">
        <h2>Generate Barcode from Approved Data</h2>
        <p>
          Enter a term (e.g., a product ID or name) to search approved data and view its barcode.
        </p>
        <div className="barcode-search">
          <input
            type="text"
            placeholder="Search term for barcode (e.g., 'pid' value, 'pname' value)"
            value={barcodeSearchQuery}
            onChange={(e) => setBarcodeSearchQuery(e.target.value)}
          />
          <button
            onClick={handleSearchForBarcode}
            disabled={isLoading}
          >
            <Search className="icon" />
            Search & Generate
          </button>
        </div>
        {barcodeErrorMessage && (
          <div className="barcode-error">
            {barcodeErrorMessage}
          </div>
        )}
        {barcodeResult && (
          <div className="barcode-result">
            <h4>
              Generated UPC Barcode for: {barcodeResult['pid'] || barcodeResult['pname'] || 'N/A'}
            </h4>
            {barcodeResult.barcode_svg_base64 ? (
              <img
                src={`data:image/svg+xml;base64,${barcodeResult.barcode_svg_base64}`}
                alt={`UPC Barcode for ${barcodeResult.pid || barcodeResult.pname || 'item'}`}
                className="barcode-img"
              />
            ) : (
              <canvas ref={barcodeCanvasRef} width="500" height="200" className="barcode-canvas"></canvas>
            )}
            <p>
              Encoded UPC Value:{' '}
              <span className="upc-code">
                {barcodeResult.encoded_barcode_value || getUpcValueFromRecord(barcodeResult)}
              </span>
            </p>
            <pre className="record-data">
              Full Record Data:
              {JSON.stringify(barcodeResult, null, 2).length > 200
                ? JSON.stringify(barcodeResult, null, 2).substring(0, 200) + '...'
                : JSON.stringify(barcodeResult, null, 2)}
            </pre>
            <p className="text-xs text-red-600 mt-1">
              **Important:** UPC barcodes require exactly 12 numeric digits. For real industrial use, consider adding a dedicated 'upc_code' field to your data.
            </p>
          </div>
        )}
      </div>

      {/* Excel Download Section */}
      <div className="excel-section">
        <h2>Your Approved Daily Report</h2>
        <p>
          Download an Excel file containing all the data you've submitted **and that has been approved by an admin** for today.
        </p>
        <button
          onClick={handleDownloadExcel}
          className="excel-btn"
        >
          <Download className="icon" />
          Download Today's Approved Excel Report
        </button>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="logout-btn"
      >
        <LogOut className="icon" />
        Logout
      </button>
    </div>
  );
};

export default UserDashboardView;
