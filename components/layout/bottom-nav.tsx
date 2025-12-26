'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, User, Sparkles } from 'lucide-react';
import { useNavigation } from '@/lib/client/providers/navigation-provider';

/**
 * Bottom Navigation Bar for Mobile
 * Optimized for one-handed use (Thumb Zone)
 * Features:
 * - Glassmorphism design
 * - Active state indicators
 * - Safe area awareness
 * - Hidden on /submitted page for immersive experience
 */
export function BottomNav() {
  const pathname = usePathname();
  const { user, isLoggedIn } = useNavigation();

  // Hide BottomNav on submitted (waiting) page
  if (pathname === '/submitted') {
    return null;
  }

  const navItems = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'History', icon: History, href: '/history' },
    { label: 'Package', icon: Sparkles, href: '/package' },
    { label: 'Profile', icon: User, href: '/profile' },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-4 mb-4">
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl px-6 py-3 flex justify-between items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isProfile = item.href === '/profile';
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                  isActive ? 'text-[var(--primary)] scale-110' : 'text-white/40 hover:text-white/70'
                }`}
              >
                <div className={`p-2 rounded-xl ${isActive ? 'bg-[var(--primary)]/10' : ''}`}>
                  {isProfile && isLoggedIn && user?.image ? (
                    <img 
                      src={user.image} 
                      alt="Profile" 
                      className={`w-6 h-6 rounded-full border ${isActive ? 'border-[var(--primary)]' : 'border-white/20'}`}
                    />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <span className="text-[10px] font-medium uppercase tracking-widest">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      {/* Safe Area Spacer */}
      <div className="h-[env(safe-area-inset-bottom)] bg-transparent" />
    </nav>
  );
}
