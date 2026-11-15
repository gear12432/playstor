import type { AppCategoryGroup, AgeRating } from '@/lib/types';

export interface SeedAppTemplate {
  id: string;
  name: string;
  packageName: string;
  developer: string;
  tagline: string;
  description: string;
  whatsNew: string;
  category: AppCategoryGroup;
  subcategory: string;
  version: string;
  sizeMb: number;
  minAndroid: string;
  ageRating: AgeRating;
  iconPreset: string;
  apkUrl: string;
  screenshots: string[];
  permissions: string[];
  featured: boolean;
  status: 'published';
  downloadCount: number;
  ratingAvg: number;
  reviewCount: number;
}

export const STARTER_CATEGORIES: Array<{
  id: string;
  name: string;
  group: AppCategoryGroup;
  sortOrder: number;
  active: boolean;
}> = [
  { id: 'cat-productivity', name: 'Productivity', group: 'Apps', sortOrder: 1, active: true },
  { id: 'cat-finance', name: 'Finance', group: 'Apps', sortOrder: 2, active: true },
  { id: 'cat-photography', name: 'Photography', group: 'Apps', sortOrder: 3, active: true },
  { id: 'cat-music', name: 'Music & Audio', group: 'Apps', sortOrder: 4, active: true },
  { id: 'cat-tools', name: 'Tools', group: 'Apps', sortOrder: 5, active: true },
  { id: 'cat-racing', name: 'Racing', group: 'Games', sortOrder: 6, active: true },
  { id: 'cat-action', name: 'Action', group: 'Games', sortOrder: 7, active: true },
  { id: 'cat-puzzle', name: 'Puzzle', group: 'Games', sortOrder: 8, active: true },
];

export const STARTER_APPS: SeedAppTemplate[] = [
  {
    id: 'voltnote-pro',
    name: 'VoltNote Pro',
    packageName: 'com.appvolt.voltnote',
    developer: 'AppVolt Labs',
    tagline: 'Offline-first markdown notes, voice memos, and instant cloud sync.',
    description:
      'VoltNote Pro is a lightweight workspace designed for rapid capture on Android. Organize project specs, record voice notes, scan receipts into searchable PDFs, and sync seamlessly across devices with zero latency.',
    whatsNew: 'Added bi-directional note links, dark AMOLED canvas theme, and 40% faster cold launch.',
    category: 'Apps',
    subcategory: 'Productivity',
    version: '4.2.1',
    sizeMb: 28.4,
    minAndroid: 'Android 9.0+',
    ageRating: '3+',
    iconPreset: 'emerald-note',
    apkUrl: 'appvolt://packages/com.appvolt.voltnote-4.2.1.apk',
    screenshots: ['screen:notes-workspace', 'screen:notes-timeline', 'screen:notes-sync'],
    permissions: ['Storage Access', 'Microphone (Optional)', 'Biometric Lock'],
    featured: true,
    status: 'published',
    downloadCount: 12450000,
    ratingAvg: 4.9,
    reviewCount: 4820,
  },
  {
    id: 'pulsepay-wallet',
    name: 'PulsePay Wallet',
    packageName: 'com.pulsepay.android',
    developer: 'Pulse Financial Tech',
    tagline: 'Zero-fee UPI transfers, expense budgets, and virtual cards.',
    description:
      'Manage daily spending, split bills instantly, and lock virtual debit cards in one tap. Built with hardware-backed keystore encryption and real-time merchant alerts.',
    whatsNew: 'Instant QR scanner upgrade with offline receipt storage and monthly spend insights.',
    category: 'Apps',
    subcategory: 'Finance',
    version: '6.8.0',
    sizeMb: 41.2,
    minAndroid: 'Android 10.0+',
    ageRating: '3+',
    iconPreset: 'cobalt-wallet',
    apkUrl: 'appvolt://packages/com.pulsepay.android-6.8.0.apk',
    screenshots: ['screen:finance-ledger', 'screen:finance-cards', 'screen:finance-analytics'],
    permissions: ['Camera (QR Scan)', 'Biometric Auth', 'Network State'],
    featured: false,
    status: 'published',
    downloadCount: 54000000,
    ratingAvg: 4.8,
    reviewCount: 19240,
  },
  {
    id: 'lenscraft-studio',
    name: 'LensCraft RAW',
    packageName: 'com.lenscraft.camera',
    developer: 'OpticForge Studio',
    tagline: 'Manual DSLR controls, 16-bit DNG capture, and film LUT profiles.',
    description:
      'Unlock full manual shutter speed, ISO, focus peaking, and histogram overlays on supported Android devices. Edit RAW photos non-destructively right on your phone.',
    whatsNew: 'New Kodak-inspired matte film profiles and 4K60 log video stabilization.',
    category: 'Apps',
    subcategory: 'Photography',
    version: '3.5.4',
    sizeMb: 64.8,
    minAndroid: 'Android 11.0+',
    ageRating: '3+',
    iconPreset: 'amber-camera',
    apkUrl: 'appvolt://packages/com.lenscraft.camera-3.5.4.apk',
    screenshots: ['screen:camera-pro', 'screen:camera-luts', 'screen:camera-histogram'],
    permissions: ['Camera', 'Media Library', 'Location (Exif Optional)'],
    featured: false,
    status: 'published',
    downloadCount: 8300000,
    ratingAvg: 4.7,
    reviewCount: 3150,
  },
  {
    id: 'soundwave-hifi',
    name: 'SoundWave HiFi',
    packageName: 'io.soundwave.player',
    developer: 'Acoustics Digital',
    tagline: 'Bit-perfect FLAC & DSD music player with 10-band parametric EQ.',
    description:
      'Play local lossless audio libraries with USB-DAC bypass, gapless playback, synchronized lyrics, and custom headphone AutoEQ presets.',
    whatsNew: 'Added Android Auto queue management and ReplayGain loudness normalization.',
    category: 'Apps',
    subcategory: 'Music & Audio',
    version: '5.1.0',
    sizeMb: 19.6,
    minAndroid: 'Android 8.0+',
    ageRating: '3+',
    iconPreset: 'rose-music',
    apkUrl: 'appvolt://packages/io.soundwave.player-5.1.0.apk',
    screenshots: ['screen:music-player', 'screen:music-eq', 'screen:music-library'],
    permissions: ['Audio Media Access', 'Bluetooth Connect', 'Foreground Service'],
    featured: false,
    status: 'published',
    downloadCount: 21500000,
    ratingAvg: 4.8,
    reviewCount: 8900,
  },
  {
    id: 'netsentry-tools',
    name: 'NetSentry Monitor',
    packageName: 'org.netsentry.toolkit',
    developer: 'KernelWorks',
    tagline: 'Wi-Fi channel analyzer, DNS latency test, and LAN device scanner.',
    description:
      'Diagnose slow connections in seconds. Inspect signal dBm heatmaps, run traceroute hops, verify SSL certificates, and monitor live bandwidth per app.',
    whatsNew: 'IPv6 subnet scanner and Wi-Fi 7 6GHz channel overlap visualizer.',
    category: 'Apps',
    subcategory: 'Tools',
    version: '2.9.3',
    sizeMb: 14.5,
    minAndroid: 'Android 9.0+',
    ageRating: '3+',
    iconPreset: 'slate-shield',
    apkUrl: 'appvolt://packages/org.netsentry.toolkit-2.9.3.apk',
    screenshots: ['screen:tools-radar', 'screen:tools-latency', 'screen:tools-devices'],
    permissions: ['Wi-Fi State', 'Local Network', 'Notifications'],
    featured: false,
    status: 'published',
    downloadCount: 4100000,
    ratingAvg: 4.6,
    reviewCount: 1640,
  },
  {
    id: 'apex-drift-racing',
    name: 'Apex Drift Horizon',
    packageName: 'com.vortex.apexdrift',
    developer: 'Vortex Interactive',
    tagline: '120fps street drift circuits, custom dyno tuning, and online leagues.',
    description:
      'Slide through rain-slicked mountain touge passes and neon city circuits with realistic tire physics, full telemetry tuning, and cross-platform ghost battles.',
    whatsNew: 'Season 9 Tokyo Expressway track pack and 4 new twin-turbo chassis.',
    category: 'Games',
    subcategory: 'Racing',
    version: '2.4.0',
    sizeMb: 486.0,
    minAndroid: 'Android 10.0+',
    ageRating: '7+',
    iconPreset: 'crimson-racing',
    apkUrl: 'appvolt://packages/com.vortex.apexdrift-2.4.0.apk',
    screenshots: ['screen:game-track', 'screen:game-garage', 'screen:game-telemetry'],
    permissions: ['Vibration', 'Game Controller', 'Network Access'],
    featured: true,
    status: 'published',
    downloadCount: 38200000,
    ratingAvg: 4.8,
    reviewCount: 24100,
  },
  {
    id: 'shadow-tactical-ops',
    name: 'Shadow Tactical Ops',
    packageName: 'com.ironclad.shadowops',
    developer: 'Ironclad Games',
    tagline: 'Squad-based stealth missions with destructible cover and co-op raids.',
    description:
      'Command a 4-operator recon unit across dynamic weather zones. Plan breaches in tactical pause mode or play live 4v4 extraction matches.',
    whatsNew: 'Night Vision thermal visor mode and 2 new Arctic Outpost missions.',
    category: 'Games',
    subcategory: 'Action',
    version: '1.12.5',
    sizeMb: 712.5,
    minAndroid: 'Android 11.0+',
    ageRating: '16+',
    iconPreset: 'indigo-tactical',
    apkUrl: 'appvolt://packages/com.ironclad.shadowops-1.12.5.apk',
    screenshots: ['screen:game-squad', 'screen:game-map', 'screen:game-loadout'],
    permissions: ['Voice Chat Mic', 'Storage Expansion', 'Network Access'],
    featured: false,
    status: 'published',
    downloadCount: 17900000,
    ratingAvg: 4.7,
    reviewCount: 11200,
  },
  {
    id: 'chromagrid-puzzle',
    name: 'ChromaGrid Logic',
    packageName: 'com.atelier.chromagrid',
    developer: 'Atelier Logic',
    tagline: '2,400 handcrafted spatial logic puzzles with zero ads and offline play.',
    description:
      'Connect chromatic nodes across geometric grids without crossing paths. Features daily ranked challenges, colorblind symbol modes, and calming ambient soundscapes.',
    whatsNew: 'Added Hexagonal Pack (300 new levels) and instant undo history.',
    category: 'Games',
    subcategory: 'Puzzle',
    version: '3.1.2',
    sizeMb: 34.0,
    minAndroid: 'Android 8.0+',
    ageRating: '3+',
    iconPreset: 'teal-puzzle',
    apkUrl: 'appvolt://packages/com.atelier.chromagrid-3.1.2.apk',
    screenshots: ['screen:puzzle-board', 'screen:puzzle-daily', 'screen:puzzle-stats'],
    permissions: ['Haptic Feedback'],
    featured: false,
    status: 'published',
    downloadCount: 9600000,
    ratingAvg: 4.9,
    reviewCount: 5430,
  },
];
