import { useEffect } from 'react';

export function useKeyboardShortcut(
  key: string,
  handler: () => void,
  options?: { ctrl?: boolean; alt?: boolean; shift?: boolean; enabled?: boolean }
) {
  useEffect(() => {
    const { ctrl = false, alt = false, shift = false, enabled = true } = options ?? {};
    if (!enabled) return;

    const listener = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === key.toLowerCase() && e.ctrlKey === ctrl && e.altKey === alt && e.shiftKey === shift) {
        e.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [key, handler, options?.ctrl, options?.alt, options?.shift, options?.enabled]);
}
