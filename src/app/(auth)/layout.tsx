import React from 'react';
import Link from 'next/link';
import { LogoIcon } from '@/components/ui/LogoIcon'; // Import our new icon

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // Updated background to pure black and added padding for better spacing
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <Link href="/" className="inline-flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <LogoIcon className="w-8 h-8"/>
              <span className="font-bold text-xl text-white">Interview IQ</span>
            </Link>
        </div>
        {children}
      </div>
    </div>
  );
}