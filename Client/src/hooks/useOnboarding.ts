import { useState, useCallback } from 'react';

const STORAGE_KEY = 'autoniv_onboarding_done';

export function useOnboarding() {
  const [show, setShow] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
    setShow(false);
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setShow(true);
  }, []);

  return { show, dismiss, reset };
}
