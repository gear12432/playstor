'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AppWindow,
  CheckCircle2,
  Download,
  ExternalLink,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Pencil,
  PlusCircle,
  Search,
  Shield,
  Sparkles,
  Star,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { emailToInviteKey, useFirebase } from '@/components/providers/FirebaseProvider';
import { AppIcon, ICON_PRESETS } from '@/components/AppArtwork';
import { STARTER_APPS, STARTER_CATEGORIES } from '@/lib/seed-catalog';
import { formatDownloadCount } from '@/lib/apk-downloader';
import {
  APP_CONSTRAINTS,
  type AdminInvite,
  type AdminRecord,
  type AgeRating,
  type AppCategoryGroup,
  type AppReview,
  type AppStatus,
  type DownloadRecord,
  type StoreApp,
  type StoreCategory,
  type UserPrivate,
  type UserPublic,
} from '@/lib/types';

type AdminTab =
  | 'overview'
  | 'apps'
  | 'publish'
  | 'categories'
  | 'users'
  | 'downloads'
  | 'reviews'
  | 'admins';

interface CombinedUser extends UserPublic {
  email?: string;
  provider?: string;
}

const INITIAL_FORM = {
  id: '',
  name: '',
  packageName: '',
  developer: '',
  tagline: '',
  description: '',
  whatsNew: '',
  category: 'Apps' as AppCategoryGroup,
  subcategory: 'Productivity',
  version: '1.0.0',
  sizeMb: '24.5',
  minAndroid: 'Android 9.0+',
  ageRating: '3+' as AgeRating,
  iconPreset: 'emerald-note',
  iconUrl: '',
  apkUrl: 'appvolt://packages/app-release.apk',
  screenshotsText: 'screen:overview\nscreen:workspace',
  permissionsText: 'Network Access, Storage',
  featured: false,
  status: 'published' as AppStatus,
};

export function AdminDashboard() {
  const { user, signOutUser } = useFirebase();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real-time Firestore collections
  const [allApps, setAllApps] = useState<StoreApp[]>([]);
  const [allCategories, setAllCategories] = useState<StoreCategory[]>([]);
  const [allUsers, setAllUsers] = useState<CombinedUser[]>([]);
  const [allDownloads, setAllDownloads] = useState<DownloadRecord[]>([]);
  const [adminsList, setAdminsList] = useState<AdminRecord[]>([]);
  const [invitesList, setInvitesList] = useState<AdminInvite[]>([]);
  const [selectedReviewAppId, setSelectedReviewAppId] = useState<string>('');
  const [appReviews, setAppReviews] = useState<AppReview[]>([]);

  // Search & UI feedback states
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<'all' | AppStatus>('all');
  const [userSearch, setUserSearch] = useState('');
  const [statusBanner, setStatusBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );
  const [seeding, setSeeding] = useState(false);

  // App Form state
  const [editingApp, setEditingApp] = useState<StoreApp | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [savingApp, setSavingApp] = useState(false);

  // Category Form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatGroup, setNewCatGroup] = useState<AppCategoryGroup>('Apps');
  const [newCatOrder, setNewCatOrder] = useState('10');

  // Admin Invite Form state
  const [inviteEmail, setInviteEmail] = useState('');

  const notify = (type: 'ok' | 'err', text: string) => {
    setStatusBanner({ type, text });
    setTimeout(() => setStatusBanner(null), 5000);
  };

  // Attach real-time Firestore listeners for Admin
  useEffect(() => {
    const unsubApps = onSnapshot(
      collection(db, 'apps'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as StoreApp);
        list.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
        setAllApps(list);
        if (!selectedReviewAppId && list.length > 0) {
          setSelectedReviewAppId(list[0].id);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'apps')
    );

    const unsubCats = onSnapshot(
      collection(db, 'categories'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as StoreCategory);
        list.sort((a, b) => a.sortOrder - b.sortOrder);
        setAllCategories(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'categories')
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      async (snap) => {
        const publicList = snap.docs.map((d) => d.data() as UserPublic);
        const enriched = await Promise.all(
          publicList.map(async (u) => {
            try {
              const privSnap = await getDoc(doc(db, 'users', u.uid, 'private', 'info'));
              if (privSnap.exists()) {
                const priv = privSnap.data() as UserPrivate;
                return { ...u, email: priv.email, provider: priv.provider };
              }
            } catch {
              // ignore individual private lookup failure
            }
            return u;
          })
        );
        enriched.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setAllUsers(enriched);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users')
    );

    const unsubDownloads = onSnapshot(
      collection(db, 'downloads'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as DownloadRecord);
        list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setAllDownloads(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'downloads')
    );

    const unsubAdmins = onSnapshot(
      collection(db, 'admins'),
      (snap) => {
        setAdminsList(snap.docs.map((d) => d.data() as AdminRecord));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'admins')
    );

    const unsubInvites = onSnapshot(
      collection(db, 'admin_invites'),
      (snap) => {
        setInvitesList(snap.docs.map((d) => d.data() as AdminInvite));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'admin_invites')
    );

    return () => {
      unsubApps();
      unsubCats();
      unsubUsers();
      unsubDownloads();
      unsubAdmins();
      unsubInvites();
    };
  }, [selectedReviewAppId]);

  // Real-time reviews for selected app in Reviews tab
  useEffect(() => {
    if (!selectedReviewAppId) return;
    const unsub = onSnapshot(
      collection(db, 'apps', selectedReviewAppId, 'reviews'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as AppReview);
        list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setAppReviews(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `apps/${selectedReviewAppId}/reviews`)
    );
    return () => unsub();
  }, [selectedReviewAppId]);

  const visibleReviews = selectedReviewAppId ? appReviews : [];

  const totalDownloads = useMemo(
    () => allApps.reduce((acc, a) => acc + (a.downloadCount || 0), 0),
    [allApps]
  );

  const filteredApps = useMemo(() => {
    const q = appSearch.trim().toLowerCase();
    return allApps.filter((a) => {
      if (appStatusFilter !== 'all' && a.status !== appStatusFilter) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.packageName.toLowerCase().includes(q) ||
        a.developer.toLowerCase().includes(q)
      );
    });
  }, [allApps, appSearch, appStatusFilter]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q)
    );
  }, [allUsers, userSearch]);

  const handleSeedCatalog = async () => {
    if (!user || seeding) return;
    setSeeding(true);
    try {
      const batch = writeBatch(db);
      for (const cat of STARTER_CATEGORIES) {
        batch.set(doc(db, 'categories', cat.id), {
          ...cat,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const app of STARTER_APPS) {
        batch.set(doc(db, 'apps', app.id), {
          ...app,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
      notify('ok', 'Published 8 Play Store apps & games and 8 categories to Cloud Firestore.');
    } catch (err) {
      notify('err', 'Failed to seed catalog.');
      handleFirestoreError(err, OperationType.WRITE, 'apps');
    } finally {
      setSeeding(false);
    }
  };

  const openNewAppForm = () => {
    setEditingApp(null);
    setForm(INITIAL_FORM);
    setActiveTab('publish');
  };

  const openEditAppForm = (app: StoreApp) => {
    setEditingApp(app);
    setForm({
      id: app.id,
      name: app.name,
      packageName: app.packageName,
      developer: app.developer,
      tagline: app.tagline,
      description: app.description,
      whatsNew: app.whatsNew || '',
      category: app.category,
      subcategory: app.subcategory,
      version: app.version,
      sizeMb: String(app.sizeMb),
      minAndroid: app.minAndroid,
      ageRating: app.ageRating,
      iconPreset: app.iconPreset,
      iconUrl: app.iconUrl || '',
      apkUrl: app.apkUrl,
      screenshotsText: (app.screenshots || []).join('\n'),
      permissionsText: (app.permissions || []).join(', '),
      featured: app.featured,
      status: app.status,
    });
    setActiveTab('publish');
  };

  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cleanName = form.name.trim();
    const cleanPkg = form.packageName.trim();
    const cleanDev = form.developer.trim();
    const cleanTagline = form.tagline.trim();
    const cleanDesc = form.description.trim();
    const sizeNum = Number(form.sizeMb);

    if (cleanName.length < APP_CONSTRAINTS.NAME_MIN || cleanName.length > APP_CONSTRAINTS.NAME_MAX) {
      notify('err', `App name must be ${APP_CONSTRAINTS.NAME_MIN}-${APP_CONSTRAINTS.NAME_MAX} chars.`);
      return;
    }
    if (!APP_CONSTRAINTS.PACKAGE_REGEX.test(cleanPkg)) {
      notify('err', 'Package ID must follow Android reverse-domain format (e.g. com.company.app).');
      return;
    }
    if (cleanTagline.length < APP_CONSTRAINTS.TAGLINE_MIN) {
      notify('err', 'Tagline must be at least 4 characters.');
      return;
    }
    if (cleanDesc.length < APP_CONSTRAINTS.DESCRIPTION_MIN) {
      notify('err', 'Description must be at least 10 characters.');
      return;
    }
    if (Number.isNaN(sizeNum) || sizeNum <= 0 || sizeNum > 10000) {
      notify('err', 'Size (MB) must be between 0.1 and 10000.');
      return;
    }

    const generatedId =
      editingApp?.id ||
      (form.id.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) ||
      `app_${Date.now()}`;

    if (!APP_CONSTRAINTS.ID_REGEX.test(generatedId)) {
      notify('err', 'App ID may only contain letters, numbers, hyphens, and underscores.');
      return;
    }

    const screenshots = form.screenshotsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, APP_CONSTRAINTS.MAX_SCREENSHOTS)
      .map((s) => s.slice(0, 500));

    const permissions = form.permissionsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, APP_CONSTRAINTS.MAX_PERMISSIONS)
      .map((s) => s.slice(0, 80));

    setSavingApp(true);
    try {
      const appRef = doc(db, 'apps', generatedId);
      const payload: Record<string, unknown> = {
        id: generatedId,
        name: cleanName.slice(0, APP_CONSTRAINTS.NAME_MAX),
        packageName: cleanPkg.slice(0, 120),
        developer: cleanDev.slice(0, APP_CONSTRAINTS.DEVELOPER_MAX),
        tagline: cleanTagline.slice(0, APP_CONSTRAINTS.TAGLINE_MAX),
        description: cleanDesc.slice(0, APP_CONSTRAINTS.DESCRIPTION_MAX),
        category: form.category,
        subcategory: form.subcategory.trim().slice(0, APP_CONSTRAINTS.SUBCATEGORY_MAX),
        version: form.version.trim().slice(0, APP_CONSTRAINTS.VERSION_MAX),
        sizeMb: Number(sizeNum.toFixed(2)),
        minAndroid: form.minAndroid.trim().slice(0, 32),
        ageRating: form.ageRating,
        iconPreset: form.iconPreset,
        apkUrl: form.apkUrl.trim().slice(0, APP_CONSTRAINTS.APK_URL_MAX),
        screenshots,
        permissions,
        featured: form.featured,
        status: form.status,
        downloadCount: editingApp ? editingApp.downloadCount : 0,
        ratingAvg: editingApp ? editingApp.ratingAvg : 5,
        reviewCount: editingApp ? editingApp.reviewCount : 0,
        createdBy: editingApp ? editingApp.createdBy : user.uid,
        updatedAt: serverTimestamp(),
      };

      if (form.whatsNew.trim()) {
        payload.whatsNew = form.whatsNew.trim().slice(0, APP_CONSTRAINTS.WHATS_NEW_MAX);
      }
      if (form.iconUrl.trim()) {
        payload.iconUrl = form.iconUrl.trim().slice(0, APP_CONSTRAINTS.ICON_URL_MAX);
      }

      if (editingApp) {
        await updateDoc(appRef, payload);
        notify('ok', `Updated "${cleanName}" in Cloud Firestore.`);
      } else {
        payload.createdAt = serverTimestamp();
        await setDoc(appRef, payload);
        notify('ok', `Published "${cleanName}" to AppVolt Play.`);
      }

      setEditingApp(null);
      setForm(INITIAL_FORM);
      setActiveTab('apps');
    } catch (err) {
      notify('err', 'Could not save app. Check field constraints.');
      handleFirestoreError(err, OperationType.WRITE, `apps/${generatedId}`);
    } finally {
      setSavingApp(false);
    }
  };

  const handleToggleAppField = async (app: StoreApp, field: 'featured' | 'status') => {
    try {
      const appRef = doc(db, 'apps', app.id);
      if (field === 'featured') {
        await updateDoc(appRef, { featured: !app.featured, updatedAt: serverTimestamp() });
      } else {
        const nextStatus: AppStatus = app.status === 'published' ? 'suspended' : 'published';
        await updateDoc(appRef, { status: nextStatus, updatedAt: serverTimestamp() });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `apps/${app.id}`);
    }
  };

  const handleDeleteApp = async (app: StoreApp) => {
    try {
      await deleteDoc(doc(db, 'apps', app.id));
      notify('ok', `Deleted "${app.name}" from store catalog.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `apps/${app.id}`);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCatName.trim();
    if (clean.length < 2 || clean.length > 40) return;
    const catId = `cat-${clean.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    try {
      await setDoc(doc(db, 'categories', catId), {
        id: catId,
        name: clean,
        group: newCatGroup,
        sortOrder: Math.max(0, Number(newCatOrder) || 10),
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewCatName('');
      notify('ok', `Category "${clean}" saved.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `categories/${catId}`);
    }
  };

  const handleToggleCategory = async (cat: StoreCategory) => {
    try {
      await updateDoc(doc(db, 'categories', cat.id), {
        active: !cat.active,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `categories/${cat.id}`);
    }
  };

  const handleDeleteCategory = async (cat: StoreCategory) => {
    try {
      await deleteDoc(doc(db, 'categories', cat.id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${cat.id}`);
    }
  };

  const handleToggleUserBan = async (u: CombinedUser) => {
    try {
      const nextStatus = u.status === 'active' ? 'banned' : 'active';
      await updateDoc(doc(db, 'users', u.uid), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      notify('ok', `User ${u.displayName} is now ${nextStatus}.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${u.uid}`);
    }
  };

  const handleToggleUserAdmin = async (u: CombinedUser) => {
    if (u.uid === user?.uid) {
      notify('err', 'You cannot demote your own active admin session.');
      return;
    }
    try {
      const nextRole = u.role === 'admin' ? 'user' : 'admin';
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', u.uid), {
        role: nextRole,
        updatedAt: serverTimestamp(),
      });
      if (nextRole === 'admin') {
        batch.set(doc(db, 'admins', u.uid), {
          uid: u.uid,
          email: u.email || `${u.uid}@appvolt.local`,
          displayName: u.displayName,
          role: 'admin',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.delete(doc(db, 'admins', u.uid));
      }
      await batch.commit();
      notify('ok', `Updated ${u.displayName} role to ${nextRole}.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `admins/${u.uid}`);
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const trimmed = inviteEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      notify('err', 'Enter a valid Gmail address.');
      return;
    }
    const inviteId = emailToInviteKey(trimmed);
    try {
      await setDoc(doc(db, 'admin_invites', inviteId), {
        id: inviteId,
        email: trimmed,
        invitedBy: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setInviteEmail('');
      notify('ok', `Authorized ${trimmed} as Admin.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `admin_invites/${inviteId}`);
    }
  };

  const handleToggleReviewVisibility = async (rev: AppReview) => {
    try {
      await updateDoc(doc(db, 'apps', rev.appId, 'reviews', rev.id), {
        status: rev.status === 'visible' ? 'hidden' : 'visible',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `apps/${rev.appId}/reviews/${rev.id}`);
    }
  };

  const handleDeleteReview = async (rev: AppReview) => {
    try {
      await deleteDoc(doc(db, 'apps', rev.appId, 'reviews', rev.id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `apps/${rev.appId}/reviews/${rev.id}`);
    }
  };

  const navItems: Array<{
    id: AdminTab;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
    { id: 'apps', label: 'Apps Catalog', Icon: AppWindow },
    { id: 'publish', label: editingApp ? 'Edit App' : 'Publish App', Icon: PlusCircle },
    { id: 'categories', label: 'Categories', Icon: FolderKanban },
    { id: 'users', label: 'Users', Icon: Users },
    { id: 'downloads', label: 'Download Logs', Icon: Download },
    { id: 'reviews', label: 'Reviews', Icon: MessageSquare },
    { id: 'admins', label: 'Admin Access', Icon: Shield },
  ];

  const tabTitle = navItems.find((n) => n.id === activeTab)?.label || 'Overview';

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-slate-950 text-slate-300 border-r border-slate-800">
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <span className="font-display text-base font-bold text-white tracking-tight">
            AppVolt Console
          </span>
          <span className="text-[11px] font-mono-num text-emerald-400">ADMIN</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                activeTab === id
                  ? 'bg-[#01875F] text-white'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="text-xs">
            <p className="font-semibold text-white truncate">{user?.displayName || 'Admin'}</p>
            <p className="text-slate-400 truncate">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white inline-flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </Link>
            <button
              type="button"
              onClick={() => signOutUser()}
              className="p-2 rounded-lg bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-300"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-slate-950 text-slate-200 flex flex-col z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
              <span className="font-display font-bold text-white">AppVolt Console</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActiveTab(id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-left ${
                    activeTab === id ? 'bg-[#01875F] text-white' : 'hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <Link href="/" className="text-xs text-emerald-400 font-medium">
                View Storefront →
              </Link>
              <button
                type="button"
                onClick={() => signOutUser()}
                className="text-xs text-red-400 font-medium"
              >
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="text-slate-400">Admin Console</span>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-900">{tabTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={openNewAppForm}
              className="px-4 py-2 rounded-lg bg-[#01875F] text-white text-xs sm:text-sm font-semibold hover:bg-[#01704F] inline-flex items-center gap-1.5 whitespace-nowrap min-h-[38px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish App</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {statusBanner && (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium border flex items-center justify-between ${
                statusBanner.type === 'ok'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <span>{statusBanner.text}</span>
              <button type="button" onClick={() => setStatusBanner(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1">
                  <p className="text-xs font-medium text-slate-500">Published Catalog</p>
                  <p className="font-display text-2xl font-bold text-slate-900 font-mono-num">
                    {allApps.length}
                  </p>
                  <p className="text-xs text-slate-500 font-mono-num">
                    {allApps.filter((a) => a.status === 'published').length} live on storefront
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1">
                  <p className="text-xs font-medium text-slate-500">Total Downloads</p>
                  <p className="font-display text-2xl font-bold text-slate-900 font-mono-num">
                    {formatDownloadCount(totalDownloads)}
                  </p>
                  <p className="text-xs text-emerald-700 font-mono-num">
                    {allDownloads.length} logged APK events
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1">
                  <p className="text-xs font-medium text-slate-500">Registered Users</p>
                  <p className="font-display text-2xl font-bold text-slate-900 font-mono-num">
                    {allUsers.length}
                  </p>
                  <p className="text-xs text-slate-500 font-mono-num">
                    {allUsers.filter((u) => u.status === 'active').length} active accounts
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1">
                  <p className="text-xs font-medium text-slate-500">Authorized Admins</p>
                  <p className="font-display text-2xl font-bold text-slate-900 font-mono-num">
                    {adminsList.length || 1}
                  </p>
                  <p className="text-xs text-slate-500 font-mono-num">
                    {allCategories.length} active categories
                  </p>
                </div>
              </div>

              {/* Starter Catalog Action Banner */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Quick Populate Play Store Catalog
                  </h2>
                  <p className="text-sm text-slate-600">
                    Write 8 curated Android apps &amp; games and 8 categories directly into Cloud Firestore for instant storefront testing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSeedCatalog}
                  disabled={seeding}
                  className="px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 inline-flex items-center gap-2 shrink-0 disabled:opacity-60 min-h-[42px]"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{seeding ? 'Publishing...' : 'Seed Starter Catalog'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Downloads */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#01875F]" />
                      <span>Real-Time Download Stream</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('downloads')}
                      className="text-xs font-semibold text-[#01875F] hover:underline"
                    >
                      View all
                    </button>
                  </div>

                  {allDownloads.length === 0 ? (
                    <p className="text-sm text-slate-500 py-6 text-center">
                      No APK downloads recorded yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {allDownloads.slice(0, 6).map((dl) => (
                        <div key={dl.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{dl.appName}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {dl.userName} · v{dl.version}
                            </p>
                          </div>
                          <span className="text-xs font-mono-num text-slate-500 shrink-0">
                            {dl.sizeMb.toFixed(1)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Apps */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-bold text-slate-900">
                      Top Store Apps
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('apps')}
                      className="text-xs font-semibold text-[#01875F] hover:underline"
                    >
                      Manage catalog
                    </button>
                  </div>

                  {allApps.length === 0 ? (
                    <p className="text-sm text-slate-500 py-6 text-center">
                      Publish or seed apps to see rankings.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {[...allApps]
                        .sort((a, b) => b.downloadCount - a.downloadCount)
                        .slice(0, 6)
                        .map((app) => (
                          <div key={app.id} className="py-2.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <AppIcon app={app} size="sm" />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {app.name}
                                </p>
                                <p className="text-xs text-slate-500 truncate">{app.packageName}</p>
                              </div>
                            </div>
                            <span className="text-xs font-mono-num font-semibold text-slate-800 shrink-0">
                              {formatDownloadCount(app.downloadCount)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPS CATALOG */}
          {activeTab === 'apps' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    placeholder="Filter by app name or package..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#01875F]"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
                  {(['all', 'published', 'draft', 'suspended'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setAppStatusFilter(st)}
                      className={`px-3 py-1 text-xs font-medium rounded-md capitalize ${
                        appStatusFilter === st
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Application</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Downloads</th>
                      <th className="px-4 py-3 text-right">Rating</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApps.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                          No apps match your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredApps.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <AppIcon app={app} size="sm" />
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate max-w-[200px]">
                                  {app.name}
                                </p>
                                <p className="text-xs font-mono-num text-slate-500 truncate max-w-[220px]">
                                  {app.packageName} · v{app.version}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {app.category} / {app.subcategory}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleToggleAppField(app, 'status')}
                              className={`text-xs font-semibold capitalize ${
                                app.status === 'published'
                                  ? 'text-emerald-700'
                                  : app.status === 'draft'
                                    ? 'text-amber-700'
                                    : 'text-red-700'
                              }`}
                            >
                              {app.status}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right font-mono-num text-slate-800">
                            {formatDownloadCount(app.downloadCount)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono-num text-slate-800">
                            {app.ratingAvg.toFixed(1)} ★
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleAppField(app, 'featured')}
                                title="Toggle Featured"
                                className={`p-1.5 rounded-lg border ${
                                  app.featured
                                    ? 'border-amber-300 bg-amber-50 text-amber-600'
                                    : 'border-slate-200 text-slate-400 hover:text-slate-700'
                                }`}
                              >
                                <Star className={`w-4 h-4 ${app.featured ? 'fill-current' : ''}`} />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditAppForm(app)}
                                title="Edit App"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteApp(app)}
                                title="Delete App"
                                className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PUBLISH / EDIT APP */}
          {activeTab === 'publish' && (
            <form
              onSubmit={handleSaveApp}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
            >
              <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    {editingApp ? `Edit: ${editingApp.name}` : 'Publish New Android App'}
                  </h2>
                  {editingApp && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingApp(null);
                        setForm(INITIAL_FORM);
                      }}
                      className="text-xs font-medium text-slate-500 hover:text-slate-900"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">App Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. VoltNote Pro"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#01875F]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Package ID *</label>
                    <input
                      type="text"
                      required
                      value={form.packageName}
                      onChange={(e) => setForm({ ...form, packageName: e.target.value })}
                      placeholder="com.company.appname"
                      className="w-full px-3 py-2 text-sm font-mono-num border border-slate-200 rounded-lg focus:outline-none focus:border-[#01875F]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Developer *</label>
                    <input
                      type="text"
                      required
                      value={form.developer}
                      onChange={(e) => setForm({ ...form, developer: e.target.value })}
                      placeholder="AppVolt Labs"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#01875F]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Category Group *</label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value as AppCategoryGroup })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#01875F]"
                    >
                      <option value="Apps">Apps</option>
                      <option value="Games">Games</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Subcategory *</label>
                    <input
                      type="text"
                      required
                      value={form.subcategory}
                      onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                      placeholder="Productivity, Racing, Tools..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#01875F]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Version *</label>
                    <input
                      type="text"
                      required
                      value={form.version}
                      onChange={(e) => setForm({ ...form, version: e.target.value })}
                      placeholder="1.0.0"
                      className="w-full px-3 py-2 text-sm font-mono-num border border-slate-200 rounded-lg focus:outline-none focus:border-[#01875F]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">APK Size (MB) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={form.sizeMb}
                      onChange={(e) => setForm({ ...form, sizeMb: e.target.value })}
                      className="w-full px-3 py-2 text-sm font-mono-num border border-slate-200 rounded-lg focus:outline-none focus:border-[#01875F]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Min Android *</label>
                    <input
                      type="text"
                      required
                      value={form.minAndroid}
                      onChange={(e) => setForm({ ...form, minAndroid: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#01875F]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Age Rating</label>
                    <select
                      value={form.ageRating}
                      onChange={(e) => setForm({ ...form, ageRating: e.target.value as AgeRating })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                    >
                      {(['3+', '7+', '12+', '16+', '18+'] as const).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as AppStatus })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Short Tagline *</label>
                  <input
                    type="text"
                    required
                    value={form.tagline}
                    onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                    placeholder="Concise one-line value proposition..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#01875F]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Full Description *</label>
                  <textarea
                    rows={4}
                    required
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Detailed Play Store description..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#01875F]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">APK Download URL *</label>
                    <input
                      type="text"
                      required
                      value={form.apkUrl}
                      onChange={(e) => setForm({ ...form, apkUrl: e.target.value })}
                      placeholder="https://... or appvolt://packages/app.apk"
                      className="w-full px-3 py-2 text-sm font-mono-num border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Custom Icon URL (optional)
                    </label>
                    <input
                      type="text"
                      value={form.iconUrl}
                      onChange={(e) => setForm({ ...form, iconUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Icon Preset Style
                    </label>
                    <select
                      value={form.iconPreset}
                      onChange={(e) => setForm({ ...form, iconPreset: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                    >
                      {Object.entries(ICON_PRESETS).map(([key, val]) => (
                        <option key={key} value={key}>
                          {val.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Permissions (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={form.permissionsText}
                      onChange={(e) => setForm({ ...form, permissionsText: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">What&apos;s New</label>
                  <input
                    type="text"
                    value={form.whatsNew}
                    onChange={(e) => setForm({ ...form, whatsNew: e.target.value })}
                    placeholder="Release notes for this version..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>

                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="rounded border-slate-300 text-[#01875F]"
                  />
                  <span>Feature on Play Store Hero Banner</span>
                </label>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="submit"
                    disabled={savingApp}
                    className="px-6 py-2.5 rounded-lg bg-[#01875F] text-white text-sm font-semibold hover:bg-[#01704F] disabled:opacity-60 min-h-[42px]"
                  >
                    {savingApp
                      ? 'Saving to Firestore...'
                      : editingApp
                        ? 'Save Changes'
                        : 'Publish to Play Store'}
                  </button>
                </div>
              </div>

              {/* Live Store Card Preview */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Live Store Card Preview
                </h3>
                <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-start gap-3.5">
                    <AppIcon
                      app={{
                        name: form.name || 'App Name',
                        iconPreset: form.iconPreset,
                        iconUrl: form.iconUrl,
                      }}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-slate-900 truncate">
                        {form.name || 'Untitled App'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {form.developer || 'Developer Studio'}
                      </p>
                      <p className="text-xs text-slate-600 font-mono-num mt-1">
                        {form.subcategory} · {form.sizeMb || '0'} MB
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {form.tagline || 'Your app tagline preview appears here.'}
                  </p>
                </div>
              </div>
            </form>
          )}

          {/* TAB 4: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <form
                onSubmit={handleCreateCategory}
                className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 h-fit"
              >
                <h2 className="font-display text-base font-bold text-slate-900">Add Category</h2>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Category Name</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Education"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Group</label>
                  <select
                    value={newCatGroup}
                    onChange={(e) => setNewCatGroup(e.target.value as AppCategoryGroup)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Apps">Apps</option>
                    <option value="Games">Games</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Sort Order</label>
                  <input
                    type="number"
                    value={newCatOrder}
                    onChange={(e) => setNewCatOrder(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-slate-200 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-[#01875F] text-white text-sm font-semibold hover:bg-[#01704F]"
                >
                  Create Category
                </button>
              </form>

              <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Group</th>
                      <th className="px-4 py-3 text-right">Order</th>
                      <th className="px-4 py-3">State</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allCategories.map((cat) => (
                      <tr key={cat.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">{cat.name}</td>
                        <td className="px-4 py-3 text-slate-600">{cat.group}</td>
                        <td className="px-4 py-3 text-right font-mono-num">{cat.sortOrder}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleCategory(cat)}
                            className={`text-xs font-semibold ${
                              cat.active ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {cat.active ? 'Active' : 'Hidden'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search user name, email, or UID..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <span className="text-xs font-mono-num text-slate-500">
                  {filteredUsers.length} users
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Gmail / Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Downloads</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                          No registered users yet.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.uid} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {u.displayName}
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-mono-num text-xs">
                            {u.email || 'Private'}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold capitalize text-slate-700">
                            {u.role}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold">
                            <span
                              className={u.status === 'active' ? 'text-emerald-700' : 'text-red-600'}
                            >
                              {u.status === 'active' ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono-num">{u.downloadCount}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleUserAdmin(u)}
                                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-100"
                              >
                                {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUserBan(u)}
                                title={u.status === 'active' ? 'Suspend User' : 'Activate User'}
                                className={`p-1.5 rounded-lg border ${
                                  u.status === 'active'
                                    ? 'border-slate-200 text-red-600 hover:bg-red-50'
                                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                }`}
                              >
                                {u.status === 'active' ? (
                                  <UserX className="w-4 h-4" />
                                ) : (
                                  <UserCheck className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: DOWNLOAD LOGS */}
          {activeTab === 'downloads' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Application</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Version</th>
                    <th className="px-4 py-3 text-right">Size</th>
                    <th className="px-4 py-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allDownloads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        No download records logged yet.
                      </td>
                    </tr>
                  ) : (
                    allDownloads.map((dl) => (
                      <tr key={dl.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">{dl.appName}</td>
                        <td className="px-4 py-3 text-slate-600">{dl.userName}</td>
                        <td className="px-4 py-3 font-mono-num text-slate-600">v{dl.version}</td>
                        <td className="px-4 py-3 text-right font-mono-num">
                          {dl.sizeMb.toFixed(1)} MB
                        </td>
                        <td className="px-4 py-3 text-right font-mono-num text-xs text-slate-500">
                          {dl.createdAt?.toDate ? dl.createdAt.toDate().toLocaleString() : 'Now'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 7: REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-slate-700">Select App:</label>
                <select
                  value={selectedReviewAppId}
                  onChange={(e) => setSelectedReviewAppId(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  {allApps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                {visibleReviews.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    No reviews submitted for this app yet.
                  </div>
                ) : (
                  visibleReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-slate-900">{rev.authorName}</span>
                          <span className="text-amber-500 font-mono-num">{rev.rating} ★</span>
                          <span className="text-xs text-slate-400">· {rev.status}</span>
                        </div>
                        <p className="text-sm text-slate-700">{rev.comment}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleReviewVisibility(rev)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50"
                        >
                          {rev.status === 'visible' ? 'Hide' : 'Show'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev)}
                          className="p-1.5 text-red-600 rounded-lg border border-slate-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 8: ADMIN ACCOUNTS */}
          {activeTab === 'admins' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                <h2 className="font-display text-base font-bold text-slate-900">
                  Active Administrators
                </h2>
                <div className="divide-y divide-slate-100">
                  {adminsList.map((adm) => (
                    <div key={adm.uid} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {adm.displayName}
                        </p>
                        <p className="text-xs text-slate-500 font-mono-num truncate">{adm.email}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#01875F] capitalize shrink-0">
                        {adm.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                <h2 className="font-display text-base font-bold text-slate-900">
                  Authorize New Admin Gmail
                </h2>
                <form onSubmit={handleInviteAdmin} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@gmail.com"
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#01875F] text-white text-sm font-semibold hover:bg-[#01704F] shrink-0"
                  >
                    Authorize
                  </button>
                </form>

                {invitesList.length > 0 && (
                  <div className="divide-y divide-slate-100 pt-2">
                    {invitesList.map((inv) => (
                      <div key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                        <span className="font-mono-num text-slate-700">{inv.email}</span>
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold capitalize">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {inv.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
