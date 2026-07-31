import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useStore';
import {
  logout as logoutAction,
  checkAuth,
  login as loginAction,
  register as registerAction,
  verifyOtp as verifyOtpAction,
  googleLogin as googleLoginAction,
} from '../store/slices/authSlice';

export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const loading = useAppSelector((s) => s.auth.loading);
  const initialized = useAppSelector((s) => s.auth.initialized);
  const token = useAppSelector((s) => s.auth.token);

  useEffect(() => {
    if (token && !initialized) {
      dispatch(checkAuth());
    }
  }, [token, initialized, dispatch]);

  const login = useCallback(async (email: string, password: string) => {
    return dispatch(loginAction({ email, password })).unwrap();
  }, [dispatch]);

  const register = useCallback(async (data: { name: string; email: string; password: string; company?: string; phoneNumber?: string }) => {
    return dispatch(registerAction(data)).unwrap();
  }, [dispatch]);

  const verifyOtp = useCallback(async (email: string, otp: string, purpose: 'register' | 'login') => {
    return dispatch(verifyOtpAction({ email, otp, purpose })).unwrap();
  }, [dispatch]);

  const googleLogin = useCallback(async (credential: string) => {
    return dispatch(googleLoginAction(credential)).unwrap();
  }, [dispatch]);

  const logout = useCallback(() => {
    return dispatch(logoutAction() as any);
  }, [dispatch]);

  return {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    login,
    register,
    verifyOtp,
    googleLogin,
    logout,
  };
}
