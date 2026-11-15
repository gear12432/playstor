import Link from 'next/link';
import { ArrowLeft, SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 p-8 text-center space-y-5 shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
          <SearchX className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-display text-xl font-bold text-slate-900">Page Not Found</h1>
          <p className="text-sm text-slate-600">
            The requested AppVolt Play page could not be found.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#01875F] text-white text-sm font-semibold hover:bg-[#01704F] min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Play Store</span>
        </Link>
      </div>
    </div>
  );
}
