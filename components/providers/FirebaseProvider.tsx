'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, googleProvider, testFirestoreConnection } from '@/lib/firebase';
import { handleFirestoreError, logFirestoreError, OperationType } from '@/lib/firestore-errors';
import { triggerApkFileDownload } from '@/lib/apk-downloader';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  type LibraryItem,
  type StoreApp,
  type StoreCategory,
  type UserPublic,
} from '@/lib/types';

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  userProfile: UserPublic | null;
  isAdmin: boolean;
  adminReady: boolean;
  apps: StoreApp[];
  appsLoading: boolean;
  storeError: string | null;
  categories: StoreCategory[];
  libraryMap: Record<string, LibraryItem>;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
  ensureUserProfile: (u: User) => Promise<void>;
  syncAdminRecord: (u: User) => Promise<boolean>;
  recordAppDownload: (app: StoreApp) => Promise<void>;
  toggleWishlist: (app: StoreApp) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function emailToInviteKey(email: string): string {
  return email.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserPublic | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminReady, setAdminReady] = useState(false);

  const [apps, setApps] = useState<StoreApp[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [libraryMap, setLibraryMap] = useState<Record<string, LibraryItem>>({});

  useEffect(() => {
    testFirestoreConnection();
  }, []);

  const ensureUserProfile = useCallback(async (firebaseUser: User) => {
    if (!firebaseUser.emailVerified) return;

    const userRef = doc(db, 'users', firebaseUser.uid);
    const privateRef = doc(db, 'users', firebaseUser.uid, 'private', 'info');
    const safeName = (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Play User').slice(0, 80);
    const safePhoto = firebaseUser.photoURL ? firebaseUser.photoURL.slice(0, 500) : undefined;

    try {
      const existingSnap = await getDoc(userRef);
      if (!existingSnap.exists()) {
        const publicPayload: Record<string, unknown> = {
          uid: firebaseUser.uid,
          displayName: safeName,
          role: 'user',
          status: 'active',
          downloadCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (safePhoto) publicPayload.photoURL = safePhoto;
        await setDoc(userRef, publicPayload);
      } else {
        const updatePayload: Record<string, unknown> = {
          displayName: safeName,
          updatedAt: serverTimestamp(),
        };
        if (safePhoto) updatePayload.photoURL = safePhoto;
        await updateDoc(userRef, updatePayload);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
    }

    try {
      const privateSnap = await getDoc(privateRef);
      const email = (firebaseUser.email || 'unknown@appvolt.local').slice(0, 160);
      const provider = (firebaseUser.providerData[0]?.providerId || 'google.com').slice(0, 40);
      if (!privateSnap.exists()) {
        await setDoc(privateRef, {
          uid: firebaseUser.uid,
          email,
          provider,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(privateRef, {
          email,
          provider,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}/private/info`);
    }
  }, []);

  const syncAdminRecord = useCallback(async (firebaseUser: User): Promise<boolean> => {
    if (!firebaseUser.emailVerified || !firebaseUser.email) {
      setIsAdmin(false);
      setAdminReady(true);
      return false;
    }

    const adminRef = doc(db, 'admins', firebaseUser.uid);
    try {
      const adminSnap = await getDoc(adminRef);
      if (adminSnap.exists()) {
        setIsAdmin(true);
        setAdminReady(true);
        return true;
      }

      const lowerEmail = firebaseUser.email.toLowerCase();
      if (lowerEmail === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
        await setDoc(adminRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email.slice(0, 160),
          displayName: (firebaseUser.displayName || 'Store Super Admin').slice(0, 80),
          role: 'superadmin',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setIsAdmin(true);
        setAdminReady(true);
        return true;
      }

      const inviteKey = emailToInviteKey(lowerEmail);
      const inviteRef = doc(db, 'admin_invites', inviteKey);
      const inviteSnap = await getDoc(inviteRef);
      if (inviteSnap.exists()) {
        await setDoc(adminRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email.slice(0, 160),
          displayName: (firebaseUser.displayName || 'Store Admin').slice(0, 80),
          role: 'admin',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        if (inviteSnap.data()?.status === 'pending') {
          await updateDoc(inviteRef, {
            status: 'accepted',
            updatedAt: serverTimestamp(),
          });
        }
        setIsAdmin(true);
        setAdminReady(true);
        return true;
      }

      setIsAdmin(false);
      setAdminReady(true);
      return false;
    } catch {
      const isBootstrap =
        firebaseUser.emailVerified &&
        firebaseUser.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
      setIsAdmin(isBootstrap);
      setAdminReady(true);
      return isBootstrap;
    }
  }, []);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        setUserProfile(null);
        setIsAdmin(false);
        setAdminReady(true);
        setLibraryMap({});
        return;
      }

      setAdminReady(false);
      if (nextUser.emailVerified) {
        ensureUserProfile(nextUser).catch((err) => console.error(err));
      }
      await syncAdminRecord(nextUser);
    });

    return () => unsub();
  }, [ensureUserProfile, syncAdminRecord]);

  // Real-time user profile & library when signed in
  useEffect(() => {
    if (!user) return;

    const profileRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(
      profileRef,
      (snap) => {
        if (snap.exists()) {
          setUserProfile(snap.data() as UserPublic);
        }
      },
      (error) => {
        logFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    );

    const libraryRef = collection(db, 'users', user.uid, 'library');
    const unsubLibrary = onSnapshot(
      libraryRef,
      (snap) => {
        const nextMap: Record<string, LibraryItem> = {};
        snap.docs.forEach((d) => {
          const data = d.data() as LibraryItem;
          nextMap[data.appId] = data;
        });
        setLibraryMap(nextMap);
      },
      (error) => {
        logFirestoreError(error, OperationType.LIST, `users/${user.uid}/library`);
      }
    );

    return () => {
      unsubProfile();
      unsubLibrary();
    };
  }, [user]);

  // Real-time published apps catalog
  useEffect(() => {
    const q = query(collection(db, 'apps'), where('status', '==', 'published'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as StoreApp);
        list.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
        setApps(list);
        setStoreError(null);
        setAppsLoading(false);
      },
      (error) => {
        setAppsLoading(false);
        const msg = logFirestoreError(error, OperationType.LIST, 'apps');
        setStoreError(msg);
      }
    );

    return () => unsub();
  }, []);

  // Real-time active categories
  useEffect(() => {
    const q = query(collection(db, 'categories'), where('active', '==', true));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as StoreCategory);
        list.sort((a, b) => a.sortOrder - b.sortOrder);
        setCategories(list);
      },
      (error) => {
        logFirestoreError(error, OperationType.LIST, 'categories');
      }
    );

    return () => unsub();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    if (cred.user.emailVerified) {
      await ensureUserProfile(cred.user);
      await syncAdminRecord(cred.user);
    }
    return cred.user;
  }, [ensureUserProfile, syncAdminRecord]);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  const recordAppDownload = useCallback(
    async (app: StoreApp) => {
      triggerApkFileDownload(app);

      if (!user || !user.emailVerified) return;

      const downloadId = `dl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const appRef = doc(db, 'apps', app.id);
      const downloadRef = doc(db, 'downloads', downloadId);
      const libRef = doc(db, 'users', user.uid, 'library', app.id);
      const userRef = doc(db, 'users', user.uid);

      try {
        const [appSnap, libSnap, userSnap] = await Promise.all([
          getDoc(appRef),
          getDoc(libRef),
          getDoc(userRef),
        ]);

        if (!appSnap.exists()) return;
        const currentDownloads = Number(appSnap.data().downloadCount || 0);
        const batch = writeBatch(db);

        batch.update(appRef, {
          downloadCount: currentDownloads + 1,
          updatedAt: serverTimestamp(),
        });

        batch.set(downloadRef, {
          id: downloadId,
          appId: app.id,
          appName: app.name.slice(0, 80),
          userId: user.uid,
          userName: (user.displayName || user.email?.split('@')[0] || 'Play User').slice(0, 80),
          version: app.version.slice(0, 32),
          sizeMb: Number(app.sizeMb),
          createdAt: serverTimestamp(),
        });

        if (libSnap.exists()) {
          batch.update(libRef, {
            appName: app.name.slice(0, 80),
            installed: true,
            installedVersion: app.version.slice(0, 32),
            updatedAt: serverTimestamp(),
          });
        } else {
          batch.set(libRef, {
            appId: app.id,
            userId: user.uid,
            appName: app.name.slice(0, 80),
            installed: true,
            wishlisted: false,
            installedVersion: app.version.slice(0, 32),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        if (userSnap.exists() && userSnap.data().status === 'active') {
          const userDownloads = Number(userSnap.data().downloadCount || 0);
          batch.update(userRef, {
            downloadCount: userDownloads + 1,
            updatedAt: serverTimestamp(),
          });
        }

        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `downloads/${downloadId}`);
      }
    },
    [user]
  );

  const toggleWishlist = useCallback(
    async (app: StoreApp) => {
      if (!user || !user.emailVerified) {
        await signInWithGoogle();
        return;
      }

      const libRef = doc(db, 'users', user.uid, 'library', app.id);
      try {
        const snap = await getDoc(libRef);
        if (snap.exists()) {
          const current = snap.data() as LibraryItem;
          await updateDoc(libRef, {
            appName: app.name.slice(0, 80),
            wishlisted: !current.wishlisted,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(libRef, {
            appId: app.id,
            userId: user.uid,
            appName: app.name.slice(0, 80),
            installed: false,
            wishlisted: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/library/${app.id}`);
      }
    },
    [user, signInWithGoogle]
  );

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        userProfile,
        isAdmin,
        adminReady,
        apps,
        appsLoading,
        storeError,
        categories,
        libraryMap,
        signInWithGoogle,
        signOutUser,
        ensureUserProfile,
        syncAdminRecord,
        recordAppDownload,
        toggleWishlist,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return ctx;
}
