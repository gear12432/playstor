'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const { user, authReady, isAdmin, adminReady, signInWithGoogle, signOutUser, syncAdminRecord } =
    useFirebase();

  const [mode, setMode] = useState<'login' | 'setup'>('login');
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
      if (mode === 'login') {
        const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
        if (!cred.user.emailVerified) {
          setInfoMsg(
            'Signed in, but your Gmail address is not yet verified. Please verify your email below or use Google Sign-In.'
          );
        } else {
          const ok = await syncAdminRecord(cred.user);
          if (!ok) {
            setErrorMsg(
              'Credentials matched, but this account is not authorized in the Admin registry.'
            );
          }
        }
      } else {
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        await sendEmailVerification(cred.user);
        setInfoMsg(
          'Admin account created! A verification email was sent to your Gmail. Verify it and click "Refresh Verification".'
        );
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setNeedsProviderEnable(true);
        setErrorMsg(
          'Email/Password sign-in is not yet enabled in your Firebase Console. Enable it in Authentication -> Sign-in method, or use Instant Google Admin Sign-In below.'
        );
      } else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setErrorMsg('Invalid Admin Gmail or Password. Check your credentials and try again.');
      } else if (code === 'auth/email-already-in-use') {
        setErrorMsg('This Gmail already has an account. Switch to Sign In mode.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Password must be at least 6 characters long.');
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Authentication failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setSubmitting(true);
    try {
      const signedIn = await signInWithGoogle();
      if (signedIn) {
        await syncAdminRecord(signedIn);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Google Admin sign-in failed.');
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#01875F]/15 text-[#01875F] flex items-center justify-center mx-auto animate-pulse">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-600">Verifying Admin Session...</p>
        </div>
      </div>
    );
  }

  if (user && !user.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 p-8 space-y-5 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-display text-xl font-bold text-slate-900">
              Verify Admin Email Address
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Signed in as <span className="font-semibold text-slate-900">{user.email}</span>. For Zero-Trust Firestore security, verify your Gmail address before accessing admin controls.
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
              onClick={handleGoogleAdminLogin}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 min-h-[42px]"
            >
              Or Sign in Instantly with Google
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
    );
  }

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 p-8 space-y-5 shadow-xs">
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
    );
  }

  if (user && isAdmin) {
    return <>{children}</>;
  }

  // Unauthenticated Admin Login Screen (Gmail + Password + Google Admin Sign-In)
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="p-4 sm:p-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to AppVolt Play</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
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

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Admin Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('setup');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'setup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Set Admin Password
            </button>
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
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#01875F]"
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
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#01875F]"
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
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors min-h-[44px] disabled:opacity-60"
            >
              {submitting
                ? 'Authenticating...'
                : mode === 'login'
                  ? 'Sign In to Dashboard'
                  : 'Create Admin Account'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">or instant Google verification</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleAdminLogin}
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-[#01875F] text-white text-sm font-semibold hover:bg-[#01704F] transition-colors flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-60"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Continue with Google (Admin)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
