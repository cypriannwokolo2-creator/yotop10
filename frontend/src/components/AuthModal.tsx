'use client';

import { useEffect, useRef, useState } from 'react';
import { API } from '@/lib/api';
import type { AuthUser } from '@/lib/api/endpoints/auth';
import { useAuthStore } from '@/stores/auth';
import { useAuthModalStore } from '@/stores/authModal';
import { toast } from '@/lib/toast';
import { Icon } from './icons/Icon';

type Step =
  | 'credentials'
  | 'otp'
  | 'forgot-email'
  | 'forgot-otp'
  | 'forgot-new-password';

const STEP_ORDER: Step[] = [
  'credentials',
  'otp',
  'forgot-email',
  'forgot-otp',
  'forgot-new-password',
];

function stepIndex(step: Step): number {
  return STEP_ORDER.indexOf(step);
}

const GUEST_NAME_KEY = 'yotop10_guest_name';

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain a letter and a number.';
  }
  return null;
}

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      placeholder="000000"
      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-2xl tracking-[0.5em] text-center text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
    />
  );
}

export default function AuthModal() {
  const { open, mode, guestAllowed, pendingAction, closeModal } = useAuthModalStore();
  const fetchUser = useAuthStore((s) => s.fetchUser);

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  const directionRef = useRef(1);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset the flow whenever the modal opens.
  useEffect(() => {
    if (open) {
      const start: Step = mode === 'forgot' ? 'forgot-email' : 'credentials';
      directionRef.current = 1;
      setStep(start);
      setError(null);
      setOtp('');
      setAttemptsLeft(null);
      setResendIn(0);
      try {
        setGuestName(localStorage.getItem(GUEST_NAME_KEY) || '');
      } catch { /* private browsing */ }
    }
  }, [open, mode]);

  // 60-second resend countdown.
  useEffect(() => {
    if (resendTimerRef.current) {
      clearInterval(resendTimerRef.current);
      resendTimerRef.current = null;
    }
    if (resendIn <= 0) return;
    resendTimerRef.current = setInterval(() => {
      setResendIn((n) => {
        if (n <= 1 && resendTimerRef.current) {
          clearInterval(resendTimerRef.current);
          resendTimerRef.current = null;
        }
        return n - 1;
      });
    }, 1000);
    return () => {
      if (resendTimerRef.current) {
        clearInterval(resendTimerRef.current);
        resendTimerRef.current = null;
      }
    };
  }, [resendIn]);

  const go = (next: Step) => {
    directionRef.current =
      stepIndex(next) >= stepIndex(step) ? 1 : -1;
    setStep(next);
    setError(null);
  };

  const finish = async (user: AuthUser | null, message: string) => {
    if (user) {
      useAuthStore.getState().setUser(user);
    } else {
      await fetchUser().catch(() => {});
    }
    toast.success(message);
    closeModal();
    // Run the action the user originally attempted (after state settles).
    const action = useAuthModalStore.getState().pendingAction;
    if (action) {
      setTimeout(() => action(), 0);
    }
  };

  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (busy) return;

    if (mode === 'register') {
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters.');
        return;
      }
      const pwError = validatePassword(password);
      if (pwError) {
        setError(pwError);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    } else if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'register') {
        await API.register(email.trim(), password, username.trim());
        setResendIn(60);
        go('otp');
      } else {
        const res = await API.login(email.trim(), password);
        if (res.requires_otp) {
          setResendIn(60);
          go('otp');
        } else if (res.user) {
          await finish(res.user, `Welcome back, ${res.user.custom_display_name || res.user.username}!`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (busy || otp.length !== 6) return;

    setBusy(true);
    try {
      if (mode === 'register') {
        const res = await API.registerVerify(email.trim(), otp, password, username.trim());
        await finish(res.user, `Account created — welcome, ${res.user.custom_display_name || res.user.username}!`);
      } else {
        const res = await API.loginVerify(email.trim(), otp);
        await finish(res.user, `Welcome back, ${res.user.custom_display_name || res.user.username}!`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed. Try again.';
      setError(message);
      // OTP attempt feedback: surface remaining attempts when the
      // backend reports them, otherwise clear the field for retry.
      const match = /(\d+)\s*(?:attempt|try)/i.exec(message);
      if (match) setAttemptsLeft(Number(match[1]));
      setOtp('');
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    if (resendIn > 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === 'register') {
        await API.register(email.trim(), password, username.trim());
      } else {
        await API.login(email.trim(), password);
      }
      setResendIn(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the code.');
    } finally {
      setBusy(false);
    }
  };

  const submitForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (busy) return;
    setBusy(true);
    try {
      // Always resolves identically — no account enumeration.
      await API.forgotPassword(email.trim());
      setResendIn(60);
      go('forgot-otp');
      toast.info('If an account exists for that email, a reset code was sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const resendResetCode = async () => {
    if (resendIn > 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      await API.forgotPassword(email.trim());
      setResendIn(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the code.');
    } finally {
      setBusy(false);
    }
  };

  const submitForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (busy || otp.length !== 6) return;
    go('forgot-new-password');
  };

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (busy || otp.length !== 6) return;
    const pwError = validatePassword(password);
    if (pwError) {
      setError(pwError);
      return;
    }
    setBusy(true);
    try {
      await API.resetPassword(email.trim(), otp, password);
      toast.success('Password reset. You can now log in with your new password.');
      closeModal();
      // Land on the login step if the user reopens the modal.
      useAuthModalStore.getState().openModal('login');
      useAuthModalStore.getState().closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const continueAsGuest = () => {
    const name = guestName.trim();
    if (name && (name.length < 3 || name.length > 32)) {
      setError('Guest name must be 3–32 characters (or leave blank).');
      return;
    }
    if (name) {
      try { localStorage.setItem(GUEST_NAME_KEY, name); } catch { /* ignore */ }
    }
    closeModal();
    const action = useAuthModalStore.getState().pendingAction;
    if (action) setTimeout(() => action(), 0);
  };

  if (!open) return null;

  const isOtpStep = step === 'otp' || step === 'forgot-otp';
  const isForgotFlow = step === 'forgot-email' || step === 'forgot-otp' || step === 'forgot-new-password';
  const backTarget: Step =
    step === 'otp' ? 'credentials' : step === 'forgot-new-password' ? 'forgot-otp' : 'forgot-email';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={closeModal}
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-100">
            {mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Reset password' : 'Sign in'}
          </h2>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close"
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Sliding step container */}
        <div className="relative overflow-hidden">            <form
            key={step}
            onSubmit={
              step === 'credentials' ? submitCredentials
                : step === 'otp' ? submitOtp
                  : step === 'forgot-email' ? submitForgotEmail
                    : step === 'forgot-new-password' ? submitNewPassword
                      : submitForgotOtp
            }
            className="auth-slide-in space-y-4 px-6 py-6"
          >
            {step === 'credentials' && (
              <>
                {mode === 'register' && (
                  <div>
                    <label htmlFor="auth-username" className="mb-1.5 block text-xs font-medium text-zinc-400">
                      Username
                    </label>
                    <input
                      id="auth-username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="your_username"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="auth-email" className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="auth-password" className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                {mode === 'register' && (
                  <div>
                    <label htmlFor="auth-confirm" className="mb-1.5 block text-xs font-medium text-zinc-400">
                      Confirm password
                    </label>
                    <input
                      id="auth-confirm"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                )}

                {error && <p className="text-xs text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
                >
                  {busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}
                </button>

                <div className="flex items-center justify-between text-xs">
                  {mode === 'login' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => useAuthModalStore.getState().openModal('register', pendingAction ?? undefined, { guest: guestAllowed })}
                        className="text-orange-400 hover:text-orange-300"
                      >
                        Create account
                      </button>
                      <button
                        type="button"
                        onClick={() => useAuthModalStore.getState().openModal('forgot', pendingAction ?? undefined, { guest: guestAllowed })}
                        className="text-zinc-400 hover:text-zinc-300"
                      >
                        Forgot password?
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => useAuthModalStore.getState().openModal('login', pendingAction ?? undefined, { guest: guestAllowed })}
                      className="text-zinc-400 hover:text-zinc-300"
                    >
                      Already have an account? Sign in
                    </button>
                  )}
                </div>
              </>
            )}

            {step === 'otp' && (
              <>
                <p className="text-sm text-zinc-400">
                  Enter the 6-digit code sent to <span className="text-zinc-200">{email}</span>
                </p>
                <OtpInput value={otp} onChange={setOtp} />
                {attemptsLeft !== null && (
                  <p className="text-xs text-amber-400">{attemptsLeft} attempts remaining.</p>
                )}
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={busy || otp.length !== 6}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
                >
                  {busy ? 'Verifying…' : 'Verify'}
                </button>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => go(backTarget)}
                    className="text-zinc-400 hover:text-zinc-300"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={resendIn > 0}
                    className="text-orange-400 hover:text-orange-300 disabled:text-zinc-600"
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                  </button>
                </div>
              </>
            )}

            {step === 'forgot-email' && (
              <>
                <p className="text-sm text-zinc-400">
                  Enter the email on your account and we will send a reset code.
                </p>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
                >
                  {busy ? 'Sending…' : 'Send reset code'}
                </button>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => useAuthModalStore.getState().openModal('login', pendingAction ?? undefined, { guest: guestAllowed })}
                    className="text-zinc-400 hover:text-zinc-300"
                  >
                    Back to sign in
                  </button>
                </div>
              </>
            )}

            {step === 'forgot-otp' && (
              <>
                <p className="text-sm text-zinc-400">
                  Enter the 6-digit reset code sent to <span className="text-zinc-200">{email}</span>
                </p>
                <OtpInput value={otp} onChange={setOtp} />
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={busy || otp.length !== 6}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
                >
                  Continue
                </button>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => go(backTarget)}
                    className="text-zinc-400 hover:text-zinc-300"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={resendResetCode}
                    disabled={resendIn > 0}
                    className="text-orange-400 hover:text-orange-300 disabled:text-zinc-600"
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                  </button>
                </div>
              </>
            )}

            {step === 'forgot-new-password' && (
              <>
                <p className="text-sm text-zinc-400">Choose a new password.</p>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (8+ chars, letter + number)"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={busy || otp.length !== 6}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
                >
                  {busy ? 'Resetting…' : 'Reset password'}
                </button>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => go(backTarget)}
                    className="text-zinc-400 hover:text-zinc-300"
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Guest footer */}
        {guestAllowed && !isOtpStep && !isForgotFlow && (
          <div className="border-t border-zinc-800 px-6 py-4">
            <p className="mb-2 text-xs text-zinc-500">
              No account? Continue as a guest — comments may be collapsed and rate-limited.
            </p>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              maxLength={32}
              placeholder="Guest name (optional, 3–32 chars)"
              className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={continueAsGuest}
              className="w-full rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
            >
              Continue as guest
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
