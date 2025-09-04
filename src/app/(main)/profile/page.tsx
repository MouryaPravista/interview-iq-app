'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import toast from 'react-hot-toast';

// Type for the user's aggregated statistics
type AccountStats = {
    interview_count: number;
    average_score: number;
    highest_score: number;
}

// Reusable component for the large, prominent stat cards
const StatCard = ({ value, label, isPercent = false }: { value: number, label: string, isPercent?: boolean }) => (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center transition-transform hover:scale-105">
        <p className="text-4xl md:text-5xl font-bold text-white">{value}{isPercent && '%'}</p>
        <p className="text-gray-400 mt-2 text-sm uppercase tracking-wider">{label}</p>
    </div>
);

// A dedicated skeleton component for this page's loading state
const ProfileSkeleton = () => (
    <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex items-center gap-6">
            <SkeletonLoader className="h-20 w-20 rounded-full flex-shrink-0" />
            <div className="w-full space-y-2">
                <SkeletonLoader className="h-8 w-1/3 rounded-md" />
                <SkeletonLoader className="h-5 w-1/2 rounded-md" />
            </div>
        </div>
        <div>
            <SkeletonLoader className="h-8 w-1/4 mb-4 rounded-md" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SkeletonLoader className="h-32 w-full rounded-lg" />
                <SkeletonLoader className="h-32 w-full rounded-lg" />
                <SkeletonLoader className="h-32 w-full rounded-lg" />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SkeletonLoader className="h-48 w-full rounded-lg" />
            <SkeletonLoader className="h-32 w-full rounded-lg" />
        </div>
    </div>
);

export default function ProfilePage() {
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<AccountStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [fullName, setFullName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    
    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                setFullName(user.user_metadata?.full_name || '');

                const { data: interviews, error } = await supabase.from('interviews').select('overall_score').not('overall_score', 'is', null);
                if (interviews && !error) {
                    const scores = interviews.map(i => i.overall_score || 0);
                    const interview_count = scores.length;
                    const average_score = interview_count > 0 ? scores.reduce((a, b) => a + b, 0) / interview_count : 0;
                    const highest_score = interview_count > 0 ? Math.max(...scores) : 0;
                    setStats({ interview_count, average_score: Math.round(average_score), highest_score });
                }
            }
            setIsLoading(false);
        };
        void fetchData();
    }, []);

    const handleNameUpdate = async () => {
        const { data, error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
        if (error) { toast.error(error.message); } 
        else if (data.user) { 
            setUser(data.user); 
            toast.success("Name updated successfully!"); 
        }
        setIsEditingName(false);
    };

    const getInitials = () => {
        if (!user) return '?';
        const name = user.user_metadata?.full_name || user.email || '';
        if (!name) return 'U';
        return name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    };

    if (isLoading) {
        return <ProfileSkeleton />;
    }
    
    if (!user) {
        return <div className="text-center p-10 text-red-400">Could not load user profile. Please try refreshing the page.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            {/* Profile Header */}
            <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center font-bold text-3xl flex-shrink-0 border-2 border-blue-400">
                    {getInitials()}
                </div>
                <div>
                    <h1 className="text-3xl font-bold">{user.user_metadata?.full_name || 'Welcome!'}</h1>
                    <p className="text-gray-400">{user.email}</p>
                </div>
            </div>

            {/* Prominent Stat Cards */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Your Journey So Far</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats ? (
                        <>
                            <StatCard value={stats.interview_count} label="Interviews Completed" />
                            <StatCard value={stats.average_score} label="Average Score" isPercent={true} />
                            <StatCard value={stats.highest_score} label="Highest Score" isPercent={true} />
                        </>
                    ) : (
                        <div className="md:col-span-3 text-center text-gray-500">Complete an interview to see your stats!</div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Profile Information Card */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-400">Full Name</label>
                            {isEditingName ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#1C1C1C] border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                                    <button onClick={handleNameUpdate} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 font-semibold">Save</button>
                                    <button onClick={() => setIsEditingName(false)} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Cancel</button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <p className="text-lg">{fullName || 'Not set'}</p>
                                    <button onClick={() => setIsEditingName(true)} className="text-sm text-blue-400 hover:underline">Edit</button>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-400">Member Since</label>
                            <p className="text-lg text-gray-300">{new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Danger Zone Card */}
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
                    <div className="flex flex-col sm:flex-row justify-between items-center">
                        <div>
                            <p className="font-semibold">Delete Your Account</p>
                            <p className="text-sm text-gray-400 mt-1">This action is permanent and cannot be undone.</p>
                        </div>
                        <button className="mt-4 sm:mt-0 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md flex-shrink-0" onClick={() => toast.error("This feature is not yet implemented.")}>
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}