import { type FormEvent, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../App';
import { authService } from '../../services/api';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
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

  // Load and initialize Google Identity Services script
  useEffect(() => {
    if (showOtp) return;

    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '235489562479-placeholder.apps.googleusercontent.com',
          callback: async (response: GoogleCredentialResponse) => {
            setError('');
            setLoading(true);
            try {
              await googleLogin(response.credential);
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
  }, [googleLogin, navigate, showOtp]);

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
      const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
      navigate(stored?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email, code, 'login');
      const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
      navigate(stored?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setError('');
    try {
      await authService.resendOtp(email, 'login');
      setTimer(30);
      setOtp(Array(6).fill(''));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error?.response?.data?.message || error?.message || 'Failed to resend code');
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

  // Timer effect
  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    if (showOtp && timer > 0) {
      t = setInterval(() => setTimer((v) => v - 1), 1000);
    }
    return () => clearInterval(t);
  }, [showOtp, timer]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] px-4 py-12 sm:py-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-[#6366f1]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-[#0077ff]/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-4 sm:mx-0">
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--indigo)] to-[var(--secondary)] flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="text-2xl font-bold gradient-text">Autoniv</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            {showOtp ? 'Verify your identity' : 'Welcome back'}
          </h1>
          <p className="text-[var(--slate-light)]">
            {showOtp ? `Enter the 6-digit code sent to ${email}` : 'Sign in to your account to continue'}
          </p>
        </div>

        {showOtp ? (
          <form onSubmit={handleVerifyOtp} className="relative bg-[var(--s1)]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-8 space-y-5 sm:space-y-6">
            {error && (
              <div className="p-4 bg-[#ef4444]/10 border border-[var(--red)]/30 rounded-xl text-[var(--red)] text-sm flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--slate-light)] text-center">Verification Code</label>
              <div className="flex justify-between gap-2 my-4">
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={data}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    onPaste={handleOtpPaste}
                    className="w-12 h-12 text-center text-xl font-bold bg-[var(--surface-light)]/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#0077ff] focus:border-transparent transition-all"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={timer > 0}
                className="text-[var(--indigo)] hover:text-[#00c8b4] font-medium transition-colors disabled:opacity-50"
              >
                {timer > 0 ? `Resend Code in ${timer}s` : 'Resend Code'}
              </button>
              <button
                type="button"
                onClick={() => { setShowOtp(false); setError(''); }}
                className="text-[var(--slate-gray)] hover:text-white transition-colors"
              >
                Back to sign in
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || otp.some(v => !v)}
              className="btn-cta w-full py-3.5 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Verifying...
                </>
              ) : 'Verify Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="relative bg-[var(--s1)]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-8 space-y-5 sm:space-y-6">
            {error && (
              <div className="p-4 bg-[#ef4444]/10 border border-[var(--red)]/30 rounded-xl text-[var(--red)] text-sm flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleClick}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-medium text-white transition-all duration-200"
              style={{
                background: '#000000',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1a1a1a';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#000000';
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

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs text-[var(--slate-gray)] uppercase">
                <span className="bg-[#0b101c] px-2 text-[var(--slate-gray)]">Or continue with email</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--slate-light)]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-4 py-3.5 bg-[var(--surface-light)]/50 border border-white/10 rounded-xl text-white placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#0077ff] focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--slate-light)]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3.5 pr-11 bg-[var(--surface-light)]/50 border border-white/10 rounded-xl text-white placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#0077ff] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div />
              <Link to="/forgot-password" className="text-sm text-[var(--indigo)] hover:text-[#00c8b4] font-medium transition-colors">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-cta w-full py-3.5 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>

            <p className="text-center text-sm text-[var(--slate-gray)]">
              Don't have an account?{' '}
              <Link to="/" className="text-[var(--indigo)] hover:text-[#00c8b4] font-medium transition-colors">
                Create one
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}