import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { applyShotFromUrl } from './dev/applyShotFromUrl';

applyShotFromUrl();

import('./App').then(({ default: App }) => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
