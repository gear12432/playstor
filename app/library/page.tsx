'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bookmark, Download, CheckCircle2, ArrowRight, History } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { useFirebase } from '@/components/providers/FirebaseProvider';
import { Navbar } from '@/components/Navbar';
import { AppIcon } from '@/components/AppArtwork';
import { InstallButton } from '@/components/InstallButton';
import type { DownloadRecord } from '@/lib/types';

export default function LibraryPage() {
  const { user, authReady, apps, libraryMap, signInWithGoogle, toggleWishlist } = useFirebase();
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'downloads'), where('userId', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as DownloadRecord);
        list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setDownloads(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'downloads');
      }
    );

    return () => unsub();
  }, [user]);

  const visibleDownloads = user ? downloads : [];

  const installedApps = useMemo(() => {
    return apps.filter((a) => libraryMap[a.id]?.installed);
  }, [apps, libraryMap]);

  const wishlistedApps = useMemo(() => {
    return apps.filter((a) => libraryMap[a.id]?.wishlisted);
  }, [apps, libraryMap]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 space-y-10 flex-1">
        <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              My Library &amp; Downloads
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Installed APKs, saved wishlist apps, and real-time download history synced to your Google account.
            </p>
          </div>
          {user && (
            <span className="text-xs font-mono-num text-slate-500">
              Signed in as {user.email}
            </span>
          )}
        </div>

        {!authReady ? (
          <div className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
        ) : !user ? (
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center max-w-xl mx-auto space-y-4">
            <h2 className="font-display text-xl font-bold text-slate-900">
              Sign in with Google to Sync Your Library
            </h2>
            <p className="text-sm text-slate-600">
              Track installed APKs, save apps to your wishlist, and view download history across devices.
            </p>
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="px-6 py-2.5 rounded-lg bg-[#01875F] text-white text-sm font-semibold hover:bg-[#01704F] transition-colors min-h-[42px]"
            >
              Continue with Google
            </button>
          </section>
        ) : (
          <div className="space-y-10">
            {/* Installed Apps */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#01875F]" />
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Installed &amp; Downloaded ({installedApps.length})
                </h2>
              </div>

              {installedApps.length === 0 ? (
                <div className="rounded-xl border border-slate-200 p-6 text-sm text-slate-500 flex items-center justify-between gap-4">
                  <span>You haven&apos;t installed any apps yet.</span>
                  <Link
                    href="/"
                    className="text-[#01875F] font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    Browse Storefront <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {installedApps.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white"
                    >
                      <Link href={`/apps/${app.id}`} className="flex items-center gap-3.5 min-w-0">
                        <AppIcon app={app} size="md" />
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">
                            {app.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-mono-num">
                            Installed v{libraryMap[app.id]?.installedVersion || app.version} ·{' '}
                            {app.sizeMb.toFixed(1)} MB
                          </p>
                        </div>
                      </Link>
                      <InstallButton app={app} variant="subtle" size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Wishlist */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#01875F]" />
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Wishlist ({wishlistedApps.length})
                </h2>
              </div>

              {wishlistedApps.length === 0 ? (
                <div className="rounded-xl border border-slate-200 p-6 text-sm text-slate-500">
                  Apps you bookmark will appear here for quick installation later.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wishlistedApps.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white"
                    >
                      <Link href={`/apps/${app.id}`} className="flex items-center gap-3.5 min-w-0">
                        <AppIcon app={app} size="md" />
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">
                            {app.name}
                          </h3>
                          <p className="text-xs text-slate-500 truncate">{app.developer}</p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleWishlist(app)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 rounded-lg border border-slate-200"
                        >
                          Remove
                        </button>
                        <InstallButton app={app} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Download History Table */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-700" />
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Download History
                </h2>
              </div>

              {visibleDownloads.length === 0 ? (
                <div className="rounded-xl border border-slate-200 p-6 text-sm text-slate-500">
                  No APK download history recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Application</th>
                        <th className="px-4 py-3">Version</th>
                        <th className="px-4 py-3 text-right">Size</th>
                        <th className="px-4 py-3 text-right">Downloaded On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleDownloads.map((dl) => (
                        <tr key={dl.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            <Link
                              href={`/apps/${dl.appId}`}
                              className="inline-flex items-center gap-2 hover:text-[#01875F]"
                            >
                              <Download className="w-3.5 h-3.5 text-[#01875F]" />
                              {dl.appName}
                            </Link>
                          </td>
                          <td className="px-4 py-3 font-mono-num text-slate-600">v{dl.version}</td>
                          <td className="px-4 py-3 font-mono-num text-right text-slate-600">
                            {dl.sizeMb.toFixed(1)} MB
                          </td>
                          <td className="px-4 py-3 font-mono-num text-right text-slate-500">
                            {dl.createdAt?.toDate
                              ? dl.createdAt.toDate().toLocaleString()
                              : 'Just now'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
