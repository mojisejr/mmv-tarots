/**
 * Better Auth API Route Handler
 * 
 * This catch-all route handles all Better Auth endpoints:
 * - /api/auth/signin/line - Line Login
 * - /api/auth/callback/line - Line OAuth callback
 * - /api/auth/signout - Sign out
 * - /api/auth/session - Get session
 */

import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
