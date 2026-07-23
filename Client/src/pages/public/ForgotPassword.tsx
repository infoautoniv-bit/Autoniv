import { type FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';
import axios from 'axios';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState(30);

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setStep('password');
      setTimer(30);
      setOtp(Array(6).fill(''));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to send reset code');
      } else {
        setError('Failed to send reset code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 10) {
      setError('Password must be at least 10 characters');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email, password, code);
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to reset password');
      } else {
        setError('Failed to reset password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setError('');
    try {
      await authService.resendOtp(email, 'reset_password');
      setTimer(30);
      setOtp(Array(6).fill(''));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to resend code');
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
  const activeTimer = step === 'password';
  useState(() => {
    let t: ReturnType<typeof setInterval>;
    if (activeTimer && timer > 0) {
      t = setInterval(() => setTimer((v) => v - 1), 1000);
    }
    return () => clearInterval(t);
  });

  const validatePassword = (pwd: string) => {
    const checks = [
      { label: 'At least 10 characters', met: pwd.length >= 10 },
      { label: 'Uppercase letter', met: /[A-Z]/.test(pwd) },
      { label: 'Lowercase letter', met: /[a-z]/.test(pwd) },
      { label: 'Number', met: /\d/.test(pwd) },
      { label: 'Special character', met: /[!@#$%^&*()_+\-=()[\]{};':"\\|,.<>/?]/.test(pwd) },
    ];
    return checks;
  };

  const passwordChecks = validatePassword(password);
  const passwordValid = passwordChecks.every(c => c.met);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] px-4 py-12 sm:py-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-[#6366f1]/20 rounded-full blur-3xl"/>
        <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-[#0077ff]/15 rounded-full blur-3xl"/>
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
            {step === 'email' && 'Forgot Password'}
            {step === 'password' && 'Reset Password'}
          </h1>
          <p className="text-[var(--slate-light)] text-sm max-w-sm mx-auto">
            {step === 'email' && "Enter your registered email address to receive a verification code"}
            {step === 'password' && `If an account exists for ${email}, a 6-digit code was sent. Enter the code and your new password below.`}
          </p>
        </div>

        <div className="relative bg-[var(--s1)]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-8 space-y-5 sm:space-y-6">
          {error && (
            <div className="p-4 bg-[#ef4444]/10 border border-[var(--red)]/30 rounded-xl text-[var(--red)] text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-[var(--primary)]/10 border border-[var(--border)] rounded-xl text-[var(--primary)] text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
              {success}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="btn-cta w-full py-3.5 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Sending...
                  </>
                ) : 'Send Verification Code'}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--slate-light)]">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
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
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {passwordChecks.map((check, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className={check.met ? 'text-[var(--primary)]' : 'text-[var(--slate-gray)]'}>
                          {check.met ? '✓' : '○'}
                        </span>
                        <span className={check.met ? 'text-[var(--primary)]' : 'text-[var(--slate-gray)]'}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--slate-light)]">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="w-full px-4 py-3.5 pr-11 bg-[var(--surface-light)]/50 border border-white/10 rounded-xl text-white placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#0077ff] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
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
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-[var(--red)]">Passwords do not match</p>
                )}
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
                  onClick={() => { setStep('email'); setError(''); }}
                  className="text-[var(--slate-gray)] hover:text-white transition-colors"
                >
                  Back to email submit
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !passwordValid || password !== confirmPassword || otp.some(v => !v)}
                className="btn-cta w-full py-3.5 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Resetting...
                  </>
                ) : 'Reset Password'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-[var(--slate-gray)]">
            Remember your password?{' '}
            <Link to="/login" className="text-[var(--indigo)] hover:text-[#00c8b4] font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
