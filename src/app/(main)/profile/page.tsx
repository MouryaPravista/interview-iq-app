'use client'

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import toast from 'react-hot-toast';

// --- TYPE DEFINITIONS ---
type AccountStats = {
    interview_count: number;
    average_score: number;
    highest_score: number;
}
type ActivityData = {
    [date: string]: number;
}

// --- REUSABLE UI COMPONENTS (Scoped to this file) ---

// A dedicated skeleton component for this page's loading state
const ProfileSkeleton = () => (
    <div className="max-w-6xl mx-auto space-y-12 animate-pulse">
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
                <SkeletonLoader className="h-32 w-full rounded-lg bg-[#111111]" />
                <SkeletonLoader className="h-32 w-full rounded-lg bg-[#111111]" />
                <SkeletonLoader className="h-32 w-full rounded-lg bg-[#111111]" />
            </div>
        </div>
        <div>
            <SkeletonLoader className="h-8 w-1/3 mb-4 rounded-md" />
            <SkeletonLoader className="h-40 w-full rounded-lg bg-[#111111]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SkeletonLoader className="h-48 w-full rounded-lg bg-[#111111]" />
            <SkeletonLoader className="h-32 w-full rounded-lg bg-[#111111]" />
        </div>
    </div>
);

// Component for the large, prominent stat cards
const StatCard = ({ value, label, isPercent = false }: { value: number, label: string, isPercent?: boolean }) => (
    <div className="bg-[#111111] p-6 rounded-lg border border-[#1C1C1C] text-center transition-transform hover:scale-105 hover:border-teal-500">
        <p className="text-4xl md:text-5xl font-bold text-white">{value}{isPercent && '%'}</p>
        <p className="text-gray-400 mt-2 text-sm uppercase tracking-wider">{label}</p>
    </div>
);

// Component for the GitHub-style activity heatmap
const ActivityCalendar = ({ data }: { data: ActivityData }) => {
    const squares = useMemo(() => {
        const result = [];
        const today = new Date();
        for (let i = 181; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            result.push({ date: dateString, count: data[dateString] || 0 });
        }
        return result;
    }, [data]);

    const getColor = (count: number) => {
        if (count === 0) return 'bg-[#1C1C1C]';
        if (count <= 1) return 'bg-teal-900';
        if (count <= 3) return 'bg-teal-700';
        return 'bg-teal-500';
    };

    return (
        <div className="bg-[#111111] p-6 rounded-lg border border-[#1C1C1C]">
            <h3 className="text-xl font-semibold mb-4">Your Practice Activity (Last 6 Months)</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(1rem,1fr))] grid-rows-7 grid-flow-col gap-1 h-32 overflow-x-auto">
                {squares.map(({ date, count }) => (
                    <div key={date} className={`w-4 h-4 rounded-sm ${getColor(count)}`} title={`${count} interviews on ${date}`}></div>
                ))}
            </div>
        </div>
    );
};


// --- THE DEDICATED PROFILE PAGE COMPONENT ---
export default function ProfilePage() {
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<AccountStats | null>(null);
    const [activityData, setActivityData] = useState<ActivityData>({});
    const [isLoading, setIsLoading] = useState(true);
    const [fullName, setFullName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    
    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                setFullName(user.user_metadata?.full_name || '');
                const { data: interviews, error } = await supabase.from('interviews').select('overall_score, created_at').not('overall_score', 'is', null);
                if (interviews && !error) {
                    const scores = interviews.map(i => i.overall_score || 0);
                    setStats({
                        interview_count: scores.length,
                        average_score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
                        highest_score: scores.length > 0 ? Math.max(...scores) : 0,
                    });
                    const activity: ActivityData = {};
                    interviews.forEach(i => {
                        const dateString = new Date(i.created_at).toISOString().split('T')[0];
                        activity[dateString] = (activity[dateString] || 0) + 1;
                    });
                    setActivityData(activity);
                }
            }
            setIsLoading(false);
        };
        void fetchData();
    }, [supabase]);

    const handleNameUpdate = async () => {
        const { data, error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
        if (error) { toast.error(error.message); } 
        else if (data.user) { setUser(data.user); toast.success("Name updated successfully!"); }
        setIsEditingName(false);
    };

    const getInitials = () => {
        if (!user) return '?';
        const name = user.user_metadata?.full_name || user.email || '';
        if (!name) return 'U';
        return name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    };

    if (isLoading) return <ProfileSkeleton />;
    if (!user) return <div className="text-center p-10 text-red-400">Could not load user profile.</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            {/* 1. Profile Header */}
            <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-teal-600 flex items-center justify-center font-bold text-3xl flex-shrink-0 border-2 border-teal-400">{getInitials()}</div>
                <div><h1 className="text-3xl font-bold">{user.user_metadata?.full_name || 'Welcome!'}</h1><p className="text-gray-400">{user.email}</p></div>
            </div>

            {/* 2. Stats Overview */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Your Journey So Far</h2>
                {stats && stats.interview_count > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard value={stats.interview_count} label="Interviews Completed" />
                        <StatCard value={stats.average_score} label="Average Score" isPercent />
                        <StatCard value={stats.highest_score} label="Highest Score" isPercent />
                    </div>
                ) : (
                    <div className="md:col-span-3 text-center text-gray-400 bg-[#111111] p-6 rounded-lg border border-[#1C1C1C]">Go to your dashboard to complete an interview and see your stats!</div>
                )}
            </div>
            
            {/* 3. Activity Calendar */}
            {stats && stats.interview_count > 0 && <ActivityCalendar data={activityData} />}

            {/* 4. Account Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="bg-[#111111] border border-[#1C1C1C] rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-400">Full Name</label>
                            {isEditingName ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#1C1C1C] border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-teal-500"/>
                                    <button onClick={handleNameUpdate} className="px-4 py-2 bg-teal-600 rounded-md hover:bg-teal-500 font-semibold">Save</button>
                                    <button onClick={() => setIsEditingName(false)} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Cancel</button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between"><p className="text-lg">{fullName || 'Not set'}</p><button onClick={() => setIsEditingName(true)} className="text-sm text-teal-400 hover:underline">Edit</button></div>
                            )}
                        </div>
                        <div><label className="text-sm font-medium text-gray-400">Member Since</label><p className="text-lg text-gray-300">{new Date(user.created_at).toLocaleDateString()}</p></div>
                    </div>
                </div>
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
                    <div className="flex flex-col sm:flex-row justify-between items-center">
                        <div><p className="font-semibold">Delete Your Account</p><p className="text-sm text-gray-400 mt-1">This action is permanent and cannot be undone.</p></div>
                        <button className="mt-4 sm:mt-0 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md flex-shrink-0" onClick={() => toast.error("This feature is not yet implemented.")}>Delete Account</button>
                    </div>
                </div>
            </div>
        </div>
    );
}