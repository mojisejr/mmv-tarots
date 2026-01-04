'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, History, Sparkles, LogOut, ChevronDown } from 'lucide-react';

interface ProfileDropdownProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  onLogout: () => void;
}

export function ProfileDropdown({ user, onLogout }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const menuItems = [
    { label: 'Profile', icon: User, href: '/profile' },
    { label: 'History', icon: History, href: '/history' },
    { label: 'Package', icon: Sparkles, href: '/package' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-black/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10 border border-transparent hover:border-black/5"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {user?.image ? (
          <img
            src={user.image}
            alt={user.name || 'User'}
            className="w-8 h-8 rounded-full border-2 border-primary/20"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center border-2 border-white/20">
            <User className="w-5 h-5 text-foreground" />
          </div>
        )}
        <span className="hidden lg:block text-sm font-medium text-foreground max-w-[100px] truncate">
          {user?.name || 'User'}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl border border-primary/20 rounded-xl shadow-warm py-2 z-50 transform origin-top-right animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-3 border-b border-primary/10 mb-1">
            <p className="text-sm font-medium text-foreground truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          
          <div className="space-y-1 px-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-black/5 rounded-lg transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            
            <div className="h-px bg-primary/10 my-1 mx-2" />
            
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
