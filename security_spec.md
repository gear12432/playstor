# Security Specification — AppVolt Play Store & Admin Panel

## 1. Data Invariants
1. **Admin Authority**: Only verified administrators in `/admins/{uid}` or the bootstrapped admin (`skjiyaul842@gmail.com` with `email_verified == true`) can create, edit, suspend, or delete `/apps/{appId}` and `/categories/{categoryId}`, ban/promote users, or moderate any review.
2. **PII Isolation**: User email addresses and auth provider metadata are stored exclusively in `/users/{userId}/private/info` and are strictly readable only by the owning user or an admin. `/users/{userId}` contains zero PII.
3. **Self-Assigned Role Prevention**: On `/users/{userId}` creation, `role` MUST be `'user'` and `status` MUST be `'active'`, and `uid` MUST match `request.auth.uid`. Users cannot modify their own `role` or `status`.
4. **Verified Identity**: All authenticated writes require `request.auth != null && request.auth.token.email_verified == true`.
5. **Immutable Audit & Ownership Fields**: `createdAt`, `createdBy`, `authorId`, `userId`, and `uid` cannot be altered after creation; `createdAt == request.time` on create and `updatedAt == request.time` on create/update.
6. **Bounded Arrays & Strings**: Every string enforces explicit `.size()` bounds; `screenshots` (max 8 items) and `permissions` (max 12 items) enforce array size and element type checks.
7. **Safe List Queries**: No `allow list` uses `isSignedIn()` alone or `get()` calls. Catalog `list` enforces `resource.data.status == 'published' || isAdmin()`, and user-owned collections enforce `resource.data.userId == request.auth.uid || isAdmin()`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Admin Escalation**: Creating `/users/u1` with `{ role: 'admin', ... }` as non-admin -> `PERMISSION_DENIED`.
2. **Role Tampering on Update**: Updating `/users/u1` with `{ role: 'admin' }` -> `PERMISSION_DENIED`.
3. **Shadow Ghost Field**: Creating `/apps/a1` or `/users/u1` with extra `{ isVerified: true }` -> `PERMISSION_DENIED`.
4. **Unverified Email Spoofing**: Admin email `skjiyaul842@gmail.com` with `email_verified: false` writing `/apps/a1` -> `PERMISSION_DENIED`.
5. **PII Blanket Read**: User `u2` reading `/users/u1/private/info` -> `PERMISSION_DENIED`.
6. **Draft App Scraping**: Unauthenticated user or regular user listing/reading `/apps/draft1` where `status == 'draft'` -> `PERMISSION_DENIED`.
7. **ID Poisoning**: Creating `/apps/<200-char-invalid-id!@#>` -> `PERMISSION_DENIED`.
8. **Review Author Spoofing**: User `u2` creating `/apps/a1/reviews/r1` with `authorId: 'u1'` -> `PERMISSION_DENIED`.
9. **Orphaned Download Record**: Creating `/downloads/d1` referencing nonexistent `appId: 'missing-app'` -> `PERMISSION_DENIED`.
10. **Download Count Manipulation**: Regular user updating `/apps/a1` with `downloadCount: 999999` (jumping more than +1) or changing `apkUrl` -> `PERMISSION_DENIED`.
11. **Timestamp Forgery**: Creating `/apps/a1/reviews/r1` with backdated `createdAt` instead of `request.time` -> `PERMISSION_DENIED`.
12. **Unbounded Array Injection**: Creating `/apps/a1` with 25 screenshots or non-string screenshot elements -> `PERMISSION_DENIED`.
