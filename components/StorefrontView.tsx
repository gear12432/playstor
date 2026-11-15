'use client';

import React, { useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Star, ShieldCheck, ArrowRight, Download, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { useFirebase } from '@/components/providers/FirebaseProvider';
import { AppIcon, ICON_PRESETS } from '@/components/AppArtwork';
import { InstallButton } from '@/components/InstallButton';
import { formatDownloadCount } from '@/lib/apk-downloader';
import type { StoreApp } from '@/lib/types';

function StorefrontInner() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab');

  const { apps, appsLoading, categories, user, signInWithGoogle } = useFirebase();

  const [activeTab, setActiveTab] = useState<'All' | 'Apps' | 'Games' | 'Charts'>(
    initialTab === 'Apps' || initialTab === 'Games' || initialTab === 'Charts' ? initialTab : 'All'
  );
  const [selectedSubcat, setSelectedSubcat] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const subcategories = useMemo(() => {
    const fromStore = categories
      .filter((c) => activeTab === 'All' || activeTab === 'Charts' || c.group === activeTab)
      .map((c) => c.name);
    const fromApps = apps
      .filter((a) => activeTab === 'All' || activeTab === 'Charts' || a.category === activeTab)
      .map((a) => a.subcategory);
    return ['All', ...Array.from(new Set([...fromStore, ...fromApps]))];
  }, [categories, apps, activeTab]);

  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return apps.filter((app) => {
      if (activeTab === 'Apps' && app.category !== 'Apps') return false;
      if (activeTab === 'Games' && app.category !== 'Games') return false;
      if (selectedSubcat !== 'All' && app.subcategory !== selectedSubcat) return false;
      if (!q) return true;
      return (
        app.name.toLowerCase().includes(q) ||
        app.developer.toLowerCase().includes(q) ||
        app.packageName.toLowerCase().includes(q) ||
        app.subcategory.toLowerCase().includes(q) ||
        app.tagline.toLowerCase().includes(q)
      );
    });
  }, [apps, activeTab, selectedSubcat, searchQuery]);

  const featuredApp: StoreApp | undefined = useMemo(() => {
    if (filteredApps.length === 0) return undefined;
    return filteredApps.find((a) => a.featured) || filteredApps[0];
  }, [filteredApps]);

  const topCharts = useMemo(() => {
    return [...filteredApps].sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0)).slice(0, 6);
  }, [filteredApps]);

  const featuredPreset = featuredApp
    ? ICON_PRESETS[featuredApp.iconPreset] || ICON_PRESETS['emerald-note']
    : ICON_PRESETS['emerald-note'];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      {/* Search + Segmented Store Filter Bar */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit overflow-x-auto no-scrollbar">
          {(['All', 'Apps', 'Games', 'Charts'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setSelectedSubcat('All');
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'Charts' ? 'Top Charts' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search apps, games, package IDs..."
            aria-label="Search apps and games"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#01875F] transition-colors min-h-[42px]"
          />
        </div>
      </section>

      {/* Subcategory Interactive Filter Row */}
      {subcategories.length > 1 && (
        <section className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mt-6">
          {subcategories.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubcat(sub)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                selectedSubcat === sub
                  ? 'bg-[#E6F4EA] border-[#01875F]/30 text-[#01875F]'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {sub}
            </button>
          ))}
        </section>
      )}

      {/* Loading Skeleton */}
      {appsLoading && (
        <section className="space-y-8">
          <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-36 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        </section>
      )}

      {/* Empty Storefront State */}
      {!appsLoading && apps.length === 0 && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-10 sm:p-14 text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#E6F4EA] text-[#01875F] flex items-center justify-center mx-auto mb-5">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
            Your Play Store Catalog Is Ready
          </h1>
          <p className="text-slate-600 mt-3 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            No applications are published in Cloud Firestore yet. Sign in to the Admin Console to publish apps or populate the starter catalog in one click.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/admin"
              className="px-5 py-2.5 rounded-lg bg-[#01875F] text-white text-sm font-semibold hover:bg-[#01704F] transition-colors inline-flex items-center gap-2 min-h-[42px]"
            >
              <span>Open Admin Panel</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {!user && (
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="px-5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-sm font-semibold hover:bg-slate-100 transition-colors min-h-[42px]"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </section>
      )}

      {/* Active Storefront Content */}
      {!appsLoading && apps.length > 0 && (
        <>
          {/* 1. Featured Editorial Spotlight */}
          {featuredApp && activeTab !== 'Charts' && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="relative overflow-hidden rounded-2xl bg-slate-950 text-white border border-slate-800"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${featuredPreset.bg} opacity-35 pointer-events-none`}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent pointer-events-none" />

              <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="max-w-2xl space-y-5">
                  <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Editor&apos;s Choice</span>
                    <span aria-hidden="true">·</span>
                    <span>{featuredApp.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{featuredApp.subcategory}</span>
                  </div>

                  <div className="flex items-start gap-4 sm:gap-5">
                    <AppIcon app={featuredApp} size="lg" />
                    <div className="space-y-1.5 min-w-0">
                      <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white text-balance">
                        {featuredApp.name}
                      </h1>
                      <p className="text-sm text-slate-300">{featuredApp.developer}</p>
                    </div>
                  </div>

                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-xl">
                    {featuredApp.tagline}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300 font-mono-num">
                    <span className="inline-flex items-center gap-1 text-white font-semibold">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {featuredApp.ratingAvg.toFixed(1)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDownloadCount(featuredApp.downloadCount)} downloads</span>
                    <span aria-hidden="true">·</span>
                    <span>{featuredApp.sizeMb.toFixed(1)} MB</span>
                    <span aria-hidden="true">·</span>
                    <span>v{featuredApp.version}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <InstallButton app={featuredApp} size="lg" />
                    <Link
                      href={`/apps/${featuredApp.id}`}
                      className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors inline-flex items-center gap-2 min-h-[44px]"
                    >
                      <span>App Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="hidden lg:grid grid-cols-2 gap-3 w-80 shrink-0">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-1">
                    <p className="text-xs text-slate-400">Package ID</p>
                    <p className="text-xs font-mono-num text-white truncate">{featuredApp.packageName}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-1">
                    <p className="text-xs text-slate-400">Compatibility</p>
                    <p className="text-xs font-medium text-white">{featuredApp.minAndroid}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-1 col-span-2">
                    <p className="text-xs text-slate-400">Verified Security</p>
                    <p className="text-xs font-medium text-emerald-300">
                      Play Protect Signature Verified · Direct APK
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* 2. Top Charts Leaderboard */}
          {topCharts.length > 0 && (
            <section className="space-y-5">
              <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                    Top Charts
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Most downloaded verified packages in real time
                  </p>
                </div>
                <span className="text-xs font-mono-num text-slate-500">
                  {topCharts.length} ranked
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topCharts.map((app, index) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <Link
                      href={`/apps/${app.id}`}
                      className="flex items-center gap-3.5 min-w-0 flex-1"
                    >
                      <span className="w-6 text-center text-sm font-bold font-mono-num text-slate-400 shrink-0">
                        {index + 1}
                      </span>
                      <AppIcon app={app} size="md" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                          {app.name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {app.subcategory}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 font-mono-num">
                          <span className="inline-flex items-center gap-0.5">
                            {app.ratingAvg.toFixed(1)}
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{app.sizeMb.toFixed(0)} MB</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatDownloadCount(app.downloadCount)}</span>
                        </div>
                      </div>
                    </Link>

                    <InstallButton app={app} variant="subtle" size="sm" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. Full Store Catalog Grid */}
          <section className="space-y-5">
            <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                  {activeTab === 'All'
                    ? 'Recommended for you'
                    : activeTab === 'Charts'
                      ? 'All Ranked Releases'
                      : `${activeTab} Catalog`}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Click any app for full specifications, screenshots, and user reviews
                </p>
              </div>
              <span className="text-xs font-mono-num text-slate-500">
                {filteredApps.length} {filteredApps.length === 1 ? 'app' : 'apps'}
              </span>
            </div>

            {filteredApps.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
                <p className="text-sm font-medium text-slate-700">
                  No matching apps found for &ldquo;{searchQuery}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSubcat('All');
                    setActiveTab('All');
                  }}
                  className="mt-3 text-sm font-semibold text-[#01875F] hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredApps.map((app) => (
                  <div
                    key={app.id}
                    className="group rounded-xl border border-slate-200 bg-white p-5 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between gap-4"
                  >
                    <Link href={`/apps/${app.id}`} className="flex items-start gap-4">
                      <AppIcon app={app} size="md" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-base font-semibold text-slate-900 truncate group-hover:text-[#01875F] transition-colors">
                          {app.name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{app.developer}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-600 mt-1.5 font-mono-num">
                          <span className="inline-flex items-center gap-0.5 font-medium text-slate-800">
                            {app.ratingAvg.toFixed(1)}
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{app.subcategory}</span>
                          <span aria-hidden="true">·</span>
                          <span>{app.sizeMb.toFixed(1)} MB</span>
                        </div>
                      </div>
                    </Link>

                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {app.tagline}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-mono-num">
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        {formatDownloadCount(app.downloadCount)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/apps/${app.id}`}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          Details
                        </Link>
                        <InstallButton app={app} variant="subtle" size="sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export function StorefrontView() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      }
    >
      <StorefrontInner />
    </Suspense>
  );
}
