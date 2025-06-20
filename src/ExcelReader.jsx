import { useState, useMemo, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { QRCodeCanvas } from 'qrcode.react';
import './ExcelReader.css';
import { useLocation, useNavigate } from 'react-router-dom';

const MemoizedQRCode = ({ data }) => {
  return useMemo(() => (
    <QRCodeCanvas 
      value={data}
      size={180}
      level="H"
      includeMargin={true}
    />
  ), [data]);
};

function ExcelReader() {
  const [excelData, setExcelData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [hoveredCards, setHoveredCards] = useState({});
  
  const location = useLocation();
  const navigate = useNavigate();

  // Load data from navigation state if available
  useEffect(() => {
    if (location.state?.excelData) {
      setExcelData(location.state.excelData);
      setFileName(location.state.fileName || 'Previously loaded file');
    }
  }, [location.state]);

  const handleCardHover = useCallback((index) => {
    setHoveredCards(prev => ({ ...prev, [index]: true }));
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setSearchTerm('');
    setSearchColumn('');
    setHoveredCards({});

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
    let data = [...excelData];

    if (searchTerm && searchColumn) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      data = data.filter(row => {
        const value = row[searchColumn];
        if (value === undefined) return false;
        return String(value).toLowerCase().includes(lowerCaseSearchTerm);
      });
    }

    if (sortOrder) {
      const dateColumn = columns.find(col => col.toLowerCase().includes('date'));
      if (dateColumn) {
        data.sort((a, b) => {
          const dateA = new Date(a[dateColumn]);
          const dateB = new Date(b[dateColumn]);
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
      }
    }

    return data;
  }, [excelData, searchTerm, searchColumn, sortOrder, columns]);

  const handleNotificationClick = () => {
    navigate('/notification', { 
      state: { 
        records: filteredData,
        excelData: excelData,
        fileName: fileName
      } 
    });
  };

  const memoizedRowStrings = useMemo(() => {
    const cache = {};
    filteredData.forEach((row, index) => {
      cache[index] = JSON.stringify(row);
    });
    return cache;
  }, [filteredData]);

  const resetSearch = useCallback(() => {
    setSearchTerm('');
    setSearchColumn('');
  }, []);

  return (
    <div className="container">
      <h1>Excel to QR Code Generator</h1>
      <button 
        onClick={handleNotificationClick} 
        className="nav-button"
      >
        Go to Notification Page
      </button>
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
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="search-select"
            >
              <option value="">Sort by Date</option>
              <option value="asc">Expiry Closest</option>
              <option value="desc">Expiry Farthest</option>
            </select>
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
              onClick={resetSearch}
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
        <div className="grid">
          {filteredData.map((row, index) => (
            <div 
              className="card" 
              key={index}
              onMouseEnter={() => handleCardHover(index)}
            >
              <h3>Record #{index + 1}</h3>
              <div className="data-container">
                {Object.entries(row).map(([key, value]) => (
                  <p key={key}><strong>{key}:</strong> {value}</p>
                ))}
              </div>
              <div className="qr-container">
                {hoveredCards[index] ? (
                  <MemoizedQRCode data={memoizedRowStrings[index]} />
                ) : (
                  <div className="qr-placeholder">Hover to generate QR</div>
                )}
                <p className="qr-caption">Scan for Record {index + 1}</p>
              </div>
            </div>
          ))}
        </div>
      ) : excelData.length > 0 ? (
        <div className="empty-state">
          <p>No records found matching your search criteria.</p>
          <button onClick={resetSearch} className="reset-button">
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