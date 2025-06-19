import React from 'react';
import Link from 'next/link';
import { LogoIcon } from '@/components/ui/LogoIcon';
import UserButton from '@/components/ui/UserButton'; // Import our new UserButton

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="font-bold text-xl flex items-center gap-2">
              <LogoIcon />
              Interview IQ
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Dashboard</Link>
              {/* The "Results" link is now removed as requested */}
              <Link href="/analytics" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Analytics</Link>
            </div>
          </div>
          <div>
            {/* Replaced the static div with our dynamic UserButton component */}
            <UserButton />
          </div>
        </nav>
      </header>
      <main>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}