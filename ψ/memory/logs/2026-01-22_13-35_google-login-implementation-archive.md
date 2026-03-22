# Snapshot: Google Login Implementation Archive (Hold)

**Time**: 2026-01-22 13:35
**Status**: ⏸️ **Hold** (Verified Functional but Pending UX Fix)
**Branch**: `feat/google-login`
**Project**: `projects/mmv-tarots`

## 📉 Reason for Hold
Tested successfully for function, but encountered a **"Loading Hang"** issue (UX) where the login state might get stuck or conflict with the loading animation flow. Decision made to pause merge until this specific UX regression is resolved, to avoid introducing "jank" into `staging`.

## 💾 Implementation Details (How to Restore)
Everything is committed in the branch `feat/google-login`. To resume, simple `git checkout feat/google-login`.

### 1. Backend (`lib/server/auth.ts`)
- **Google Provider**: Added `google` to `socialProviders` config.
- **Account Linking**: Enabled `account.accountLinking` to merge users by email (LINE + Google).
- **Profile Mapping**:
  ```typescript
  mapProfileToUser: (profile) => ({
    name: profile.name,
    image: profile.picture,
    email: profile.email,
  })
  ```

### 2. Provider Logic (`lib/client/providers/navigation-provider.tsx`)
- **Granular Loading**:
  - Replaced `isLoggingIn` (boolean) with `loggingProvider` ('line' | 'google' | null).
  - Updated `handleLoginClick` to accept provider argument.
- **Referral Continuity**: Preserved `ref` param forwarding in callback URL.

### 3. UI (`app/page.tsx`)
- **Vertical Stack**:
  - Top: Google Button (Glassmorphism White)
  - Divider: "or"
  - Bottom: LINE Button (Glassmorphism Green)
- **Code Snippet**:
  ```tsx
  <GlassButton 
    onClick={() => handleLoginClick('google')}
    isLoading={loggingProvider === 'google'}
    // ... classes
  >
  ```

## 📝 Next Actions (When Resuming)
1.  Checkout `feat/google-login`.
2.  Investigate `better-auth` client state management for `isLoggingIn` freeze.
3.  Consider adding a timeout/reset for the loading state.

## 🏷️ Tags
`mmv-tarots` `auth` `google-login` `archive` `branch-hold`
