'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ChevronRightIcon, PlayIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import toast from 'react-hot-toast';

// Define types for our interview data
type CompletedInterview = {
  id: string;
  created_at: string;
  job_description: string;
  overall_score: number;
};

// --- NEW TYPE for an interview that has been started but not finished ---
type InProgressInterview = {
    id: string;
    job_description: string;
}

export default function Dashboard() {
  const [jobDescription, setJobDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true); // To handle initial data fetch
  const [recentInterviews, setRecentInterviews] = useState<CompletedInterview[]>([]);
  // --- NEW STATE to hold the interview that needs to be resumed ---
  const [inProgressInterview, setInProgressInterview] = useState<InProgressInterview | null>(null);
  const router = useRouter();

  // This one useEffect now handles fetching BOTH completed and in-progress interviews
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // 1. Check for an in-progress interview (overall_score is NULL)
      const { data: inProgressData, error: inProgressError } = await supabase
        .from('interviews')
        .select('id, job_description')
        .is('overall_score', null) // The key condition for an unfinished interview
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (inProgressData && !inProgressError) {
        setInProgressInterview(inProgressData);
      }

      // 2. Fetch recent COMPLETED interviews (overall_score is NOT NULL)
      const { data: completedData, error: completedError } = await supabase
        .from('interviews')
        .select('id, created_at, job_description, overall_score')
        .not('overall_score', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (completedData && !completedError) {
        setRecentInterviews(completedData);
      }
      
      setIsPageLoading(false);
    };

    fetchData();
  }, []);

  const handleStartInterview = async () => {
    // This function remains the same, but will be disabled if an interview is in progress
    setIsLoading(true);
    try {
      const response = await fetch('/api/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, difficulty }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start interview.');
      }
      const { interviewId } = await response.json();
      router.push(`/interview/${interviewId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // A simple skeleton loader for the "Recent Activity" list
  const RecentActivitySkeleton = () => (
    <div className="space-y-2 p-4">
        <div className="h-10 bg-gray-700 rounded-md animate-pulse"></div>
        <div className="h-10 bg-gray-700 rounded-md animate-pulse"></div>
        <div className="h-10 bg-gray-700 rounded-md animate-pulse"></div>
    </div>
  )

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
      <p className="text-gray-400 mb-8">Let's get you prepared for your next interview.</p>
      
      {/* --- NEW: Conditional Rendering based on in-progress interview --- */}
      {inProgressInterview ? (
        // If an interview is in progress, show the resume card
        <div className="bg-yellow-900/50 p-8 rounded-lg space-y-4 border border-yellow-700 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-400 mx-auto" />
            <h2 className="text-2xl font-bold">You have an interview in progress!</h2>
            <p className="text-yellow-300">Finish your interview for "{inProgressInterview.job_description.substring(0, 60)}..." before starting a new one.</p>
            <Link 
                href={`/interview/${inProgressInterview.id}`}
                className="inline-flex items-center justify-center gap-2 bg-yellow-500 text-black font-bold py-3 px-6 rounded-md hover:bg-yellow-400 transition-colors"
            >
                <PlayIcon />
                Resume Interview
            </Link>
        </div>
      ) : (
        // Otherwise, show the regular "Start New Interview" card
        <div className="bg-gray-800 p-8 rounded-lg space-y-6 border border-gray-700">
          <h2 className="text-xl font-semibold">Start a New Mock Interview</h2>
          <div>
            <label htmlFor="job-description" className="block text-sm font-medium text-gray-300 mb-2">Step 1: Paste the Job Description</label>
            <textarea id="job-description" rows={10} className="w-full bg-[#1C1C1C] border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Paste the full job description here..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Step 2: Configure Interview</label>
            <div className="flex space-x-4">
              {['Easy', 'Medium', 'Hard'].map(level => (<button key={level} onClick={() => setDifficulty(level)} className={`px-4 py-2 rounded-md font-semibold text-sm ${difficulty === level ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{level}</button>))}
            </div>
          </div>
          <button onClick={handleStartInterview} disabled={!jobDescription || isLoading} className="w-full md:w-auto bg-white text-black font-bold py-3 px-6 rounded-md hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
            {isLoading ? (<> <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Generating Interview... </>) : 'Start Interview →'}
          </button>
        </div>
      )}

      {/* Recent Activity Section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Completed Interviews</h2>
        <div className="bg-gray-800 border border-gray-700 rounded-lg">
          {isPageLoading ? <RecentActivitySkeleton /> : (
            recentInterviews.length > 0 ? (
              <ul className="divide-y divide-gray-700">
                {recentInterviews.map((interview) => (
                  <li key={interview.id}>
                    <Link href={`/results/${interview.id}`} className="flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors">
                      <div className="flex-grow min-w-0"><p className="font-semibold truncate">{`Interview for: ${interview.job_description.substring(0, 50)}...`}</p><p className="text-sm text-gray-400">Completed on {new Date(interview.created_at).toLocaleDateString()}</p></div>
                      <div className="flex items-center gap-4 ml-4 flex-shrink-0"><span className="font-bold text-lg">{interview.overall_score}</span><ChevronRightIcon className="h-5 w-5 text-gray-400" /></div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center"><p className="text-gray-400">You haven't completed any interviews yet.</p></div>
            )
          )}
        </div>
      </div>
    </div>
  );
}