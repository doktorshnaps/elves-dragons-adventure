import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { QueryProvider } from './providers/QueryProvider';
import { WalletConnectProvider } from './contexts/WalletConnectContext';
import './index.css';

// StrictMode disabled to prevent duplicate provider initialization
// causing duplicate database queries (2x get_item_instances_by_wallet)
ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <QueryProvider>
      <WalletConnectProvider>
        <App />
      </WalletConnectProvider>
    </QueryProvider>
  </BrowserRouter>,
);
