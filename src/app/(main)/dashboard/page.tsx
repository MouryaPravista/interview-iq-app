'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ChevronRightIcon, PlayIcon, ExclamationTriangleIcon, UploadIcon } from '@radix-ui/react-icons';
import toast from 'react-hot-toast';

type CompletedInterview = { id: string; created_at: string; job_description: string; overall_score: number; };
type InProgressInterview = { id: string; job_description: string; }

export default function Dashboard() {
  const [jobDescription, setJobDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [recentInterviews, setRecentInterviews] = useState<CompletedInterview[]>([]);
  const [inProgressInterview, setInProgressInterview] = useState<InProgressInterview | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: inProgressData } = await supabase.from('interviews').select('id, job_description').is('overall_score', null).order('created_at', { ascending: false }).limit(1).single();
      setInProgressInterview(inProgressData);
      const { data: completedData } = await supabase.from('interviews').select('id, created_at, job_description, overall_score').not('overall_score', 'is', null).order('created_at', { ascending: false }).limit(5);
      if (completedData) setRecentInterviews(completedData);
      setIsPageLoading(false);
    };
    void fetchData();
  }, []);

  const handleStartFromJD = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/interview/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobDescription, difficulty }) });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Failed to start interview.'); }
      const { interviewId } = await response.json();
      router.push(`/interview/${interviewId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStartFromResume = async () => {
    if (!selectedFile) {
      toast.error("Please select a resume file first.");
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append('resumeFile', selectedFile);
    formData.append('difficulty', difficulty);

    try {
      const response = await fetch('/api/interview/generateFromResume', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start interview from resume.');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast.error("Only PDF files are allowed.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const RecentActivitySkeleton = () => (
    <div className="space-y-2 p-4"><div className="h-10 bg-gray-700 rounded-md animate-pulse"></div><div className="h-10 bg-gray-700 rounded-md animate-pulse"></div><div className="h-10 bg-gray-700 rounded-md animate-pulse"></div></div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
      <p className="text-gray-400 mb-8">Let&apos;s get you prepared for your next interview.</p>
      
      {inProgressInterview ? (
        <div className="bg-yellow-900/50 p-6 rounded-lg space-y-3 border border-yellow-700 text-center mb-8">
          <div className="flex justify-center items-center gap-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-400" />
            <div>
              <h2 className="text-xl font-bold text-left">You have an interview in progress!</h2>
              <p className="text-yellow-300 text-left text-sm">Finish your interview for &quot;{inProgressInterview.job_description.substring(0, 60)}...&quot; before starting a new one.</p>
            </div>
            <Link href={`/interview/${inProgressInterview.id}`} className="inline-flex items-center justify-center gap-2 bg-yellow-500 text-black font-bold py-3 px-6 rounded-md hover:bg-yellow-400 transition-colors ml-auto flex-shrink-0"><PlayIcon />Resume Interview</Link>
          </div>
        </div>
      ) : null}

      <fieldset disabled={!!inProgressInterview || isLoading} className="disabled:opacity-50 disabled:cursor-not-allowed">
        <div className="bg-[#111111] p-8 rounded-lg border border-[#1C1C1C]">
          <h2 className="text-xl font-semibold mb-6 text-center">Start a New Mock Interview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <div className="space-y-4 p-4 rounded-md border border-gray-700 flex flex-col">
              <h3 className="font-semibold text-center text-gray-300">Practice for a Specific Job</h3>
              <textarea id="job-description" rows={8} className="w-full flex-grow bg-[#1C1C1C] border border-gray-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#10B981]" placeholder="Paste a job description..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}/>
              <button onClick={handleStartFromJD} disabled={!jobDescription || isLoading} className="w-full bg-[#10B981] text-white font-bold py-3 px-6 rounded-md hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                {isLoading && !!jobDescription ? "Processing..." : "Start from Job Description →"}
              </button>
            </div>
            <div className="space-y-4 p-4 rounded-md border border-gray-700 flex flex-col">
              <h3 className="font-semibold text-center text-gray-300">Practice Based on Your Resume</h3>
              <div className="flex-grow flex flex-col items-center justify-center">
                <label htmlFor="resume-upload" className="w-full h-full cursor-pointer bg-[#1C1C1C] border-2 border-dashed border-gray-700 rounded-md p-6 text-center hover:border-[#10B981] transition-colors flex flex-col items-center justify-center">
                  <UploadIcon className="mx-auto h-8 w-8 text-gray-500 mb-2"/>
                  <span className="text-teal-400 font-semibold">Click to upload a PDF</span>
                  <p className="text-xs text-gray-500 mt-1 truncate w-full px-2">{selectedFile ? selectedFile.name : "(Max 2MB)"}</p>
                  <input id="resume-upload" type="file" className="hidden" accept=".pdf" onChange={handleFileChange}/>
                </label>
              </div>
              <button onClick={handleStartFromResume} disabled={!selectedFile || isLoading} className="w-full bg-[#10B981] text-white font-bold py-3 px-6 rounded-md hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                {isLoading && !!selectedFile ? "Processing..." : "Start from Resume →"}
              </button>
            </div>
          </div>
          <div className="mt-6 border-t border-gray-700 pt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2 text-center">Configure Interview Difficulty (Applies to Both)</label>
            <div className="flex justify-center space-x-4">
              {['Easy', 'Medium', 'Hard'].map(level => (<button key={level} onClick={() => setDifficulty(level)} className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${difficulty === level ? 'bg-[#10B981] text-white' : 'bg-[#1C1C1C] hover:bg-gray-800'}`}>{level}</button>))}
            </div>
          </div>
        </div>
      </fieldset>

      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Completed Interviews</h2>
        <div className="bg-[#111111] border border-[#1C1C1C] rounded-lg">
          {isPageLoading ? <RecentActivitySkeleton /> : ( recentInterviews.length > 0 ? (
              <ul className="divide-y divide-[#1C1C1C]">
                {recentInterviews.map((interview) => ( <li key={interview.id}><Link href={`/results/${interview.id}`} className="flex items-center justify-between p-4 hover:bg-[#1C1C1C] transition-colors"><div className="flex-grow min-w-0"><p className="font-semibold truncate">{`Interview for: ${interview.job_description.substring(0, 50)}...`}</p><p className="text-sm text-gray-400">Completed on {new Date(interview.created_at).toLocaleDateString()}</p></div><div className="flex items-center gap-4 ml-4 flex-shrink-0"><span className="font-bold text-lg">{interview.overall_score}</span><ChevronRightIcon className="h-5 w-5 text-gray-400" /></div></Link></li> ))}
              </ul>
            ) : ( <div className="p-8 text-center"><p className="text-gray-400">You haven&apos;t completed any interviews yet.</p></div> )
          )}
        </div>
      </div>
    </div>
  );
}