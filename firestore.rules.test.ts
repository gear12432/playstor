/**
 * Security Rules Verification Suite (Dirty Dozen Adversarial Payloads)
 * Intended for @firebase/rules-unit-testing against Firestore Emulator.
 */

export const DIRTY_DOZEN_PAYLOADS = [
  {
    name: '1. Self-Admin Escalation on /users/{uid}',
    path: '/users/attacker_uid',
    operation: 'create',
    payload: {
      uid: 'attacker_uid',
      displayName: 'Attacker',
      role: 'admin',
      status: 'active',
      downloadCount: 0,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '2. Role Tampering on /users/{uid} update',
    path: '/users/user_1',
    operation: 'update',
    payload: { role: 'admin' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '3. Shadow Ghost Field Injection on /apps/{appId}',
    path: '/apps/app_1',
    operation: 'create',
    payload: {
      id: 'app_1',
      name: 'Legit App',
      isVerifiedByGoogle: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '4. Unverified Email Admin Spoofing',
    path: '/apps/app_2',
    operation: 'create',
    auth: { uid: 'spoof', token: { email: 'skjiyaul842@gmail.com', email_verified: false } },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '5. PII Blanket Read on /users/victim/private/info',
    path: '/users/victim/private/info',
    operation: 'get',
    auth: { uid: 'other_user', token: { email_verified: true } },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '6. Draft App Scraping on /apps/draft_app',
    path: '/apps/draft_app',
    operation: 'get',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '7. ID Poisoning with invalid characters',
    path: '/apps/invalid!@#id',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '8. Review Author Spoofing',
    path: '/apps/app_1/reviews/rev_1',
    operation: 'create',
    auth: { uid: 'user_2', token: { email_verified: true } },
    payload: {
      id: 'rev_1',
      appId: 'app_1',
      authorId: 'user_1',
      authorName: 'Impostor',
      rating: 5,
      comment: 'Spoofed review',
      status: 'visible',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '9. Orphaned Download Record referencing nonexistent appId',
    path: '/downloads/dl_1',
    operation: 'create',
    payload: {
      id: 'dl_1',
      appId: 'nonexistent_app',
      appName: 'Ghost App',
      userId: 'user_1',
      userName: 'User One',
      version: '1.0.0',
      sizeMb: 12,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '10. Download Count Manipulation (+99999)',
    path: '/apps/app_1',
    operation: 'update',
    auth: { uid: 'user_1', token: { email_verified: true } },
    payload: { downloadCount: 99999 },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '11. Timestamp Forgery (backdated createdAt)',
    path: '/apps/app_1/reviews/rev_2',
    operation: 'create',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '12. Unbounded Screenshots Array (>8 elements)',
    path: '/apps/app_1',
    operation: 'create',
    payload: {
      screenshots: new Array(20).fill('https://example.com/screen.png'),
    },
    expected: 'PERMISSION_DENIED',
  },
];
