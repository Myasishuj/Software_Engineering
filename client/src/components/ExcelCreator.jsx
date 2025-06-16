import React, { useState } from 'react';
import { Plus, Trash2, Download, FileSpreadsheet, Upload, Save, Eye, EyeOff, AlertCircle } from 'lucide-react';

const ExcelCreatorApp = () => {
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'templates'
  const [fileName, setFileName] = useState('my_data');
  const [sheetName, setSheetName] = useState('Sheet1');
  const [dataEntries, setDataEntries] = useState([{ key: '', value: '' }]);
  const [jsonInput, setJsonInput] = useState('');
  const [inputMode, setInputMode] = useState('form'); // 'form' or 'json'
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'Sales Report',
      description: 'Basic sales data template',
      columns: ['Product', 'Quantity', 'Price', 'Total'],
      sampleData: [
        { Product: 'Laptop', Quantity: 5, Price: 999.99, Total: 4999.95 },
        { Product: 'Mouse', Quantity: 20, Price: 25.50, Total: 510.00 }
      ]
    },
    {
      id: 2,
      name: 'Inventory List',
      description: 'Product inventory tracking',
      columns: ['Item', 'SKU', 'Stock', 'Location'],
      sampleData: [
        { Item: 'Widget A', SKU: 'WA001', Stock: 150, Location: 'Warehouse A' },
        { Item: 'Widget B', SKU: 'WB001', Stock: 75, Location: 'Warehouse B' }
      ]
    },
    {
      id: 3,
      name: 'Employee List',
      description: 'Basic employee information',
      columns: ['Name', 'Department', 'Position', 'Email'],
      sampleData: [
        { Name: 'John Doe', Department: 'IT', Position: 'Developer', Email: 'john@company.com' },
        { Name: 'Jane Smith', Department: 'HR', Position: 'Manager', Email: 'jane@company.com' }
      ]
    }
  ]);

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

  // Convert form data to object array
  const convertFormToData = () => {
    const validEntries = dataEntries.filter(entry => entry.key.trim() && entry.value.trim());
    if (validEntries.length === 0) return [];
    
    const dataObject = {};
    validEntries.forEach(entry => {
      dataObject[entry.key.trim()] = entry.value.trim();
    });
    
    return [dataObject];
  };

  // Create Excel file
  const createExcelFile = async (data = null) => {
    setIsLoading(true);
    setMessage('');

    let excelData;
    
    if (data) {
      excelData = data;
    } else if (inputMode === 'form') {
      excelData = convertFormToData();
      if (excelData.length === 0) {
        setMessage('Please enter at least one key-value pair with both fields filled.');
        setIsLoading(false);
        return;
      }
    } else {
      try {
        excelData = JSON.parse(jsonInput);
        if (!Array.isArray(excelData)) {
          throw new Error('JSON must be an array of objects');
        }
      } catch (error) {
        setMessage('Invalid JSON format. Please enter a valid JSON array of objects.');
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/create-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: fileName || 'my_data',
          sheet_name: sheetName || 'Sheet1',
          data: excelData
        }),
      });

      if (response.ok) {
        // Get the blob from response
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName || 'my_data'}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        setMessage('Excel file created and downloaded successfully!');
        
        // Reset form
        if (inputMode === 'form') {
          setDataEntries([{ key: '', value: '' }]);
        } else {
          setJsonInput('');
        }
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Failed to create Excel file.');
      }
    } catch (error) {
      console.error('Excel creation error:', error);
      setMessage('Network error. Please make sure the Flask server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Use template
  const useTemplate = (template) => {
    setFileName(template.name.toLowerCase().replace(/\s+/g, '_'));
    setSheetName(template.name);
    createExcelFile(template.sampleData);
  };

  // Get preview data
  const getPreviewData = () => {
    if (inputMode === 'form') {
      return convertFormToData();
    } else {
      try {
        const parsed = JSON.parse(jsonInput);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <FileSpreadsheet className="w-8 h-8 mr-3 text-green-600" />
                Excel File Creator
              </h1>
              <p className="text-gray-600">Create and download Excel files locally with custom data</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Local File Creation</div>
              <div className="text-lg font-semibold text-green-600">Ready to Use</div>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 flex items-center ${
            message.includes('success') ? 'bg-green-50 border border-green-200 text-green-800' : 
            'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <AlertCircle className="w-5 h-5 mr-2" />
            {message}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex bg-white rounded-lg shadow-lg mb-6 p-1 border border-gray-200">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
              activeTab === 'create' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            Create Custom Excel
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
              activeTab === 'templates' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            Use Templates
          </button>
        </div>

        {activeTab === 'create' ? (
          <div className="space-y-6">
            {/* File Settings */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">File Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    File Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="my_data"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Sheet Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sheet1"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Data Entry */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Enter Your Data</h2>
                
                {/* Input Mode Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setInputMode('form')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      inputMode === 'form' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Form Mode
                  </button>
                  <button
                    onClick={() => setInputMode('json')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      inputMode === 'json' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    JSON Mode
                  </button>
                </div>
              </div>

              {inputMode === 'form' ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-gray-700 text-sm font-semibold">
                        Data Fields
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        {showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                        {showPreview ? 'Hide' : 'Show'} Preview
                      </button>
                    </div>
                    
                    {dataEntries.map((entry, index) => (
                      <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Column name (e.g., Product, Name, ID)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={entry.key}
                            onChange={(e) => updateEntry(index, 'key', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Value (e.g., Laptop, John Doe, 12345)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full flex items-center justify-center py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add Another Field
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      JSON Array of Objects
                    </label>
                    <div className="text-sm text-gray-600 mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <strong>Example format:</strong>
                      <pre className="mt-1 text-xs">
{`[
  {"Product": "Laptop", "Price": 999.99, "Stock": 5},
  {"Product": "Mouse", "Price": 25.50, "Stock": 20}
]`}
                      </pre>
                    </div>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      rows="8"
                      placeholder='[{"Column1": "Value1", "Column2": "Value2"}]'
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Preview */}
              {showPreview && (
                <div className="mt-4 bg-gray-100 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Data Preview:</h4>
                  <pre className="text-sm text-gray-600 overflow-x-auto">
                    {JSON.stringify(getPreviewData(), null, 2)}
                  </pre>
                </div>
              )}

              {/* Create Button */}
              <button
                onClick={() => createExcelFile()}
                disabled={isLoading}
                className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <Download className="w-5 h-5 mr-2" />
                )}
                {isLoading ? 'Creating Excel File...' : 'Create & Download Excel File'}
              </button>
            </div>
          </div>
        ) : (
          /* Templates Tab */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{template.name}</h3>
                    <p className="text-gray-600 text-sm">{template.description}</p>
                  </div>
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Columns:</h4>
                  <div className="flex flex-wrap gap-1">
                    {template.columns.map((column, index) => (
                      <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {column}
                      </span>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => useTemplate(template)}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Use This Template
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelCreatorApp;