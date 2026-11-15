'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-slate-50 px-4 text-slate-900">
        <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 p-8 text-center space-y-4">
          <h1 className="text-xl font-bold">AppVolt Play Recovery</h1>
          <p className="text-sm text-slate-600">
            {error?.message || 'Unable to render the application.'}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-lg bg-[#01875F] text-white text-sm font-semibold"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
