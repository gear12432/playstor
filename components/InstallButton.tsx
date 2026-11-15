'use client';

import React, { useState } from 'react';
import { Check, Download, Loader2 } from 'lucide-react';
import { useFirebase } from '@/components/providers/FirebaseProvider';
import type { StoreApp } from '@/lib/types';

export function InstallButton({
  app,
  variant = 'primary',
  size = 'md',
}: {
  app: StoreApp;
  variant?: 'primary' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
}) {
  const { libraryMap, recordAppDownload } = useFirebase();
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const isInstalled = Boolean(libraryMap[app.id]?.installed);

  const handleInstall = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (downloading) return;

    setDownloading(true);
    setProgress(15);

    const step1 = setTimeout(() => setProgress(52), 180);
    const step2 = setTimeout(() => setProgress(86), 380);

    try {
      await new Promise((r) => setTimeout(r, 520));
      setProgress(100);
      await recordAppDownload(app);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      clearTimeout(step1);
      clearTimeout(step2);
      setTimeout(() => {
        setDownloading(false);
        setProgress(0);
      }, 450);
    }
  };

  const sizeClass =
    size === 'sm'
      ? 'px-3.5 py-1.5 text-xs min-h-[36px]'
      : size === 'lg'
        ? 'px-7 py-3 text-sm min-h-[44px]'
        : 'px-5 py-2 text-sm min-h-[40px]';

  if (downloading) {
    return (
      <button
        type="button"
        disabled
        className={`${sizeClass} rounded-lg font-semibold inline-flex items-center justify-center gap-2 bg-emerald-50 text-[#01875F] border border-emerald-200 whitespace-nowrap shrink-0 font-mono-num`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{progress}%</span>
      </button>
    );
  }

  if (isInstalled) {
    return (
      <button
        type="button"
        onClick={handleInstall}
        className={`${sizeClass} rounded-lg font-semibold inline-flex items-center justify-center gap-1.5 bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0`}
        title="Click to re-download APK package"
      >
        <Check className="w-4 h-4 text-[#01875F]" />
        <span>Download Again</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className={`${sizeClass} rounded-lg font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
        variant === 'primary'
          ? 'bg-[#01875F] text-white hover:bg-[#01704F] shadow-xs'
          : 'bg-emerald-50 text-[#01875F] hover:bg-emerald-100'
      }`}
    >
      <Download className="w-4 h-4" />
      <span>Install APK</span>
    </button>
  );
}
