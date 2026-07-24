import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App.tsx';
import { PlanSyncProvider } from './components/PlanSyncProvider';
import './index.css';

// Self-hosted fonts (Latin subset only for optimal bundle size)
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";

import "@fontsource/plus-jakarta-sans/latin-400.css";
import "@fontsource/plus-jakarta-sans/latin-600.css";
import "@fontsource/plus-jakarta-sans/latin-700.css";

import "@fontsource/jetbrains-mono/latin-400.css";

// ─── Dynamic tracking script loaders — deferred until page is idle ────────────
// Wrapping in requestIdleCallback (with setTimeout fallback) ensures these
// 158 kB third-party scripts never block LCP or FCP on the critical path.
function loadTrackers() {
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
    document.head.appendChild(clarityScript);
  }
}

if ('requestIdleCallback' in window) {
  (window as any).requestIdleCallback(loadTrackers, { timeout: 4000 });
} else {
  setTimeout(loadTrackers, 3000);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PlanSyncProvider>
        <App />
      </PlanSyncProvider>
    </Provider>
  </React.StrictMode>
);