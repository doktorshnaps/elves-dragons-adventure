import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { WalletConnectProvider } from './contexts/WalletConnectContext';
import { AdminProvider } from './contexts/AdminContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <WalletConnectProvider>
        <AdminProvider>
          <App />
        </AdminProvider>
      </WalletConnectProvider>
    </BrowserRouter>
  </React.StrictMode>,
);