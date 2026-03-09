'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from '@/lib/client/auth-client';
import { fetchBalance } from '@/lib/client/api';

type PageType = 'home' | 'submitted' | 'history' | 'result' | 'profile' | 'package';

interface Concentration {
  active: number;
  total: number;
  nextRefillIn: number;
}

interface NavigationContextType {
  isLoggedIn: boolean;
  isPending: boolean;
  isInitialLoading: boolean;
  isLoggingIn: boolean; // Added
  stars: number | null;
  lastPredictionAt: string | null;
  concentration: Concentration | null;
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

export function buildLiffGatewayPath(currentPathname: string, currentSearch: string): string {
  const pathname = currentPathname || '/';
  const search = currentSearch || '';
  const state = `${pathname}${search}`;
  const params = new URLSearchParams();
  params.set('mmv_next', state);
  return `/liff?${params.toString()}`;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [stars, setStars] = useState<number | null>(null);
  const [lastPredictionAt, setLastPredictionAt] = useState<string | null>(null);
  const [concentration, setConcentration] = useState<Concentration | null>(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Added state

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
      // Don't set isFetchingBalance during polling to avoid UI flickering
      // Only set it if explicitly triggered (future implementation might distinguish)
      // For now we keep it simple or maybe we don't need loading state for background refresh
      // Let's keep isFetchingBalance for manual triggers if we add a button later
      // But for polling we might want to skip it.
      
      try {
        const data = await fetchBalance();
        setStars(data.stars);
        setLastPredictionAt(data.lastPredictionAt || null);
        if (data.concentration) {
          setConcentration(data.concentration);
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    }
  };

  // Polling for concentration refill
  useEffect(() => {
    if (!isLoggedIn || !concentration) return;

    // Only poll if slots are not full
    if (concentration.active < concentration.total) {
      const intervalId = setInterval(() => {
        refreshBalance();
      }, 10000); // Check every 10 seconds

      return () => clearInterval(intervalId);
    }
  }, [isLoggedIn, concentration?.active, concentration?.total]);

  useEffect(() => {
    if (isLoggedIn) {
      setIsFetchingBalance(true);
      refreshBalance().finally(() => setIsFetchingBalance(false));
    } else {
      setStars(null);
      setLastPredictionAt(null);
      setConcentration(null);
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
    try {
      setIsLoggingIn(true);
      const nextPath = buildLiffGatewayPath(window.location.pathname, window.location.search);
      router.push(nextPath);
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoggingIn(false);
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
        isLoggingIn,
        stars,
        lastPredictionAt,
        concentration,
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