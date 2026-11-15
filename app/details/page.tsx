'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AppDetailClient } from '@/components/AppDetailClient';

function DetailsInner() {
  const searchParams = useSearchParams();
  const appId = searchParams.get('id') || '';

  if (!appId) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-slate-900">No App Selected</h1>
        <p className="text-sm text-slate-600">
          Choose an application from the AppVolt Play storefront to view full details.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#01875F] text-white text-sm font-semibold hover:bg-[#01704F]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Play Store</span>
        </Link>
      </main>
    );
  }

  return <AppDetailClient appId={appId} />;
}

export default function AppDetailsQueryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex-1">
        <Suspense
          fallback={
            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
              <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
              <div className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
            </main>
          }
        >
          <DetailsInner />
        </Suspense>
      </div>
    </div>
  );
}
