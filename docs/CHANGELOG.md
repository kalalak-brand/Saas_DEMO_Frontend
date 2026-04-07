# Changelog

All notable changes to this project will be documented in this file.

---

## [2026-03-30] — feat(push): Web Push Service Worker for guest notifications

- **Type:** feat
- **Scope:** Guest Experience, Push Notifications
- **Description:** Implemented frontend Service Worker and push subscription utility to enable native browser push notifications for guests. When a guest submits a service request, they are offered a "Get notified when ready" button. Clicking it registers a service worker, requests notification permission, subscribes via PushManager with VAPID keys, and sends the subscription to the backend. When staff later updates the request status, the guest receives a native OS notification even if the browser tab is closed.
- **Files Changed:**
  - [NEW] `public/sw.js` — Service Worker handling push events and notification clicks
  - [NEW] `src/utils/pushSubscription.ts` — Push subscription lifecycle utility
  - [MODIFY] `src/pages/review/ServiceRequestForm.tsx` — Push opt-in button on success screen
  - [MODIFY] `.env` — Added VITE_PUBLIC_WEB_PUSH_KEY for browser VAPID auth
- **Breaking Changes:** None. Push is opt-in; existing functionality unchanged.

---

## [2026-03-25] — refactor(frontend): Rules compliance audit fixes

- **Type:** refactor
- **Scope:** Frontend architecture
- **Description:** Ensured all frontend components comply with rules.md: complexity comments present, no god files (>300 lines), proper TypeScript types, accessibility attributes on interactive elements.

---

## [2026-03-24] — feat(room-qr): Room-specific QR codes with auto-filled room numbers

- **Type:** feat
- **Scope:** QR Codes, Guest Experience
- **Description:** Added room-specific QR codes that embed the room number in the URL. When scanned, room number is pre-filled and locked in the service request form.
- **Files Changed:**
  - [NEW] `src/pages/management/RoomQRGenerator.tsx`
  - [MODIFY] `src/pages/review/GuestLandingPage.tsx` — room badge, room-aware navigation
  - [MODIFY] `src/pages/review/ServiceRequestForm.tsx` — locked room from QR
  - [MODIFY] `src/App.tsx` — 6 room routes + management route
  - [MODIFY] `src/pages/management/ManagementLayout.tsx` — sidebar nav

---

## [2026-03-23] — feat(service): Service analytics + feedback + dashboard (Phases 3-5)

- **Type:** feat
- **Scope:** Management, Analytics, Guest Experience
- **Description:** Service request staff dashboard with live Socket.IO updates, post-service feedback with star rating + Google Review redirect, and service analytics with department performance charts.
- **Files Changed:**
  - [NEW] `src/pages/management/ServiceRequestsPage.tsx`
  - [NEW] `src/pages/management/ServiceAnalyticsPage.tsx`
  - [NEW] `src/pages/review/PostServiceFeedback.tsx`

---

## [2026-03-22] — feat(guest): QR landing page + service request form (Phase 2)

- **Type:** feat
- **Scope:** Guest Experience, Frontend
- **Description:** Guest-facing QR landing page and service request form with quick-select service types, room input, and success screen.
- **Files Changed:**
  - [NEW] `src/pages/review/GuestLandingPage.tsx`
  - [NEW] `src/pages/review/ServiceRequestForm.tsx`
  - [NEW] `src/stores/serviceRequestStore.ts`
  - [MODIFY] `src/App.tsx`
