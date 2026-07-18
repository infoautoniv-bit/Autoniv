import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useStore';
import { updatePlan } from '../store/slices/authSlice';
import { authService } from '../services/api';

const POLL_INTERVAL_MS = 10_000;

export function usePlanSync() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const token = useAppSelector((s) => s.auth.token);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const { data } = await authService.planStatus();
      if (data) {
        dispatch(updatePlan(data));
      }
    } catch {
      // Silent — will retry next interval
    }
  }, [dispatch]);

  useEffect(() => {
    if (!token || !user) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    const onFocus = () => poll();
    const onVisibility = () => { if (document.visibilityState === 'visible') poll(); };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [token, user?.id, poll]);
}
