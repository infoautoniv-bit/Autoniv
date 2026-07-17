import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App.tsx';
import './index.css';

// Self-hosted fonts to eliminate render-blocking external requests
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";

import "@fontsource/plus-jakarta-sans/300.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";

import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";

// ─── Dynamic tracking script loaders (read from VITE env at runtime) ─────────
const gaId = import.meta.env.VITE_GA_ID;
if (gaId && gaId.startsWith('G-')) {
  const gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(gaScript);

  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function (...args: any[]) { w.dataLayer.push(args); };
  w.gtag('js', new Date());
  w.gtag('config', gaId);
}

const clarityId = import.meta.env.VITE_CLARITY_ID;
if (clarityId && clarityId.length > 5 && !clarityId.includes('%')) {
  const w = window as any;
  w.clarity = w.clarity || function (...args: any[]) {
    (w.clarity.q = w.clarity.q || []).push(args);
  };
  const clarityScript = document.createElement('script');
  clarityScript.async = true;
  clarityScript.src = 'https://www.clarity.ms/tag/' + clarityId;
  const firstScript = document.getElementsByTagName('script')[0];
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(clarityScript, firstScript);
  } else {
    document.head.appendChild(clarityScript);
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);