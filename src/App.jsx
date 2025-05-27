import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import ExcelReader from './Excelreader.jsx';
import './ExcelReader.css'

function App() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Excel Entry Tracker</h1>
      <ExcelReader />
    </div>
  );
}



export default App
