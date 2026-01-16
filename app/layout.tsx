import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mini YouTube',
  description: 'RSS-basiertes Video Feed System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <nav className="sticky top-0 z-50 glass-effect border-b border-border shadow-modern">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center w-full justify-between">
                <div className="flex">
                  <Link href="/feed" className="flex items-center px-2 py-2 text-xl font-bold gradient-text">
                    Mini YouTube
                  </Link>
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
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
