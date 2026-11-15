'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useFirebase } from '@/components/providers/FirebaseProvider';
import { Navbar } from '@/components/Navbar';

export default function UserLoginPage() {
  const router = useRouter();
  const { user, signInWithGoogle, signOutUser } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const signedIn = await signInWithGoogle();
      if (signedIn) {
        router.push('/');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Google sign-in popup was cancelled or blocked by your browser.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#01875F] flex items-center justify-center text-white">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold text-slate-900">
                AppVolt Play Account
              </h1>
              <p className="text-xs text-slate-500">Sign up or sign in with Google</p>
            </div>
          </div>

          {user ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-[#E6F4EA] border border-[#01875F]/20 p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#01875F] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    Signed in as {user.displayName || 'Play User'}
                  </p>
                  <p className="text-xs text-slate-600 truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#01875F] text-white text-sm font-semibold text-center hover:bg-[#01704F] inline-flex items-center justify-center gap-2 min-h-[42px]"
                >
                  <span>Browse Apps</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => signOutUser()}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[42px]"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-slate-600 leading-relaxed">
                Use your Google account to create your Play Store profile, download verified APKs, sync your library, and post app reviews in real time.
              </p>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#01875F] text-white text-sm font-semibold hover:bg-[#01704F] transition-colors flex items-center justify-center gap-2.5 min-h-[46px] disabled:opacity-60"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Connecting Google Account...' : 'Sign up / Sign in with Google'}</span>
              </button>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Store administrator?</span>
                <Link href="/admin" className="font-semibold text-[#01875F] hover:underline">
                  Admin Gmail &amp; Password Login →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
