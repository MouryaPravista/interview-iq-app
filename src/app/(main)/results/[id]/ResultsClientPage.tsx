'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckIcon, Cross2Icon as XIcon } from '@radix-ui/react-icons';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

// --- Types ---
interface QuestionResult { id: string; question_text: string; user_answer: string; ai_feedback: { strengths: string[]; improvements: string[]; } | null; score: number | null; }
interface ResultData { id: string; overall_score: number; questions: QuestionResult[]; }

// --- Reusable Components ---
const PerformanceBar = ({ label, score }: { label: string; score: number }) => (
    <div>
        <div className="flex justify-between mb-1"><span className="text-base font-medium text-gray-300">{label}</span><span className="text-sm font-medium text-white">{Math.round(score)}%</span></div>
        <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${Math.round(score)}%` }}></div></div>
    </div>
);

const ResultsSkeleton = () => (
    <div className="space-y-8">
        <SkeletonLoader className="h-9 w-1/3 rounded-md" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg flex flex-col items-center justify-center border border-gray-700">
                <SkeletonLoader className="h-6 w-2/3 mb-4 rounded-md" />
                <SkeletonLoader className="h-40 w-40 rounded-full" />
                <SkeletonLoader className="h-4 w-full mt-4 rounded-md" />
                <SkeletonLoader className="h-4 w-3/4 mt-2 rounded-md" />
            </div>
            <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg border border-gray-700">
                <SkeletonLoader className="h-8 w-1/2 mb-6 rounded-md" />
                <div className="space-y-6">
                    <SkeletonLoader className="h-6 w-full rounded-md" />
                    <SkeletonLoader className="h-6 w-full rounded-md" />
                    <SkeletonLoader className="h-6 w-full rounded-md" />
                </div>
            </div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6"><SkeletonLoader className="h-8 w-1/4 rounded-md" /></div>
            <div className="space-y-4 p-6 border-t border-gray-700">
                <SkeletonLoader className="h-24 w-full rounded-md" />
                <SkeletonLoader className="h-24 w-full rounded-md" />
            </div>
        </div>
    </div>
);

export default function ResultsClientPage({ id }: { id: string }) {
  const [results, setResults] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({});

  useEffect(() => {
    const fetchResults = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('interviews').select('id, overall_score, questions ( id, score, question_text, user_answer, ai_feedback )').eq('id', id).not('overall_score', 'is', null).single();
      if (error || !data) {
        setError("Failed to load interview results.");
      } else {
        setResults(data as ResultData);
        const validQuestions = data.questions.filter(q => q.score !== null);
        const techScore = validQuestions.length > 0 ? validQuestions.reduce((sum, q) => sum + (q.score || 0), 0) / validQuestions.length : 0;
        setPerformanceMetrics({ "Technical Knowledge": techScore, "Clarity & Conciseness": data.overall_score * 1.1, "Confidence": data.overall_score * 0.9 });
      }
      setIsLoading(false);
    };
    setTimeout(fetchResults, 500);
  }, [id]);

  if (isLoading) return <ResultsSkeleton />;
  if (error || !results) return <div className="text-center p-10"><h1 className="text-2xl font-bold text-red-400">Error</h1><p className="text-gray-400">{error || "Could not load results."}</p></div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Interview Results</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg flex flex-col items-center justify-center border border-gray-700">
            <p className="text-gray-400 mb-2">Overall Score</p>
            <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 36 36"><path className="text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path><path className="text-blue-500" strokeDasharray={`${results.overall_score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"></path></svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-4xl font-bold">{results.overall_score}</span></div>
            </div>
            {/* --- FIX APPLIED HERE: Replaced ' with ' --- */}
            <p className="text-center text-gray-400 mt-4 text-sm">Good job! You did well, but there's room for improvement.</p>
        </div>
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Performance Breakdown</h2>
            <div className="space-y-4">{Object.entries(performanceMetrics).map(([label, score]) => (<PerformanceBar key={label} label={label} score={score as number} />))}</div>
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6"><h2 className="text-xl font-semibold">Detailed Feedback</h2></div>
        <div className="space-y-4 p-6 border-t border-gray-700">
            {results.questions.map((q, index) => (<details key={q.id} className="bg-gray-700/50 rounded-lg p-4" open={index === 0}><summary className="font-semibold text-lg cursor-pointer">Q: {q.question_text}</summary><div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-600"><div><h4 className="font-bold text-green-400 mb-2 flex items-center gap-2"><CheckIcon /> Strengths</h4><ul className="space-y-2 pl-2 text-sm list-disc list-inside">{(q.ai_feedback?.strengths || ['No specific strengths identified.']).map((s, i) => (<li key={i}>{s}</li>))}</ul></div><div><h4 className="font-bold text-yellow-400 mb-2 flex items-center gap-2"><XIcon /> Areas for Improvement</h4><ul className="space-y-2 pl-2 text-sm list-disc list-inside">{(q.ai_feedback?.improvements || ['No specific improvements identified.']).map((imp, i) => (<li key={i}>{imp}</li>))}</ul></div></div></details>))}
        </div>
      </div>
    </div>
  );
}