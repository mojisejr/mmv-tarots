'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from '@/lib/client/auth-client';
import { fetchBalance } from '@/lib/client/api';

type PageType = 'home' | 'submitted' | 'history' | 'result' | 'profile' | 'package';

interface NavigationContextType {
  isLoggedIn: boolean;
  isPending: boolean;
  isInitialLoading: boolean;
  stars: number | null;
  lastPredictionAt: string | null;
  currentPage: PageType;
  currentJobId: string | null;
  user: { id: string; name?: string | null; email?: string | null; image?: string | null } | null;
  setCurrentPage: (value: PageType) => void;
  setCurrentJobId: (jobId: string | null) => void;
  handleHomeClick: () => void;
  handleProfileClick: () => void;
  handleBackClick: () => void;
  handleLoginClick: () => void;
  handleLogoutClick: () => void;
  refreshBalance: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [stars, setStars] = useState<number | null>(null);
  const [lastPredictionAt, setLastPredictionAt] = useState<string | null>(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);

  // Sync currentPage with pathname
  useEffect(() => {
    if (pathname === '/') {
      setCurrentPage('home');
    } else if (pathname === '/history') {
      setCurrentPage('history');
    } else if (pathname.startsWith('/history/')) {
      setCurrentPage('result');
    } else if (pathname === '/profile') {
      setCurrentPage('profile');
    } else if (pathname === '/package') {
      setCurrentPage('package');
    } else if (pathname === '/submitted') {
      setCurrentPage('submitted');
    }
  }, [pathname]);

  const isLoggedIn = !!session?.user;
  const user = session?.user || null;

  // Fetch balance when logged in
  const refreshBalance = async () => {
    if (isLoggedIn) {
      setIsFetchingBalance(true);
      try {
        const data = await fetchBalance();
        setStars(data.stars);
        setLastPredictionAt(data.lastPredictionAt || null);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      } finally {
        setIsFetchingBalance(false);
      }
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      refreshBalance();
    } else {
      setStars(null);
      setLastPredictionAt(null);
    }
  }, [isLoggedIn]);

  const isInitialLoading = isPending || (isLoggedIn && stars === null);

  const handleHomeClick = () => {
    router.push('/');
    setCurrentPage('home');
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  const handleBackClick = () => {
    // Smart back navigation based on current page context
    switch (currentPage) {
      case 'result':
        // From detail page, go back to history list
        router.push('/history');
        setCurrentPage('history');
        break;
      case 'submitted':
      case 'history':
      case 'profile':
      case 'package':
        // From main sections, go to home
        router.push('/');
        setCurrentPage('home');
        break;
      default:
        // Fallback to browser back
        router.back();
    }
  };

  const handleLoginClick = async () => {
    // Redirect to Line Login using Better Auth Client
    try {
      await signIn.social({
        provider: 'line',
        callbackURL: '/', // Redirect back to home after login
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogoutClick = async () => {
    // Sign out via Better Auth Client
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.reload();
          },
        },
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <NavigationContext.Provider
      value={{
        isLoggedIn,
        isPending,
        isInitialLoading,
        stars,
        lastPredictionAt,
        currentPage,
        currentJobId,
        user,
        setCurrentPage,
        setCurrentJobId,
        handleHomeClick,
        handleProfileClick,
        handleBackClick,
        handleLoginClick,
        handleLogoutClick,
        refreshBalance,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}