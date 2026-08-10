import { useEffect } from 'react';

export function useKeyboardShortcut(
  key: string,
  handler: () => void,
  options?: { ctrl?: boolean; alt?: boolean; shift?: boolean; enabled?: boolean }
) {
  const { ctrl = false, alt = false, shift = false, enabled = true } = options ?? {};
  useEffect(() => {
    if (!enabled) return;

    const listener = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === key.toLowerCase() && e.ctrlKey === ctrl && e.altKey === alt && e.shiftKey === shift) {
        e.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [key, handler, ctrl, alt, shift, enabled]);
}
