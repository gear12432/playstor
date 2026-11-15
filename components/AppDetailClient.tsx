'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Smartphone,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, logFirestoreError, OperationType } from '@/lib/firestore-errors';
import { useFirebase } from '@/components/providers/FirebaseProvider';
import { AppIcon, AppScreenshotPreview } from '@/components/AppArtwork';
import { InstallButton } from '@/components/InstallButton';
import { formatDownloadCount } from '@/lib/apk-downloader';
import { isRenderableImageSrc } from '@/lib/image-compress';
import { APP_CONSTRAINTS, type AppReview, type StoreApp } from '@/lib/types';

export function AppDetailClient({ appId }: { appId: string }) {
  const { user, libraryMap, toggleWishlist, signInWithGoogle } = useFirebase();

  const [app, setApp] = useState<StoreApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [activeScreenshot, setActiveScreenshot] = useState<number | null>(null);

  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const appRef = doc(db, 'apps', appId);
    const unsubApp = onSnapshot(
      appRef,
      (snap) => {
        if (snap.exists()) {
          setApp(snap.data() as StoreApp);
        } else {
          setApp(null);
        }
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        logFirestoreError(error, OperationType.GET, `apps/${appId}`);
      }
    );

    const reviewsQ = query(
      collection(db, 'apps', appId, 'reviews'),
      where('status', '==', 'visible')
    );
    const unsubReviews = onSnapshot(
      reviewsQ,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as AppReview);
        list.sort((a, b) => {
          const tA = a.createdAt?.toMillis?.() || 0;
          const tB = b.createdAt?.toMillis?.() || 0;
          return tB - tA;
        });
        setReviews(list);
      },
      (error) => {
        logFirestoreError(error, OperationType.LIST, `apps/${appId}/reviews`);
      }
    );

    return () => {
      unsubApp();
      unsubReviews();
    };
  }, [appId]);

  const isWishlisted = Boolean(libraryMap[appId]?.wishlisted);

  const ratingBreakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
      counts[idx] += 1;
    });
    return counts;
  }, [reviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');

    if (!user) {
      await signInWithGoogle();
      return;
    }

    const trimmed = commentInput.trim();
    if (trimmed.length < APP_CONSTRAINTS.COMMENT_MIN || trimmed.length > APP_CONSTRAINTS.COMMENT_MAX) {
      setReviewError(
        `Review must be between ${APP_CONSTRAINTS.COMMENT_MIN} and ${APP_CONSTRAINTS.COMMENT_MAX} characters.`
      );
      return;
    }
    if (!app) return;

    setSubmittingReview(true);
    const reviewId = `rev_${user.uid}_${Date.now()}`;
    const reviewRef = doc(db, 'apps', app.id, 'reviews', reviewId);
    const appRef = doc(db, 'apps', app.id);

    try {
      const newCount = (app.reviewCount || 0) + 1;
      const newAvg = Number(
        (((app.ratingAvg || 0) * (app.reviewCount || 0) + ratingInput) / newCount).toFixed(2)
      );

      const batch = writeBatch(db);
      const payload: Record<string, unknown> = {
        id: reviewId,
        appId: app.id,
        authorId: user.uid,
        authorName: (user.displayName || user.email?.split('@')[0] || 'Play User').slice(0, 80),
        rating: ratingInput,
        comment: trimmed,
        status: 'visible',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (user.photoURL) {
        payload.authorPhoto = user.photoURL.slice(0, 500);
      }

      batch.set(reviewRef, payload);
      batch.update(appRef, {
        ratingAvg: Math.min(5, Math.max(0, newAvg)),
        reviewCount: newCount,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      setCommentInput('');
      setRatingInput(5);
    } catch (error) {
      setReviewError('Could not save review. Please verify your Google account is active.');
      handleFirestoreError(error, OperationType.WRITE, `apps/${app.id}/reviews/${reviewId}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (rev: AppReview) => {
    if (!app) return;
    try {
      await deleteDoc(doc(db, 'apps', app.id, 'reviews', rev.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `apps/${app.id}/reviews/${rev.id}`);
    }
  };

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
      </main>
    );
  }

  if (!app) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-slate-900">App Not Found</h1>
        <p className="text-sm text-slate-600">
          This package may have been unpublished or removed by the store administrator.
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

  const screenshotList =
    app.screenshots && app.screenshots.length > 0
      ? app.screenshots
      : ['screen:overview', 'screen:features', 'screen:security'];

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Storefront</span>
      </Link>

      {/* Play Store Header Block */}
      <section className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-start gap-5">
          <AppIcon app={app} size="xl" />
          <div className="space-y-1.5 min-w-0">
            <h1 className="font-display text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">
              {app.name}
            </h1>
            <p className="text-sm sm:text-base font-medium text-[#01875F]">{app.developer}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-0.5">
              <span>{app.category}</span>
              <span aria-hidden="true">·</span>
              <span>{app.subcategory}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">{app.packageName}</span>
            </div>
            <p className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified APK · Play Protect Checked</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <InstallButton app={app} size="lg" />
          <button
            type="button"
            onClick={() => toggleWishlist(app)}
            className={`px-4 py-3 rounded-lg border text-sm font-semibold inline-flex items-center gap-2 transition-colors min-h-[44px] ${
              isWishlisted
                ? 'bg-[#E6F4EA] border-[#01875F]/40 text-[#01875F]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
            <span>{isWishlisted ? 'Saved' : 'Wishlist'}</span>
          </button>
        </div>
      </section>

      {/* 4-Column Tabular Metrics Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border border-slate-200 rounded-2xl bg-slate-50/70">
        <div className="p-4 sm:p-5 text-center space-y-1">
          <p className="text-base sm:text-lg font-bold text-slate-900 font-mono-num inline-flex items-center gap-1 justify-center">
            {app.ratingAvg.toFixed(1)}
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </p>
          <p className="text-xs text-slate-500 font-mono-num">
            {(app.reviewCount || 0).toLocaleString()} reviews
          </p>
        </div>

        <div className="p-4 sm:p-5 text-center space-y-1">
          <p className="text-base sm:text-lg font-bold text-slate-900 font-mono-num">
            {formatDownloadCount(app.downloadCount)}
          </p>
          <p className="text-xs text-slate-500">Downloads</p>
        </div>

        <div className="p-4 sm:p-5 text-center space-y-1">
          <p className="text-base sm:text-lg font-bold text-slate-900 font-mono-num">
            {app.ageRating}
          </p>
          <p className="text-xs text-slate-500">Rated for {app.ageRating}</p>
        </div>

        <div className="p-4 sm:p-5 text-center space-y-1">
          <p className="text-base sm:text-lg font-bold text-slate-900 font-mono-num">
            {app.sizeMb.toFixed(1)} MB
          </p>
          <p className="text-xs text-slate-500 font-mono-num">Version {app.version}</p>
        </div>
      </section>

      {/* Feature Graphic Banner (when uploaded/set) */}
      {isRenderableImageSrc(app.featureImageUrl) && (
        <section className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={app.featureImageUrl}
            alt={`${app.name} feature banner`}
            referrerPolicy="no-referrer"
            className="w-full max-h-72 object-cover"
          />
        </section>
      )}

      {/* Screenshot Gallery */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-slate-900">App Previews</h2>
        <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
          {screenshotList.map((src, index) => (
            <AppScreenshotPreview
              key={`${src}_${index}`}
              src={src}
              app={app}
              index={index}
              onClick={() => setActiveScreenshot(index)}
            />
          ))}
        </div>
      </section>

      {/* About & Technical Specs Split */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-3">
            <h2 className="font-display text-xl font-bold text-slate-900">About this app</h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
              {app.description}
            </p>
          </div>

          {app.whatsNew && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
              <h3 className="font-display text-base font-semibold text-slate-900">What&apos;s new</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{app.whatsNew}</p>
            </div>
          )}

          {/* Data Safety */}
          <div className="rounded-xl border border-slate-200 p-5 space-y-4">
            <h3 className="font-display text-base font-semibold text-slate-900">Data safety</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Safety starts with understanding how developers collect and share your data. Data privacy and security practices may vary based on your usage and Android OS version.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 pt-1">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#01875F] shrink-0 mt-0.5" />
                <span>No personal data shared with third parties</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-[#01875F] shrink-0 mt-0.5" />
                <span>Data encrypted in transit via TLS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Metadata Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-slate-200 p-5 space-y-4">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Package Details
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-500">Version</dt>
                <dd className="font-mono-num font-medium text-slate-900">{app.version}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-500">Updated</dt>
                <dd className="font-mono-num text-slate-900">
                  {app.updatedAt?.toDate
                    ? app.updatedAt.toDate().toLocaleDateString()
                    : 'Recent'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-500">Download size</dt>
                <dd className="font-mono-num text-slate-900">{app.sizeMb.toFixed(1)} MB</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-500">Requires Android</dt>
                <dd className="inline-flex items-center gap-1 text-slate-900 font-medium">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  {app.minAndroid}
                </dd>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <dt className="text-xs text-slate-500 mb-1">Package identifier</dt>
                <dd className="text-xs font-mono-num text-slate-800 break-all">
                  {app.packageName}
                </dd>
              </div>
            </dl>
          </div>

          {app.permissions && app.permissions.length > 0 && (
            <div className="rounded-xl border border-slate-200 p-5 space-y-3">
              <h3 className="font-display text-base font-semibold text-slate-900">
                App Permissions
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                {app.permissions.map((perm) => (
                  <li key={perm} className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#01875F] shrink-0" />
                    <span>{perm}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>

      {/* Ratings & Real-Time Reviews */}
      <section className="border-t border-slate-200 pt-8 space-y-6">
        <h2 className="font-display text-xl font-bold text-slate-900">Ratings and reviews</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="space-y-1">
            <p className="font-display text-5xl font-bold text-slate-900 font-mono-num">
              {app.ratingAvg.toFixed(1)}
            </p>
            <div className="flex items-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(app.ratingAvg) ? 'fill-current' : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-500 font-mono-num pt-1">
              {(app.reviewCount || 0).toLocaleString()} total ratings
            </p>
          </div>

          <div className="md:col-span-2 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingBreakdown[star - 1];
              const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs font-mono-num">
                  <span className="w-4 text-slate-600 text-right">{star}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-[#01875F] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-slate-500 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review Form */}
        <form
          onSubmit={handleSubmitReview}
          className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">
              {user ? 'Rate this app' : 'Sign in with Google to leave a review'}
            </h3>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingInput(star)}
                  className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= ratingInput ? 'fill-current' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={3}
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Share your experience with speed, stability, and features..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#01875F]"
          />

          {reviewError && <p className="text-xs text-red-600 font-medium">{reviewError}</p>}

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={submittingReview}
              className="px-5 py-2 rounded-lg bg-[#01875F] text-white text-sm font-semibold hover:bg-[#01704F] transition-colors disabled:opacity-60 min-h-[40px]"
            >
              {!user
                ? 'Sign in with Google'
                : submittingReview
                  ? 'Posting...'
                  : 'Post Review'}
            </button>
          </div>
        </form>

        {/* Live Review Feed */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-500">
              No written reviews yet. Be the first to review {app.name}.
            </p>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl border border-slate-200 bg-white p-5 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {rev.authorPhoto ? (
                      <img
                        src={rev.authorPhoto}
                        alt={rev.authorName}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                        {rev.authorName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {rev.authorName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono-num">
                        <span className="inline-flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < rev.rating ? 'fill-current' : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </span>
                        <span>
                          {rev.createdAt?.toDate
                            ? rev.createdAt.toDate().toLocaleDateString()
                            : 'Just now'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {user?.uid === rev.authorId && (
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(rev)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                      aria-label="Delete your review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Screenshot Lightbox Modal */}
      {activeScreenshot !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setActiveScreenshot(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-white">
              <span className="text-sm font-semibold">
                {app.name} — Preview {activeScreenshot + 1} of {screenshotList.length}
              </span>
              <button
                type="button"
                onClick={() => setActiveScreenshot(null)}
                className="p-2 rounded-lg hover:bg-white/10"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center">
              <AppScreenshotPreview
                src={screenshotList[activeScreenshot]}
                app={app}
                index={activeScreenshot}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
