import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store';
import App from './App.tsx';
import { PlanSyncProvider } from './components/PlanSyncProvider';
import { CookieConsent } from './components/CookieConsent';
import './index.css';

// ─── Sentry init (deferred to after load so it doesn't block FCP/LCP) ─────
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    import('@sentry/react').then((Sentry) => {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.1,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
        ],
        replaysSessionSampleRate: 0.01,
        replaysOnErrorSampleRate: 1.0,
      });
    });
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function loadFonts() {
  const sheets = [
    '@fontsource/inter/latin-400.css',
    '@fontsource/inter/latin-500.css',
    '@fontsource/inter/latin-600.css',
    '@fontsource/inter/latin-700.css',
    '@fontsource/plus-jakarta-sans/latin-400.css',
    '@fontsource/plus-jakarta-sans/latin-600.css',
    '@fontsource/plus-jakarta-sans/latin-700.css',
    '@fontsource/jetbrains-mono/latin-400.css',
  ];
  sheets.forEach((href) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  });
}

// ─── Load fonts on idle (trackers are now loaded via CookieConsent after consent) ──
if ('requestIdleCallback' in window) {
  (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(loadFonts, { timeout: 2000 });
} else {
  setTimeout(loadFonts, 500);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <PlanSyncProvider>
          <App />
          <CookieConsent />
        </PlanSyncProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
