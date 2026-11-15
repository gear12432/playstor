import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { StorefrontView } from '@/components/StorefrontView';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex-1">
        <StorefrontView />
      </div>
      <footer className="border-t border-slate-200 bg-slate-50 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800">AppVolt Play</span>
            <span aria-hidden="true">·</span>
            <span>Verified Android APK Distribution</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Storefront
            </Link>
            <Link href="/library" className="hover:text-slate-900 transition-colors">
              My Library
            </Link>
            <Link href="/login" className="hover:text-slate-900 transition-colors">
              User Sign In
            </Link>
            <Link href="/admin" className="hover:text-slate-900 transition-colors">
              Admin Console
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
