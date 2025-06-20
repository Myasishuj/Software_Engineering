import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ExcelReader from './ExcelReader.jsx';
import Notification from './Notification';
import './ExcelReader.css';

function App() {
  return (
    <Router>
      <div style={{ padding: '2rem' }}>
        <h1>Excel Entry Tracker</h1>
        <Routes>
          <Route path="/" element={<ExcelReader />} />
          <Route path="/excel-reader" element={<ExcelReader />} />
          <Route path="/notification" element={<Notification />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
