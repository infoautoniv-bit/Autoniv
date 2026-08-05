import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CONSENT_KEY = 'autoniv_cookie_consent';

type ConsentState = 'pending' | 'accepted' | 'rejected';

function getInitialConsent(): ConsentState {
  if (typeof window === 'undefined') return 'pending';
  const stored = localStorage.getItem(CONSENT_KEY) as ConsentState | null;
  if (stored === 'accepted' || stored === 'rejected') return stored;
  return 'pending';
}

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState>(getInitialConsent);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defer cookie banner mount until after critical path LCP render completes
    const timer = setTimeout(() => setMounted(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setConsent('accepted');
    loadTrackers();
  };

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, 'rejected');
    setConsent('rejected');
  };

  if (!mounted || consent !== 'pending') return null;

  return (
    <AnimatePresence>
      <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="max-w-4xl mx-auto bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 sm:p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-white font-semibold text-sm mb-1">We value your privacy</p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  We use cookies and analytics to improve your experience and analyze site traffic.
                  By clicking &quot;Accept&quot;, you consent to the use of cookies for analytics purposes.
                  You can reject analytics cookies and still use all features.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleReject}
                  className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  aria-label="Reject cookies"
                >
                  Reject
                </button>
                <button
                  onClick={handleAccept}
                  className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                  aria-label="Accept cookies"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </motion.div>
    </AnimatePresence>
  );
}

function loadTrackers() {
  const gaId = import.meta.env.VITE_GA_ID;
  if (gaId && gaId.startsWith('G-')) {
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(gaScript);

    const w = window as unknown as Record<string, unknown>;
    w.dataLayer = w.dataLayer || [];
    w.gtag = function (...args: unknown[]) { (w.dataLayer as unknown[][]).push(args); };
    (w.gtag as (...args: unknown[]) => void)('js', new Date());
    (w.gtag as (...args: unknown[]) => void)('config', gaId);
  }

  const clarityId = import.meta.env.VITE_CLARITY_ID;
  if (clarityId && clarityId.length > 5 && !clarityId.includes('%')) {
    const w = window as unknown as Record<string, unknown>;
    w.clarity = w.clarity || function (...args: unknown[]) {
      ((w as unknown as Record<string, unknown[]>).clarity_q = (w as unknown as Record<string, unknown[]>).clarity_q || []).push(args);
    };
    const clarityScript = document.createElement('script');
    clarityScript.async = true;
    clarityScript.src = 'https://www.clarity.ms/tag/' + clarityId;
    document.head.appendChild(clarityScript);
  }
}
