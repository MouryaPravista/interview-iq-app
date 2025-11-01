'use client'

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import toast from 'react-hot-toast';

const GoogleIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.7 7.7 0 0 1 5.352 2.082l-2.284 2.284A4.35 4.35 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.8 4.8 0 0 0 0 3.063h.003c.635 1.896 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.7 3.7 0 0 0 1.599-2.431H8v-3.08z"/></svg> );

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => { e.preventDefault(); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) { toast.error(error.message); } else { router.push('/dashboard'); router.refresh(); } };
  const handleOAuthSignIn = async (provider: 'github' | 'google') => { const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}/api/auth/callback` } }); if (error) { toast.error(`Failed to sign in with ${provider}.`); } };

  return (
    // The main content of the login page remains, but the outer centering wrappers are removed
    // as the new layout now handles all positioning.
    <div>
      <div className="text-center mb-6"><h1 className="text-3xl font-bold">Welcome Back</h1><p className="text-gray-400 mt-2">Log in to continue to Interview IQ</p></div>
      <div className="bg-[#111111] p-8 rounded-lg border border-gray-800">
        <h2 className="font-semibold mb-1 text-white">Log In</h2>
        <p className="text-sm text-gray-400 mb-6">Enter your email and password</p>
        <form onSubmit={handleSignIn} className="space-y-5">
          <div><label className="text-sm font-medium text-gray-300" htmlFor="email">Email</label><input id="email" className="w-full bg-[#1C1C1C] border border-gray-700 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required/></div>
          <div><label className="text-sm font-medium text-gray-300" htmlFor="password">Password</label><input id="password" className="w-full bg-[#1C1C1C] border border-gray-700 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required/></div>
          <button type="submit" className="w-full bg-white text-black font-bold py-2 px-4 rounded-md hover:bg-gray-200 transition-colors">Log In</button>
        </form>
        <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700" /></div><div className="relative flex justify-center text-xs"><span className="bg-[#111111] px-2 text-gray-500">OR CONTINUE WITH</span></div></div>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => handleOAuthSignIn('github')} className="w-full flex items-center justify-center gap-2 bg-[#1C1C1C] border border-gray-700 font-semibold py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"><GitHubLogoIcon/> GitHub</button>
          <button onClick={() => handleOAuthSignIn('google')} className="w-full flex items-center justify-center gap-2 bg-[#1C1C1C] border border-gray-700 font-semibold py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"><GoogleIcon/> Google</button>
        </div>
        <p className="text-center text-sm text-gray-400 mt-8">Don't have an account? <a href="/signup" className="font-semibold text-white hover:underline">Sign up</a></p>
      </div>
    </div>
  )
}