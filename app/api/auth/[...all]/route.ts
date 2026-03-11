/**
 * Better Auth API Route Handler
 *
 * This catch-all route handles all Better Auth endpoints:
 * - /api/auth/signin/* - Provider sign-in entrypoint
 * - /api/auth/callback/* - Provider OAuth callback
 * - /api/auth/signout - Sign out
 * - /api/auth/session - Get session
 */

import { auth } from '@/lib/server/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
