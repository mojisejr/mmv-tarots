/**
 * Better Auth Server Configuration
 * 
 * This file configures Better Auth for server-side authentication
 * using Prisma adapter and Line Login provider.
 */

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { db } from './db';

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  
  emailAndPassword: {
    enabled: false, // Disable email/password authentication
  },
  
  socialProviders: {
    line: {
      clientId: process.env.LINE_CLIENT_ID || '',
      clientSecret: process.env.LINE_CLIENT_SECRET || '',
      redirectURI: process.env.LINE_REDIRECT_URI || '',
    },
  },
  
  secret: process.env.BETTER_AUTH_SECRET || '',
  
  advanced: {
    cookiePrefix: 'mmv_auth',
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },
});

export type Session = typeof auth.$Infer.Session;
