import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { updatePlan } from '../store/slices/authSlice';
import { authService } from '../services/api';
import { getCookie } from '../services/cookies';

const POLL_INTERVAL_MS = 60_000;

export function usePlanSync() {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPlanRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;

    lastPlanRef.current = user.plan ?? null;

    function handlePlanChange(data: any) {
      const prev = lastPlanRef.current;
      const next = data.plan;

      if (prev && next && prev !== next) {
        import('react-hot-toast').then(({ default: toast }) => {
          toast.success(`Your plan has been updated to ${data.chatPlan || data.voicePlan || next}`, {
            duration: 6000,
            icon: '\u2B50',
          });
        });
      }

      dispatch(updatePlan(data));
      lastPlanRef.current = next;
    }

    // WebSocket connection
    function connectWs() {
      const token = getCookie('accessToken');
      if (!token) return;

      const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');
      const wsUrl = base.replace(/^http/, 'ws') + `/ws/plan?token=${token}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'planChanged') {
            handlePlanChange(msg);
          }
        } catch { /* ignore malformed */ }
      };

      ws.onclose = () => {
        wsRef.current = null;
        setTimeout(connectWs, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connectWs();

    // Polling fallback
    pollRef.current = setInterval(async () => {
      try {
        const res = await authService.planStatus();
        handlePlanChange(res.data);
      } catch { /* silent */ }
    }, POLL_INTERVAL_MS);

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [user?.plan]);
}
