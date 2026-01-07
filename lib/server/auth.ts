/**
 * Better Auth Server Configuration
 * 
 * This file configures Better Auth for server-side authentication
 * using Prisma adapter and Line Login provider.
 */

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { db } from './db';
import { cookies } from 'next/headers';

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const cookieStore = await cookies();
            const referralCode = cookieStore.get('mmv_ref')?.value;

            if (referralCode) {
              const referrer = await db.user.findUnique({
                where: { referralCode },
              });

              if (referrer && referrer.id !== user.id) {
                // Update relationships and grant rewards in a transaction
                await db.$transaction([
                  // Link the new user to the referrer and give 5 starter stars
                  db.user.update({
                    where: { id: user.id },
                    data: { 
                      referredById: referrer.id,
                      stars: { increment: 5 } // Bonus for being referred
                    },
                  }),
                  // Reward the referrer with 10 stars
                  db.user.update({
                    where: { id: referrer.id },
                    data: {
                      stars: { increment: 10 }
                    },
                  }),
                  // Optional: Create credit transactions for history log (omitted for now to keep simple)
                ]);
              }
            }
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
