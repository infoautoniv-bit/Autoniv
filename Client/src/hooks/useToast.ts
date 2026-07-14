import { useState, useCallback } from 'react';
import { TOAST_DURATION_MS } from '../config/constants';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((message: string, type: ToastType = 'info', action?: { label: string; onClick: () => void }) => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type, action }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), TOAST_DURATION_MS);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  return { toasts, add, remove };
}
