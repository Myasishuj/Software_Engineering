// src/ExcelReader.jsx
import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { QRCodeCanvas } from 'qrcode.react';
import './ExcelReader.css';

function ExcelReader() {
  const [excelData, setExcelData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setSearchTerm('');
    setSearchColumn('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const binaryStr = evt.target.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        setExcelData(jsonData);
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading Excel file. Please check the file format.');
      }
    };
    reader.onerror = () => {
      alert('Error reading file');
    };
    reader.readAsBinaryString(file);
  };

  const columns = useMemo(() => {
    if (excelData.length > 0) {
      return Object.keys(excelData[0]);
    }
    return [];
  }, [excelData]);

  const filteredData = useMemo(() => {
    if (!searchTerm || !searchColumn) return excelData;

    return excelData.filter(row => {
      const value = row[searchColumn];
      if (value === undefined) return false;
      
      return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [excelData, searchTerm, searchColumn]);

  return (
    <div className="container">
      <h1>Excel to QR Code Generator</h1>
      
      <div className="file-input-container">
        <label className="file-input-label">
          Choose Excel File
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleFileUpload} 
            className="file-input"
          />
        </label>
        {fileName && <span className="file-name">{fileName}</span>}
      </div>

      {excelData.length > 0 && (
        <div className="search-container">
          <h3>Search Records</h3>
          <div className="search-controls">
            <select
              value={searchColumn}
              onChange={(e) => setSearchColumn(e.target.value)}
              className="search-select"
            >
              <option value="">Select Column</option>
              {columns.map((col, index) => (
                <option key={index} value={col}>{col}</option>
              ))}
            </select>
            
            <input
              type="text"
              placeholder="Search term..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              disabled={!searchColumn}
            />
            
            <button
              onClick={() => {
                setSearchTerm('');
                setSearchColumn('');
              }}
              className="reset-button"
            >
              Reset
            </button>
          </div>
          <p className="search-results-count">
            Showing {filteredData.length} of {excelData.length} records
          </p>
        </div>
      )}

      {filteredData.length > 0 ? (
        <>
          <div className="grid">
            {filteredData.map((row, index) => (
              <div className="card" key={index}>
                <h3>Record #{excelData.indexOf(row) + 1}</h3>
                <div className="data-container">
                  <pre>{JSON.stringify(row, null, 2)}</pre>
                </div>
                <div className="qr-container">
                  <QRCodeCanvas 
                    value={JSON.stringify(row)} 
                    size={180}
                    level="H"
                    includeMargin={true}
                  />
                  <p className="qr-caption">Scan to view data</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : excelData.length > 0 ? (
        <div className="empty-state">
          <p>No records found matching your search criteria.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSearchColumn('');
            }}
            className="reset-button"
          >
            Show All Records
          </button>
        </div>
      ) : (
        <div className="empty-state">
          <p>No data yet. Please upload an Excel file to generate QR codes.</p>
          <div className="instructions">
            <h3>Supported Formats:</h3>
            <ul>
              <li>.xlsx (Excel Workbook)</li>
              <li>.xls (Excel 97-2003)</li>
              <li>.csv (Comma Separated Values)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExcelReader;