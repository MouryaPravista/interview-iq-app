import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogoIcon } from '@/components/ui/LogoIcon';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white grid grid-cols-1 md:grid-cols-2">
      {/* Left Column (Image) - Hidden on mobile */}
      <div className="relative hidden md:flex flex-col items-center justify-end p-12 bg-[#0a0a0a]">
        {/* Background Image */}
        <Image
          src="/1.jpg"
          alt="Person practicing for a job interview at night"
          layout="fill"
          objectFit="cover"
          priority
        />
        {/* Overlay with Text */}
        <div className="relative z-10 text-left w-full">
          <h2 className="text-3xl font-bold text-white mb-2">Prepare for Your Future</h2>
          <p className="text-gray-300 max-w-md">
            Interview IQ provides AI-powered mock interviews to help you land your dream job. Practice, analyze, and improve.
          </p>
        </div>
      </div>

      {/* Right Column (Form) */}
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <LogoIcon className="w-8 h-8"/>
              <span className="font-bold text-xl text-white">Interview IQ</span>
            </Link>
          </div>
          {/* This is where the login/signup page content will be rendered */}
          {children}
        </div>
      </div>
    </div>
  );
}