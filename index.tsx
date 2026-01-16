import React from 'react';
import './index.css';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container!);

// Global Error Handler for debugging
window.onerror = function (message, source, lineno, colno, error) {
  const errDiv = document.createElement('div');
  errDiv.style.position = 'fixed';
  errDiv.style.top = '0';
  errDiv.style.left = '0';
  errDiv.style.width = '100%';
  errDiv.style.backgroundColor = 'red';
  errDiv.style.color = 'white';
  errDiv.style.padding = '20px';
  errDiv.style.zIndex = '9999';
  errDiv.innerText = `Runtime Error: ${message}\nSource: ${source}:${lineno}`;
  document.body.appendChild(errDiv);
};

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);