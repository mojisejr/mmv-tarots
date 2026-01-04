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
  const { user, isLoggedIn, currentPage, setCurrentPage } = useNavigation();

  // Hide BottomNav on submitted (waiting) page or result page for immersive experience
  if (pathname === '/submitted' || currentPage === 'result') {
    return null;
  }

  const navItems = [
    { label: 'Home', icon: Home, href: '/', type: 'home' as const },
    { label: 'History', icon: History, href: '/history', type: 'history' as const },
    { label: 'Package', icon: Sparkles, href: '/package', type: 'package' as const },
    { label: 'Profile', icon: User, href: '/profile', type: 'profile' as const },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-4 mb-4">
        <div className="bg-white/80 backdrop-blur-2xl border border-white/40 rounded-[2rem] shadow-warm px-6 py-3 flex justify-between items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isProfile = item.href === '/profile';
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setCurrentPage(item.type)}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                  isActive ? 'text-[var(--primary-foreground)] scale-110' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className={`p-2 rounded-xl ${isActive ? 'bg-[var(--primary)]' : ''}`}>
                  {isProfile && isLoggedIn && user?.image ? (
                    <img 
                      src={user.image} 
                      alt="Profile" 
                      className={`w-6 h-6 rounded-full border ${isActive ? 'border-[var(--primary-foreground)]' : 'border-white/20'}`}
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
