'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { ExitIcon } from '@radix-ui/react-icons';

export default function UserButton() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, [supabase.auth]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const getInitials = () => {
    if (!user) return '?';
    const fullName = user.user_metadata?.full_name;
    if (fullName) {
      // --- FIX APPLIED HERE: Replaced 'any[]' with the correct type 'string' ---
      return fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    return user.email?.[0].toUpperCase() || 'U';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm hover:ring-2 hover:ring-blue-400 transition-all"
      >
        {getInitials()}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#1C1C1C] border border-gray-700 rounded-md shadow-lg py-1 z-10">
          <div className="px-4 py-2 border-b border-gray-700">
            <p className="text-sm font-semibold text-white truncate">{user?.user_metadata?.full_name || 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-2 transition-colors"
          >
            <ExitIcon />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}