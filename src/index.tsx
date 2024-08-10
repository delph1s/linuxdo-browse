import '@assets/scss/index.scss';

import styles from '@assets/scss/vars.module.scss';
import { DEFAULT_APP_SETTINGS } from '@config/index';
import { SettingsProvider } from '@store/context/settings/settingsProvider';
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

const createLinuxDoBrowse = () => {
  const app = document.createElement('div');
  app.setAttribute('id', styles.browseName);
  document.body.appendChild(app);
  return app;
};

ReactDOM.createRoot(createLinuxDoBrowse()).render(
  <React.StrictMode>
    <SettingsProvider settings={DEFAULT_APP_SETTINGS} caches="localStorage">
      <App />
    </SettingsProvider>
  </React.StrictMode>,
);
