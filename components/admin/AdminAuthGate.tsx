'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useFirebase } from '@/components/providers/FirebaseProvider';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '@/lib/types';

function ColorfulBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-700">
      {/* Full-screen multi-hue ambient color layers */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-24 w-[32rem] h-[32rem] rounded-full bg-amber-300/35 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -right-28 w-[30rem] h-[30rem] rounded-full bg-fuchsia-500/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 left-1/4 w-[34rem] h-[34rem] rounded-full bg-cyan-300/30 blur-3xl"
      />
      <div className="relative z-10 flex-1 flex flex-col">{children}</div>
    </div>
  );
}

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const { user, authReady, isAdmin, adminReady, signOutUser, syncAdminRecord } =
    useFirebase();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [needsProviderEnable, setNeedsProviderEnable] = useState(false);

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setNeedsProviderEnable(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg('Please enter both Admin Gmail and Password.');
      return;
    }

    setSubmitting(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      if (!cred.user.emailVerified) {
        setInfoMsg(
          'Signed in, but your Gmail address is not yet verified. Please verify your email below to open the dashboard.'
        );
      } else {
        const ok = await syncAdminRecord(cred.user);
        if (!ok) {
          setErrorMsg(
            'Credentials matched, but this account is not authorized in the Admin registry.'
          );
        }
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setNeedsProviderEnable(true);
        setErrorMsg(
          'Email/Password sign-in is not yet enabled in your Firebase Console. Enable it in Authentication -> Sign-in method.'
        );
      } else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setErrorMsg('Invalid Admin Gmail or Password. Check your credentials and try again.');
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Authentication failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;
    setErrorMsg('');
    try {
      await sendEmailVerification(user);
      setInfoMsg(`Verification link sent to ${user.email}. Check your inbox.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send verification email.');
    }
  };

  const handleRefreshVerification = async () => {
    if (!user) return;
    setErrorMsg('');
    try {
      await user.reload();
      if (auth.currentUser?.emailVerified) {
        await syncAdminRecord(auth.currentUser);
      } else {
        setInfoMsg('Email still shows as unverified. Click the link in your inbox first.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not refresh status.');
    }
  };

  if (!authReady || !adminReady) {
    return (
      <ColorfulBackdrop>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 px-8 py-7 shadow-2xl space-y-3 text-center">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-[#01875F] flex items-center justify-center mx-auto animate-pulse">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Verifying Admin Session...</p>
          </div>
        </div>
      </ColorfulBackdrop>
    );
  }

  if (user && !user.emailVerified) {
    return (
      <ColorfulBackdrop>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 p-8 space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h1 className="font-display text-xl font-bold text-slate-900">
                Verify Admin Email Address
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Signed in as <span className="font-semibold text-slate-900">{user.email}</span>. Verify your Gmail address before accessing admin controls.
              </p>
            </div>

            {infoMsg && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                {infoMsg}
              </div>
            )}
            {errorMsg && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleRefreshVerification}
                className="w-full py-2.5 px-4 rounded-lg bg-[#01875F] text-white text-sm font-semibold hover:bg-[#01704F] inline-flex items-center justify-center gap-2 min-h-[42px]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>I Verified — Open Dashboard</span>
              </button>
              <button
                type="button"
                onClick={handleResendVerification}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 min-h-[42px]"
              >
                Resend Verification Email
              </button>
              <button
                type="button"
                onClick={() => signOutUser()}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-800"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </ColorfulBackdrop>
    );
  }

  if (user && !isAdmin) {
    return (
      <ColorfulBackdrop>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 p-8 space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h1 className="font-display text-xl font-bold text-slate-900">
                Admin Access Denied
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Your account (<span className="font-semibold text-slate-900">{user.email}</span>) has standard user permissions and is not listed in the authorized Admin registry.
              </p>
              <p className="text-xs text-slate-500 pt-1">
                Primary admin: <span className="font-mono-num">{BOOTSTRAPPED_ADMIN_EMAIL}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => signOutUser()}
                className="flex-1 py-2.5 px-4 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 min-h-[42px]"
              >
                Switch Admin Account
              </button>
              <Link
                href="/"
                className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[42px] inline-flex items-center"
              >
                Storefront
              </Link>
            </div>
          </div>
        </div>
      </ColorfulBackdrop>
    );
  }

  if (user && isAdmin) {
    return <>{children}</>;
  }

  // Unauthenticated Admin Login Screen (Clean Gmail + Password on Colorful Full-Screen Backdrop)
  return (
    <ColorfulBackdrop>
      <div className="p-4 sm:p-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white/95 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to AppVolt Play</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md rounded-2xl bg-white/95 backdrop-blur-md border border-white/50 p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3.5">
            <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-indigo-700 text-white flex items-center justify-center shadow-sm">
              <KeyRound className="w-5 h-5" />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold text-slate-900">
                Admin Console Login
              </h1>
              <p className="text-xs text-slate-500">
                Sign in with verified Admin Gmail &amp; Password
              </p>
            </div>
          </div>

          <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-700">
                Admin Gmail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={BOOTSTRAPPED_ADMIN_EMAIL}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#01875F]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-slate-700"
              >
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#01875F]"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
                {needsProviderEnable && (
                  <a
                    href="https://console.firebase.google.com/project/project-fd2d6f1a-ef39-4122-97f/authentication/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block font-semibold underline text-red-800"
                  >
                    Open Firebase Authentication Providers →
                  </a>
                )}
              </div>
            )}

            {infoMsg && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{infoMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#01875F] to-teal-600 hover:from-[#01704F] hover:to-teal-700 text-white text-sm font-semibold transition-all shadow-sm min-h-[46px] disabled:opacity-60"
            >
              {submitting ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </ColorfulBackdrop>
  );
}
