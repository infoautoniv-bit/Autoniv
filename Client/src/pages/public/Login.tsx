import { type FormEvent, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../../App';
import { authService } from '../../services/api';
import logoAutonivFull from '../../assets/autoniv-full-logo.webp';

/*
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
      prompt: () => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || '235489562479-placeholder.apps.googleusercontent.com';
*/

// const ICE = '#64ddff';

function getStoredUser(): { role?: string } {
  try {
    return JSON.parse(sessionStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

/** Ambient waveform — signals "this is a voice agent," not a chat bot. */
function LiveWaveform({ active }: { active: boolean }) {
  const bars = Array.from({ length: 28 });
  return (
    <div className="flex items-end gap-[3px] h-8" aria-hidden="true">
      {bars.map((_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-[var(--indigo)] to-[var(--secondary)]"
          style={{ height: '100%', transformOrigin: 'bottom' }}
          animate={active ? { scaleY: [0.25, 1, 0.45, 0.85, 0.25] } : { scaleY: 0.3 }}
          transition={{
            duration: 1.1 + (i % 5) * 0.15,
            repeat: active ? Infinity : 0,
            ease: 'easeInOut',
            delay: i * 0.035,
          }}
        />
      ))}
    </div>
  );
}

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState(30);

  const { login, verifyOtp, googleLogin } = useAuth();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const goToDashboard = useCallback(() => {
    const stored = getStoredUser();
    navigate(stored?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
  }, [navigate]);

  // Load and initialize Google Identity Services
  useEffect(() => {
    /*
    if (showOtp) return;

    const initializeGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: GoogleCredentialResponse) => {
          setError('');
          setLoading(true);
          try {
            await googleLogin(response.credential);
            goToDashboard();
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Google login failed');
          } finally {
            setLoading(false);
          }
        },
      });
    };

    let script = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    ) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    } else {
      initializeGoogle();
    }
    */
  }, [googleLogin, goToDashboard, showOtp]);

  /*
  const handleGoogleClick = () => {
    if (!window.google) {
      setError('Google Sign-In is still loading — try again in a moment.');
      return;
    }
    window.google.accounts.id.prompt();
  };
  */

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res && 'requiresOtp' in res && res.requiresOtp) {
        setShowOtp(true);
        setTimer(30);
        setOtp(Array(6).fill(''));
        return;
      }
      goToDashboard();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = useCallback(
    async (code: string) => {
      if (code.length !== 6 || loading) return;
      setError('');
      setLoading(true);
      try {
        await verifyOtp(email, code, 'login');
        goToDashboard();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Verification failed');
        setOtp(Array(6).fill(''));
        otpRefs.current[0]?.focus();
      } finally {
        setLoading(false);
      }
    },
    [email, verifyOtp, goToDashboard, loading]
  );

  const handleVerifyOtp = (e: FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    submitOtp(code);
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setError('');
    try {
      await authService.resendOtp(email, 'login');
      setTimer(30);
      setOtp(Array(6).fill(''));
      otpRefs.current[0]?.focus();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error?.response?.data?.message || error?.message || 'Failed to resend code');
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const val = value.replace(/[^0-9]/g, '');
    if (!val) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    if (index < 5) {
      otpRefs.current[index + 1]?.focus();
    } else if (newOtp.every((d) => d)) {
      submitOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (newOtp[index]) {
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (text.length === 6) {
      const newOtp = text.split('');
      setOtp(newOtp);
      otpRefs.current[5]?.focus();
      submitOtp(text);
    }
  };

  // Focus first OTP box when entering that view
  useEffect(() => {
    if (showOtp) otpRefs.current[0]?.focus();
  }, [showOtp]);

  // Resend timer
  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    if (showOtp && timer > 0) {
      t = setInterval(() => setTimer((v) => v - 1), 1000);
    }
    return () => clearInterval(t);
  }, [showOtp, timer]);

  const fade = prefersReducedMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white text-slate-900 overflow-hidden">
      {/* Left pane — visual showcase */}
      <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-12 border-r border-white/[0.05] bg-[#030710] text-white">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(37,99,235,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.025) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-[var(--indigo)]/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-[var(--secondary)]/[0.06] blur-[100px] pointer-events-none" />

        <Link to="/" className="z-10 relative inline-block">
          <img src={logoAutonivFull} alt="Autoniv" className="h-30 object-contain -mb-20" />
        </Link>

        <div className="my-auto space-y-8 z-10 relative">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono tracking-wider uppercase border border-emerald-500/25 text-emerald-400 bg-emerald-950/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Platform Online
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              Scale Your Communications with{' '}
              <span className="gradient-text">
                AI Agents
              </span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Deploy voice and chat agents that resolve queries, book appointments, and sync with your CRM 24/7.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-200">Voice Agent Status</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 font-mono">Live Session</span>
            </div>

            <LiveWaveform active={!prefersReducedMotion} />

            <div className="space-y-2.5 pt-1">
              <div className="flex gap-2">
                <span className="text-xs font-bold font-mono text-[var(--secondary)]">AI</span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  "Hi! I've booked your appointment for Tuesday at 2 PM. A confirmation has been sent to your
                  WhatsApp."
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-xs font-bold font-mono text-slate-500">You</span>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  "Perfect, thank you so much for the quick help!"
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="z-10 relative text-xs text-slate-500 flex items-center justify-between">
          <span>© 2026 Autoniv Inc.</span>
          <div className="flex gap-3">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right pane — forms */}
      <div className="col-span-1 lg:col-span-7 flex items-center justify-center px-6 py-12 sm:px-16 bg-white relative">
        <div className="lg:hidden absolute top-6 left-6">
          <Link to="/">
            <img src={logoAutonivFull} alt="Autoniv" className="h-14 object-contain" />
          </Link>
        </div>

        <div className="w-full max-w-[400px] space-y-8">
          <AnimatePresence mode="wait">
            <motion.div key={showOtp ? 'otp-head' : 'login-head'} {...fade} transition={{ duration: 0.2 }}>
              <div className="text-center lg:text-left">
                <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-slate-900">
                  {showOtp ? 'Verify your identity' : 'Welcome back'}
                </h1>
                <p className="text-slate-500 text-sm">
                  {showOtp ? (
                    <>Enter the 6-digit code sent to <span className="text-slate-800">{email}</span></>
                  ) : (
                    'Sign in to your account to continue'
                  )}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={prefersReducedMotion ? {} : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={prefersReducedMotion ? {} : { opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  role="alert"
                  className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-3"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {showOtp ? (
              <motion.form key="otp-form" onSubmit={handleVerifyOtp} className="space-y-6" {...fade} transition={{ duration: 0.2 }}>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 text-center">
                    Verification code
                  </label>
                  <div className="flex justify-between gap-2 my-4">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        autoComplete={index === 0 ? 'one-time-code' : 'off'}
                        maxLength={1}
                        value={digit}
                        aria-label={`Digit ${index + 1} of 6`}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        onPaste={handleOtpPaste}
                        disabled={loading}
                        className="w-12 h-12 text-center text-xl font-bold font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--indigo)] focus:border-transparent transition-all disabled:opacity-50"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={timer > 0}
                    className="text-[var(--indigo)] hover:text-[var(--secondary)] font-bold font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {timer > 0 ? `Resend in ${timer}s` : 'Resend code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowOtp(false); setError(''); }}
                    className="text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Back to sign in
                  </button>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || otp.some((v) => !v)}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                  className="w-full py-3.5 btn-cta text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[var(--indigo)]/10"
                >
                  {loading ? (
                    <>
                      <Spinner /> Verifying…
                    </>
                  ) : (
                    'Verify code'
                  )}
                </motion.button>
              </motion.form>
            ) : (
              <motion.form key="login-form" onSubmit={handleSubmit} className="space-y-5" {...fade} transition={{ duration: 0.2 }}>
                {/* 
                <motion.button
                  type="button"
                  onClick={undefined}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-white border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.15] transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </motion.button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-white/[0.08]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#050b14] px-3 text-slate-500 font-bold font-mono tracking-wider">
                      Or continue with email
                    </span>
                  </div>
                </div>
                */}

                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-bold font-mono text-slate-600 uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    autoComplete="email"
                    autoFocus
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--indigo)] focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-xs font-bold font-mono text-slate-600 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      autoComplete="current-password"
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--indigo)] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Link to="/forgot-password" className="text-sm text-[var(--indigo)] hover:text-[var(--secondary)] font-bold transition-colors">
                    Forgot password?
                  </Link>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                  className="w-full py-3.5 btn-cta text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[var(--indigo)]/10"
                >
                  {loading ? (
                    <>
                      <Spinner /> Signing in…
                    </>
                  ) : (
                    'Sign in'
                  )}
                </motion.button>

                <p className="text-center text-sm text-slate-500">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-[var(--indigo)] hover:text-[var(--secondary)] font-bold transition-colors">
                    Create one
                  </Link>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}