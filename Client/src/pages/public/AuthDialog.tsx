import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../App';
import { authService } from '../../services/api';
// import { useAppDispatch } from '../../hooks/useStore';
// import { checkAuth } from '../../store/slices/authSlice';

type AuthMode = 'login' | 'register' | 'forgot_password' | 'reset_password';

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
}

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccounts {
  accounts: {
    id: {
      initialize: (opts: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
    };
    oauth2: {
      initTokenClient: (opts: {
        client_id: string;
        scope: string;
        callback: (response: GoogleTokenResponse) => void;
      }) => { requestAccessToken: () => void };
    };
  };
}

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

interface AuthDialogProps {
  mode: AuthMode;
  isOpen: boolean;
  onClose: () => void;
  onSwitch: (mode: AuthMode) => void;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(value)) return 'Enter a valid email address';
  if (value.length > 254) return 'Email is too long';
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return 'Password is required';
  if (value.length < 10) return 'Password must be at least 10 characters';
  if (value.length > 128) return 'Password is too long';
  if (!/[A-Z]/.test(value)) return 'Password must include an uppercase letter';
  if (!/[a-z]/.test(value)) return 'Password must include a lowercase letter';
  if (!/[0-9]/.test(value)) return 'Password must include a digit';
  if (!/[^A-Za-z0-9]/.test(value)) return 'Password must include a symbol';
  return null;
}

function validateName(value: string): string | null {
  if (!value.trim()) return 'Name is required';
  if (value.trim().length < 2) return 'Name must be at least 2 characters';
  if (value.trim().length > 100) return 'Name is too long';
  return null;
}

function validatePhone(value: string): string | null {
  if (!value.trim()) return null;
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length !== 10) return 'Phone number must be exactly 10 digits';
  return null;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 10) score++;
  if (password.length >= 14) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: 'Weak',   color: 'bg-rose-500' };
  if (score <= 2) return { score, label: 'Fair',   color: 'bg-amber-500' };
  if (score <= 3) return { score, label: 'Good',   color: 'bg-[var(--primary)]' };
  return           { score, label: 'Strong', color: 'bg-[var(--primary)]' };
}

function parseError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) return err.response?.data?.message ?? fallback;
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
}

export function AuthDialog({ mode, isOpen, onClose, onSwitch }: AuthDialogProps) {
  const navigate = useNavigate();
  const { login, register, verifyOtp } = useAuth();

  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [company, setCompany]         = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched]         = useState<Record<string, boolean>>({});

  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm]   = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [success, setSuccess]         = useState('');

  const [showOtp, setShowOtp]         = useState(false);
  const [otp, setOtp]                 = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer]             = useState(30);
  const [otpPurpose, setOtpPurpose]   = useState<'login' | 'register' | null>(null);

  const isLogin = mode === 'login';

  /*
  const handleGoogleClick = () => {
    if (window.google) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '235489562479-placeholder.apps.googleusercontent.com',
        scope: 'email profile openid',
        callback: async (response: GoogleTokenResponse) => {
          if (response.error) {
            setError('Google login failed');
            return;
          }
          setError('');
          setLoading(true);
          try {
            if (response.access_token) await googleLogin(response.access_token);
            onClose();
            const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
            navigate(stored?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Google login failed');
          } finally {
            setLoading(false);
          }
        },
      });
      client.requestAccessToken();
    }
  };


  // Load and initialize Google Identity Services script when dialog is open
  const googleInitRef = useRef(false);

  useEffect(() => {
    if (!isOpen || showOtp || mode === 'forgot_password' || mode === 'reset_password') return;

    const initializeGoogle = () => {
      if (window.google && !googleInitRef.current) {
        googleInitRef.current = true;
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '235489562479-placeholder.apps.googleusercontent.com',
          callback: async (response: GoogleCredentialResponse) => {
            setError('');
            setLoading(true);
            try {
              await googleLogin(response.credential);
              onClose();
              const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
              navigate(stored?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
            } catch (err: unknown) {
              setError(err instanceof Error ? err.message : 'Google login failed');
            } finally {
              setLoading(false);
            }
          },
        });
      }
    };

    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = initializeGoogle;
    } else {
      initializeGoogle();
    }
  }, [isOpen, showOtp, mode, googleLogin, onClose, navigate]);
  */

  // Reset form on mode change
  useEffect(() => {
    if (mode !== 'reset_password') {
      setEmail('');
      setName('');
      setPassword('');
      setConfirmPassword('');
      setPhoneNumber('');
      setCompany('');
    }
    setError(''); setLoading(false);
    setFieldErrors({}); setTouched({});
    setShowPassword(false);
    setShowResetPassword(false);
    setShowResetConfirm(false);
    setResetPassword('');
    setResetConfirm('');
    setSuccess('');
    setShowOtp(false);
    setOtp(Array(6).fill(''));
    setTimer(30);
    setOtpPurpose(null);
  }, [mode, isOpen]);

  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    if ((showOtp || mode === 'reset_password') && timer > 0) {
      t = setInterval(() => setTimer((v) => v - 1), 1000);
    }
    return () => clearInterval(t);
  }, [showOtp, mode, timer]);

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setError('');
    try {
      await authService.resendOtp(email, mode === 'reset_password' ? 'reset_password' : otpPurpose!);
      setTimer(30);
      setOtp(Array(6).fill(''));
    } catch (err: unknown) {
      setError(parseError(err, 'Failed to resend code'));
    }
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const val = element.value.replace(/[^0-9]/g, '');
    if (!val) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    if (element.nextSibling && index < 5) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      if (e.currentTarget.previousSibling && index > 0) {
        (e.currentTarget.previousSibling as HTMLInputElement).focus();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (text.length === 6) {
      const newOtp = text.split('');
      setOtp(newOtp);
      const target = e.currentTarget.parentElement?.children[5] as HTMLInputElement;
      target?.focus();
    }
  };

  const validateField = (fieldName: string, value: string): string | null => {
    switch (fieldName) {
      case 'email':       return validateEmail(value);
      case 'password':    return isLogin ? (!value ? 'Password is required' : null) : validatePassword(value);
      case 'name':        return validateName(value);
      case 'phoneNumber': return validatePhone(value);
      case 'confirmPassword': return password !== value ? 'Passwords do not match' : null;
      default:            return null;
    }
  };

  const handleBlur = (fieldName: string, value: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    setFieldErrors((prev) => ({ ...prev, [fieldName]: validateField(fieldName, value) }));
  };

  const handleChange = (fieldName: string, value: string) => {
    if (touched[fieldName]) {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: validateField(fieldName, value) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // ── OTP Verification Submission ────────────────────────────────────────
    if (showOtp) {
      const code = otp.join('');
      if (code.length !== 6) {
        setError('Please enter a 6-digit verification code');
        return;
      }
      setLoading(true);
      try {
        await verifyOtp(email, code, otpPurpose!);
        onClose();
        const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (otpPurpose === 'register') {
          navigate('/onboarding', { replace: true });
        } else {
          navigate(stored?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
        }
      } catch (err) {
        setError(parseError(err, 'Verification failed'));
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── Forgot Password ────────────────────────────────────────────────────
    if (mode === 'forgot_password') {
      if (!email || validateEmail(email)) {
        setError('Please enter a valid email');
        return;
      }
      setLoading(true);
      try {
        await authService.forgotPassword(email);
        onSwitch('reset_password');
      } catch (err) {
        setError(parseError(err, 'Failed to send reset code'));
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── Reset Password ─────────────────────────────────────────────────────
    if (mode === 'reset_password') {
      const code = otp.join('');
      if (code.length !== 6) {
        setError('Please enter the 6-digit verification code');
        return;
      }
      if (!resetPassword || resetPassword.length < 10) {
        setError('Password must be at least 10 characters');
        return;
      }
      if (resetPassword !== resetConfirm) {
        setError('Passwords do not match');
        return;
      }
      setLoading(true);
      try {
        await authService.resetPassword(email, resetPassword, code);
        setSuccess('Password reset successfully! You can now sign in.');
        setTimeout(() => onSwitch('login'), 2000);
      } catch (err) {
        setError(parseError(err, 'Failed to reset password'));
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── Login / Register ───────────────────────────────────────────────────
    const errors: Record<string, string | null> = {
      email:    validateEmail(email),
      password: isLogin ? (!password ? 'Password is required' : null) : validatePassword(password),
      ...(!isLogin && {
        name:        validateName(name),
        phoneNumber: validatePhone(phoneNumber),
        confirmPassword: password !== confirmPassword ? 'Passwords do not match' : null,
      }),
    };

    setFieldErrors(errors);
    setTouched({
      email: true, password: true,
      ...(!isLogin && { name: true, phoneNumber: true, confirmPassword: true }),
    });

    if (Object.values(errors).some(Boolean)) return;

    setLoading(true);
    try {
      if (isLogin) {
        const res = await login(email, password);
        if (res && 'requiresOtp' in res && res.requiresOtp) {
          setOtpPurpose('login');
          setShowOtp(true);
          setTimer(30);
          setOtp(Array(6).fill(''));
          return;
        }
      } else {
        const res = await register({ name, email, password, company, phoneNumber });
        if (res && 'requiresOtp' in res && res.requiresOtp) {
          setOtpPurpose('register');
          setShowOtp(true);
          setTimer(30);
          setOtp(Array(6).fill(''));
          return;
        }
      }
      onClose();
      const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (!isLogin) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(stored?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
      }
    } catch (err) {
      setError(parseError(err, `${isLogin ? 'Login' : 'Registration'} failed. Please try again.`));
    } finally {
      setLoading(false);
    }
  };

  const strength = password ? getPasswordStrength(password) : null;

  const getTitle = () => {
    if (showOtp) return 'Verify your identity';
    if (mode === 'forgot_password') return 'Forgot Password';
    if (mode === 'reset_password')  return 'Reset Password';
    return isLogin ? 'Welcome back' : 'Create your account';
  };

  const getSubtitle = () => {
    if (showOtp) return `Enter the 6-digit code sent to ${email}`;
    if (mode === 'forgot_password') return "Enter your email and we'll send you a reset code";
    if (mode === 'reset_password')  return 'Enter the verification code and your new password';
    return isLogin ? 'Sign in to your account to continue' : 'Start your free trial today';
  };

  const isAuthFlow = mode === 'forgot_password' || mode === 'reset_password';

  const submitLabel = () => {
    if (showOtp) return 'Verify Code';
    if (mode === 'forgot_password') return 'Send Reset Code';
    if (mode === 'reset_password')  return 'Reset Password';
    return isLogin ? 'Sign in' : 'Create account';
  };

  const loadingLabel = () => {
    if (showOtp) return 'Verifying...';
    if (mode === 'forgot_password') return 'Sending...';
    if (mode === 'reset_password')  return 'Resetting...';
    return isLogin ? 'Signing in…' : 'Creating account…';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} size="md">
      <div className="space-y-5 sm:space-y-6">
        <p className="text-sm" style={{ color: 'rgba(148,175,210,0.7)' }}>{getSubtitle()}</p>

        {success && (
          <div className="p-3.5 rounded-xl text-sm flex items-start gap-3" style={{ 
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: '#34d399'
          }}>
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl text-sm flex items-start gap-3" style={{ 
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171'
            }}>
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* ── OTP Verification (Login / Register) ────────────────── */}
          {showOtp && (
            <>
              <Field label="Verification Code" error={null}>
                <div className="flex justify-center gap-3 my-4">
                  {otp.map((data, index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={data}
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all duration-200"
                      style={{
                        background: data ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                        border: data ? '2px solid rgba(16,185,129,0.5)' : '2px solid rgba(255,255,255,0.08)',
                        boxShadow: data ? '0 0 20px rgba(16,185,129,0.15)' : 'none',
                      }}
                    />
                  ))}
                </div>
              </Field>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={timer > 0}
                  className="font-medium transition-colors disabled:opacity-50"
                  style={{ color: '#10b981' }}
                >
                  {timer > 0 ? `Resend Code in ${timer}s` : 'Resend Code'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowOtp(false); setError(''); }}
                  className="transition-colors"
                  style={{ color: 'rgba(148,175,210,0.5)' }}
                >
                  Back
                </button>
              </div>
            </>
          )}

          {/* ── Forgot Password: Email ─────────────────────────────── */}
          {!showOtp && mode === 'forgot_password' && (
            <Field label="Email" error={null}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className={inputCls(false)}
              />
            </Field>
          )}

          {/* ── Reset Password ────────────────────────────────────── */}
          {!showOtp && mode === 'reset_password' && (
            <>
              <Field label="Verification Code" error={null}>
                <div className="flex justify-center gap-3 my-4">
                  {otp.map((data, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      value={data}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all duration-200"
                      style={{
                        background: data ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                        border: data ? '2px solid rgba(16,185,129,0.5)' : '2px solid rgba(255,255,255,0.08)',
                        boxShadow: data ? '0 0 20px rgba(16,185,129,0.15)' : 'none',
                      }}
                    />
                  ))}
                </div>
              </Field>

              <div className="flex items-center justify-between text-sm mt-1 mb-4">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={timer > 0}
                  className="font-medium transition-colors disabled:opacity-50"
                  style={{ color: '#10b981' }}
                >
                  {timer > 0 ? `Resend Code in ${timer}s` : 'Resend Code'}
                </button>
              </div>

              <Field label="New Password" error={null}>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    className={`${inputCls(false)} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'rgba(148,175,210,0.5)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(148,175,210,0.8)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(148,175,210,0.5)'}
                    tabIndex={-1}
                    aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                  >
                    {showResetPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {resetPassword.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {[
                      { label: 'At least 10 characters',  met: resetPassword.length >= 10 },
                      { label: 'Uppercase letter',         met: /[A-Z]/.test(resetPassword) },
                      { label: 'Lowercase letter',         met: /[a-z]/.test(resetPassword) },
                      { label: 'Number',                   met: /\d/.test(resetPassword) },
                      { label: 'Special character',        met: /[^A-Za-z0-9]/.test(resetPassword) },
                    ].map((check, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className={check.met ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}>
                          {check.met ? '✓' : '○'}
                        </span>
                        <span className={check.met ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
              <Field label="Confirm Password" error={null}>
                <div className="relative">
                  <input
                    type={showResetConfirm ? 'text' : 'password'}
                    value={resetConfirm}
                    onChange={(e) => setResetConfirm(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    className={`${inputCls(false)} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'rgba(148,175,210,0.5)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(148,175,210,0.8)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(148,175,210,0.5)'}
                    tabIndex={-1}
                    aria-label={showResetConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showResetConfirm ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {resetConfirm && resetPassword !== resetConfirm && (
                  <p className="text-xs text-rose-400 mt-1">Passwords do not match</p>
                )}
              </Field>
            </>
          )}

          {/* ── Login / Register Fields ───────────────────────────── */}
          {!showOtp && !isAuthFlow && (
            <>
              {/*
              <button
                type="button"
                onClick={handleGoogleClick}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-medium text-white transition-all duration-300 cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 border-t border-white/10" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Or continue with email</span>
                <div className="flex-1 border-t border-white/10" />
              </div>
              */}

              {!isLogin && (
                <Field label="Full Name" error={touched.name ? fieldErrors.name : null}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); handleChange('name', e.target.value); }}
                    onBlur={() => handleBlur('name', name)}
                    placeholder="John Doe"
                    autoComplete="name"
                    className={inputCls(touched.name && !!fieldErrors.name)}
                  />
                </Field>
              )}

              <Field label="Email" error={touched.email ? fieldErrors.email : null}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); handleChange('email', e.target.value); }}
                  onBlur={() => handleBlur('email', email)}
                  placeholder="you@company.com"
                  autoComplete={isLogin ? 'username' : 'email'}
                  className={inputCls(touched.email && !!fieldErrors.email)}
                />
              </Field>

              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Phone Number" error={touched.phoneNumber ? fieldErrors.phoneNumber : null}>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                        setPhoneNumber(val);
                        handleChange('phoneNumber', val);
                      }}
                      onBlur={() => handleBlur('phoneNumber', phoneNumber)}
                      placeholder="9876543210"
                      autoComplete="tel"
                      className={inputCls(touched.phoneNumber && !!fieldErrors.phoneNumber)}
                    />
                  </Field>

                  <Field label="Company" hint="optional">
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Your Company"
                      autoComplete="organization"
                      className={inputCls(false)}
                    />
                  </Field>
                </div>
              )}

              <div className={isLogin ? '' : 'grid grid-cols-2 gap-4'}>
                <Field label="Password" error={touched.password ? fieldErrors.password : null}>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); handleChange('password', e.target.value); }}
                      onBlur={() => handleBlur('password', password)}
                      placeholder={isLogin ? 'Enter your password' : 'Create a strong password'}
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      minLength={isLogin ? undefined : 10}
                      className={`${inputCls(touched.password && !!fieldErrors.password)} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'rgba(148,175,210,0.5)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(148,175,210,0.8)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(148,175,210,0.5)'}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {!isLogin && password && strength && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i < strength.score ? strength.color : 'bg-[var(--surface)]'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[10px]" style={{ color: 'rgba(148,175,210,0.5)' }}>
                        {strength.label} — 10+ chars, uppercase, lowercase, number & symbol
                      </p>
                    </div>
                  )}
                </Field>

                {!isLogin && (
                  <Field label="Confirm Password" error={touched.confirmPassword ? fieldErrors.confirmPassword : null}>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); handleChange('confirmPassword', e.target.value); }}
                        onBlur={() => handleBlur('confirmPassword', confirmPassword)}
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        className={`${inputCls(touched.confirmPassword && !!fieldErrors.confirmPassword)} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: 'rgba(148,175,210,0.5)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(148,175,210,0.8)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(148,175,210,0.5)'}
                        tabIndex={-1}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-rose-400 mt-1">Passwords do not match</p>
                    )}
                  </Field>
                )}
              </div>
            </>
          )}


          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            style={{
              background: 'var(--gg)',
              backgroundSize: '200% 200%',
              boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(16,185,129,0.35)';
                e.currentTarget.style.backgroundPosition = '100% 100%';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(16,185,129,0.25)';
              e.currentTarget.style.backgroundPosition = '0% 0%';
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {loadingLabel()}
              </>
            ) : submitLabel()}
          </button>
        </form>

        {/* ── Footer Links ─────────────────────────────────────────── */}
        {mode === 'login' && (
          <p className="text-center text-sm" style={{ color: 'rgba(148,175,210,0.5)' }}>
            <button
              type="button"
              onClick={() => onSwitch('forgot_password')}
              className="font-medium transition-colors"
              style={{ color: '#10b981' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#34d399'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#10b981'}
            >
              Forgot Password?
            </button>
          </p>
        )}

        {mode === 'forgot_password' && (
          <p className="text-center text-sm" style={{ color: 'rgba(148,175,210,0.5)' }}>
            Remember your password?{' '}
            <button
              type="button"
              onClick={() => onSwitch('login')}
              className="font-medium transition-colors"
              style={{ color: '#10b981' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#34d399'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#10b981'}
            >
              Sign in
            </button>
          </p>
        )}

        {!isAuthFlow && (
          <p className="text-center text-sm" style={{ color: 'rgba(148,175,210,0.5)' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => onSwitch(isLogin ? 'register' : 'login')}
              className="font-medium transition-colors"
              style={{ color: '#10b981' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#34d399'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#10b981'}
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </p>
        )}
      </div>
    </Modal>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return [
    'w-full px-4 py-3 rounded-xl text-xs sm:text-sm',
    'text-white placeholder-slate-500',
    'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40',
    'transition-all duration-300',
    hasError
      ? 'border-rose-500/40 bg-rose-500/5'
      : 'border-white/10 bg-white/[0.02] hover:border-white/20 focus:bg-white/[0.04]',
    'border'
  ].join(' ');
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label className="block text-sm font-medium" style={{ color: 'rgba(148,175,210,0.8)' }}>{label}</label>
        {hint && <span className="text-xs" style={{ color: 'rgba(148,175,210,0.3)' }}>({hint})</span>}
      </div>
      {children}
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  );
}