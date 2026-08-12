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

// ─── Core Web Vitals Performance Tracking ──────────────────────────────
if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  window.addEventListener('load', () => {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (typeof window.gtag === 'function') {
            window.gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_action: entry.name,
              value: Math.round(entry.startTime || (entry as any).value || 0),
              non_interaction: true,
            });
          }
        }
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // Non-critical performance observer fallback
    }
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

// Fonts are loaded via inline @font-face in index.html — no JS-based font loading needed.

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
