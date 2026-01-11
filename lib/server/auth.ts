/**
 * Better Auth Server Configuration
 * 
 * This file configures Better Auth for server-side authentication
 * using Prisma adapter and Line Login provider.
 */

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { db } from './db';
import { cookies, headers } from 'next/headers';
import { referralService } from './services/referral-service';

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),

  user: {
    additionalFields: {
      referralCode: {
        type: 'string',
        required: false,
      },
      stars: {
        type: 'number',
        required: false,
      },
      referredById: {
        type: 'string',
        required: false,
      },
    },
  },
  
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const cookieStore = await cookies();
            const referralCode = cookieStore.get('mmv_ref')?.value;

            const headerStore = await headers();
            const forwardedFor = headerStore.get('x-forwarded-for');
            const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

            // Use the new robust service (No immediate reward)
            await referralService.processReferralSignup(user as any, referralCode, ip);
          } catch (error) {
            console.error('Error in referral hook:', error);
            // Non-blocking catch to ensure user creation succeeds even if referral fails
          }
        },
      },
    },
  },
  
  emailAndPassword: {
    enabled: false, // Disable email/password authentication
  },
  
  socialProviders: {
    line: {
      clientId: process.env.LINE_CLIENT_ID as string,
      clientSecret: process.env.LINE_CLIENT_SECRET as string,
      redirectURI: process.env.LINE_REDIRECT_URI,
      mapProfileToUser: (profile) => {
        return {
          name: profile.name || 'LINE User',
          image: profile.picture,
          email: profile.email || `${profile.sub || 'unknown'}@mimivibe.com`,
        };
      },
    },
  },
  
  secret: process.env.BETTER_AUTH_SECRET as string,
  
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
