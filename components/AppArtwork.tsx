'use client';

import React, { useState } from 'react';
import {
  Camera,
  Cloud,
  Compass,
  Cpu,
  FileText,
  Gamepad2,
  Grid,
  Headphones,
  Layers,
  Shield,
  Sparkles,
  Target,
  Wallet,
  Wifi,
  Zap,
} from 'lucide-react';
import type { StoreApp } from '@/lib/types';

export const ICON_PRESETS: Record<
  string,
  { bg: string; fg: string; label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  'emerald-note': { bg: 'from-emerald-600 to-teal-700', fg: 'text-white', label: 'Emerald Notes', Icon: FileText },
  'cobalt-wallet': { bg: 'from-blue-600 to-indigo-700', fg: 'text-white', label: 'Cobalt Wallet', Icon: Wallet },
  'amber-camera': { bg: 'from-amber-500 to-orange-600', fg: 'text-white', label: 'Amber Optics', Icon: Camera },
  'rose-music': { bg: 'from-rose-600 to-pink-700', fg: 'text-white', label: 'Rose Acoustics', Icon: Headphones },
  'slate-shield': { bg: 'from-slate-700 to-slate-900', fg: 'text-emerald-300', label: 'Slate Guard', Icon: Wifi },
  'crimson-racing': { bg: 'from-red-600 to-rose-800', fg: 'text-white', label: 'Crimson Drift', Icon: Zap },
  'indigo-tactical': { bg: 'from-indigo-700 to-slate-900', fg: 'text-sky-200', label: 'Tactical Ops', Icon: Target },
  'teal-puzzle': { bg: 'from-teal-500 to-emerald-700', fg: 'text-white', label: 'Chroma Grid', Icon: Grid },
  'violet-cloud': { bg: 'from-violet-600 to-purple-800', fg: 'text-white', label: 'Cloud Sync', Icon: Cloud },
  'cyan-compass': { bg: 'from-cyan-600 to-sky-700', fg: 'text-white', label: 'Compass Nav', Icon: Compass },
  'lime-cpu': { bg: 'from-lime-600 to-emerald-700', fg: 'text-white', label: 'System Core', Icon: Cpu },
  'gold-arcade': { bg: 'from-yellow-500 to-amber-700', fg: 'text-white', label: 'Arcade Play', Icon: Gamepad2 },
};

export function AppIcon({
  app,
  size = 'md',
}: {
  app: Pick<StoreApp, 'name' | 'iconUrl' | 'iconPreset'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const preset = ICON_PRESETS[app.iconPreset] || ICON_PRESETS['emerald-note'];
  const IconComp = preset.Icon;

  const sizeClasses: Record<string, string> = {
    sm: 'w-11 h-11 rounded-xl',
    md: 'w-14 h-14 rounded-2xl',
    lg: 'w-20 h-20 rounded-[22px]',
    xl: 'w-24 h-24 rounded-[26px]',
  };

  const iconSize: Record<string, string> = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  if (app.iconUrl && !imgFailed && (app.iconUrl.startsWith('http') || app.iconUrl.startsWith('/'))) {
    return (
      <div
        className={`${sizeClasses[size]} overflow-hidden border border-black/10 bg-slate-100 shrink-0 shadow-xs`}
      >
        <img
          src={app.iconUrl}
          alt={`${app.name} icon`}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-br ${preset.bg} ${preset.fg} flex items-center justify-center shrink-0 shadow-sm border border-black/10 relative overflow-hidden`}
      aria-label={`${app.name} icon`}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/20 pointer-events-none" />
      <IconComp className={`${iconSize[size]} relative z-10`} />
    </div>
  );
}

export function AppScreenshotPreview({
  src,
  app,
  index,
  onClick,
}: {
  src: string;
  app: StoreApp;
  index: number;
  onClick?: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const preset = ICON_PRESETS[app.iconPreset] || ICON_PRESETS['emerald-note'];
  const IconComp = preset.Icon;

  const isUrl = (src.startsWith('http') || src.startsWith('/')) && !imgFailed;

  if (isUrl) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="relative shrink-0 w-72 sm:w-80 h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 hover:border-emerald-600 transition-colors text-left"
      >
        <img
          src={src}
          alt={`${app.name} screenshot ${index + 1}`}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      </button>
    );
  }

  const screenTitles = [
    `${app.name} Overview`,
    `${app.subcategory} Workspace`,
    `v${app.version} Live Performance`,
    'Verified Android Package',
  ];
  const caption = screenTitles[index % screenTitles.length];

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative shrink-0 w-72 sm:w-80 h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 hover:border-emerald-500 transition-colors text-left p-4 flex flex-col justify-between group"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${preset.bg} opacity-25 group-hover:opacity-35 transition-opacity`} />
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${preset.bg} flex items-center justify-center text-white`}>
            <IconComp className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-white/90 truncate max-w-[160px]">{app.name}</span>
        </div>
        <span className="text-[11px] font-mono-num text-white/60">v{app.version}</span>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-2 my-2">
        <div className="h-14 rounded-lg bg-white/10 border border-white/10 p-2 flex flex-col justify-between">
          <Layers className="w-3.5 h-3.5 text-emerald-300" />
          <div className="h-1.5 w-10 rounded bg-white/30" />
        </div>
        <div className="h-14 rounded-lg bg-white/10 border border-white/10 p-2 flex flex-col justify-between">
          <Shield className="w-3.5 h-3.5 text-sky-300" />
          <div className="h-1.5 w-12 rounded bg-white/30" />
        </div>
        <div className="h-14 rounded-lg bg-white/10 border border-white/10 p-2 flex flex-col justify-between">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <div className="h-1.5 w-8 rounded bg-white/30" />
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between text-xs text-white/80">
        <span className="font-medium truncate">{caption}</span>
        <span className="text-[11px] text-emerald-300 shrink-0">Preview {index + 1}</span>
      </div>
    </button>
  );
}
