import type { Timestamp } from 'firebase/firestore';

export type AppCategoryGroup = 'Apps' | 'Games';
export type AppStatus = 'published' | 'draft' | 'suspended';
export type AgeRating = '3+' | '7+' | '12+' | '16+' | '18+';

export const APP_CONSTRAINTS = {
  ID_REGEX: /^[a-zA-Z0-9_\-]+$/,
  PACKAGE_REGEX: /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/,
  NAME_MIN: 2,
  NAME_MAX: 80,
  DEVELOPER_MIN: 2,
  DEVELOPER_MAX: 80,
  TAGLINE_MIN: 4,
  TAGLINE_MAX: 140,
  DESCRIPTION_MIN: 10,
  DESCRIPTION_MAX: 4000,
  WHATS_NEW_MAX: 1500,
  SUBCATEGORY_MIN: 2,
  SUBCATEGORY_MAX: 40,
  VERSION_MAX: 32,
  ICON_URL_MAX: 500,
  APK_URL_MAX: 800,
  MAX_SCREENSHOTS: 8,
  MAX_PERMISSIONS: 12,
  COMMENT_MIN: 2,
  COMMENT_MAX: 1000,
} as const;

export const BOOTSTRAPPED_ADMIN_EMAIL = 'skjiyaul842@gmail.com';

export interface StoreApp {
  id: string;
  name: string;
  packageName: string;
  developer: string;
  tagline: string;
  description: string;
  whatsNew?: string;
  category: AppCategoryGroup;
  subcategory: string;
  version: string;
  sizeMb: number;
  minAndroid: string;
  ageRating: AgeRating;
  iconUrl?: string;
  iconPreset: string;
  apkUrl: string;
  screenshots: string[];
  permissions: string[];
  featured: boolean;
  status: AppStatus;
  downloadCount: number;
  ratingAvg: number;
  reviewCount: number;
  createdBy: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface AppReview {
  id: string;
  appId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  rating: number;
  comment: string;
  status: 'visible' | 'hidden';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface StoreCategory {
  id: string;
  name: string;
  group: AppCategoryGroup;
  sortOrder: number;
  active: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface UserPublic {
  uid: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin';
  status: 'active' | 'banned';
  downloadCount: number;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface UserPrivate {
  uid: string;
  email: string;
  provider: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface LibraryItem {
  appId: string;
  userId: string;
  appName: string;
  installed: boolean;
  wishlisted: boolean;
  installedVersion?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface DownloadRecord {
  id: string;
  appId: string;
  appName: string;
  userId: string;
  userName: string;
  version: string;
  sizeMb: number;
  createdAt?: Timestamp | null;
}

export interface AdminRecord {
  uid: string;
  email: string;
  displayName: string;
  role: 'superadmin' | 'admin';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface AdminInvite {
  id: string;
  email: string;
  invitedBy: string;
  status: 'pending' | 'accepted';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}
