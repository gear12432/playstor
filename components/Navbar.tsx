'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Play, LogOut, ShieldCheck, Bookmark, ChevronDown } from 'lucide-react';
import { useFirebase } from '@/components/providers/FirebaseProvider';

export function Navbar() {
  const pathname = usePathname();
  const { user, authReady, isAdmin, signInWithGoogle, signOutUser } = useFirebase();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleGoogleLogin = async () => {
    setAuthError('');
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google Sign-In could not complete. Try again.'
      );
    } finally {
      setSigningIn(false);
    }
  };

  const navLinks = [
    { href: '/?tab=Apps', label: 'Apps', active: pathname === '/' },
    { href: '/?tab=Games', label: 'Games', active: false },
    { href: '/?tab=Charts', label: 'Top Charts', active: false },
    { href: '/library', label: 'My Library', active: pathname === '/library' },
    { href: '/admin', label: 'Admin Panel', active: pathname.startsWith('/admin') },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {authError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between gap-3">
          <span>{authError}</span>
          <button
            type="button"
            onClick={() => setAuthError('')}
            className="font-semibold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-md"
        >
          <span className="w-8 h-8 rounded-lg bg-[#01875F] flex items-center justify-center text-white shadow-xs group-hover:bg-[#01704F] transition-colors">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900">
            AppVolt Play
          </span>
        </Link>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                link.active
                  ? 'border-[#01875F] text-[#01875F] font-semibold'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0" ref={menuRef}>
          {!authReady ? (
            <div className="w-32 h-9 rounded-lg bg-slate-100 animate-pulse" />
          ) : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-[#01875F] text-white text-xs font-semibold flex items-center justify-center">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="text-sm font-medium text-slate-800 max-w-[120px] truncate hidden sm:inline">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-lg py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user.displayName || 'Play Account'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <p className="text-[11px] font-medium text-[#01875F] mt-0.5">
                      {isAdmin ? 'Administrator Account' : 'Verified Google User'}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/library"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Bookmark className="w-4 h-4 text-slate-500" />
                      <span>My Library & Downloads</span>
                    </Link>
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-500" />
                      <span>Admin Console</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        setMenuOpen(false);
                        await signOutUser();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={signingIn}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#01875F] rounded-lg hover:bg-[#01704F] transition-colors whitespace-nowrap shrink-0 min-h-[40px] disabled:opacity-60"
            >
              {signingIn ? 'Signing in...' : 'Sign in with Google'}
            </button>
          )}
        </div>
      </div>

      {/* Compact mobile nav row inside header only on <md viewports */}
      <nav className="md:hidden flex items-center gap-4 px-4 pb-2.5 overflow-x-auto no-scrollbar text-xs font-medium text-slate-600 border-t border-slate-100 pt-2">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className={`whitespace-nowrap shrink-0 ${
              link.active ? 'text-[#01875F] font-semibold' : 'text-slate-600'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
