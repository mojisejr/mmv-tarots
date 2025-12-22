/**
 * Better Auth Client Configuration
 * 
 * This file provides client-side hooks and utilities for authentication.
 * Use these hooks in React components to access authentication state.
 */

'use client';

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',
});

export const {
  useSession,
  signIn,
  signOut,
} = authClient;
