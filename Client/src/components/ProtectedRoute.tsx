import { memo, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAppSelector } from '../hooks/useStore';
import { isChatPlan, isVoicePlan } from '../utils/plan';
import LoadingScreen from './LoadingScreen';

export const ProtectedRoute = memo(function ProtectedRoute({
  children,
  adminOnly = false,
  hideSidebar = false,
  feature,
}: {
  children: ReactNode;
  adminOnly?: boolean;
  hideSidebar?: boolean;
  feature?: 'chat' | 'voice';
}) {
  const { user, isAdmin } = useAuth();
  const initialized = useAppSelector((s) => s.auth.initialized);
  const token = useAppSelector((s) => s.auth.token);

  if (token && !initialized) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  if (feature && !isAdmin) {
    if (feature === 'chat' && !isChatPlan(user)) return <Navigate to="/dashboard?error=chat_restricted" replace />;
    if (feature === 'voice' && !isVoicePlan(user)) return <Navigate to="/dashboard?error=voice_restricted" replace />;
  }

  if (hideSidebar) return <div className="min-h-screen" style={{ background: 'var(--bg)' }}>{children}</div>;
  return <>{children}</>;
});
