'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VideoSearch } from '@/components/VideoSearch';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { createClient } from '@/lib/supabase/client';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Global keyboard shortcut for search (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      // Escape to close search
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, isAuthenticated]);

  return (
    <html lang="de">
      <body>
        <nav className="sticky top-0 z-50 glass-effect border-b border-border shadow-modern">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center w-full justify-between">
                <div className="flex">
                  <Link href={isAuthenticated ? "/feed" : "/"} className="flex items-center gap-3 px-2 py-2">
                    <Image
                      src="/DA-LOGO-OrangeWhite.svg"
                      alt="Digital Apes Logo"
                      width={40}
                      height={40}
                      className="h-10 w-auto"
                      priority
                    />
                    <span className="text-xl font-bold gradient-text">QuietTube</span>
                  </Link>
                  {isAuthenticated && (
                    <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                      <Link
                        href="/feed"
                        className="inline-flex items-center px-1 pt-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                      >
                        Feed
                      </Link>
                      <Link
                        href="/channels"
                        className="inline-flex items-center px-1 pt-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                      >
                        Kanäle
                      </Link>
                      <Link
                        href="/saved"
                        className="inline-flex items-center px-1 pt-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                      >
                        Gespeichert
                      </Link>
                      <Link
                        href="/import"
                        className="inline-flex items-center px-1 pt-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                      >
                        Import
                      </Link>
                      <Link
                        href="/admin"
                        className="inline-flex items-center px-1 pt-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                      >
                        Admin
                      </Link>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {isAuthenticated && (
                    <button
                      onClick={() => setSearchOpen(true)}
                      className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors border border-border"
                      title="Videos durchsuchen (Ctrl+K)"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-xs">Suchen</span>
                      <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 bg-background border rounded text-xs font-mono">
                        ⌘K
                      </kbd>
                    </button>
                  )}
                  <ThemeToggle />
                  {isAuthenticated && (
                    <SignOutButton className="hidden sm:flex rounded-md px-3 py-2 text-sm border border-border hover:bg-accent/50 transition-colors" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        {isAuthenticated && (
          <VideoSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        )}
      </body>
    </html>
  );
}
