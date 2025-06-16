// src/index.js
console.log('index.js is loading');
document.body.innerHTML = '<h1 style="color: red;">JavaScript is working!</h1>';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router>
    <App />
  </Router>
);
