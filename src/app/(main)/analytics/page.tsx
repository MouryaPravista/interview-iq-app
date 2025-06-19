'use client'

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'; // --- IMPORT SKELETON ---

// --- Type Definitions ---
interface QuestionFeedback { ai_feedback: { improvements: string[]; } | null; }
interface AnalyticsData { created_at: string; overall_score: number; questions: QuestionFeedback[]; }

// This function can remain as a simulation for the skill comparison chart
const getSkillData = (first: AnalyticsData | null, latest: AnalyticsData | null) => {
    const firstScore = first ? first.overall_score : 30;
    const latestScore = latest ? latest.overall_score : 75;
    return [
        { skill: 'Technical', first: firstScore * 0.9, latest: latestScore * 1.1 },
        { skill: 'Communication', first: firstScore * 1.2, latest: latestScore * 1.0 },
        { skill: 'Confidence', first: firstScore * 1.0, latest: latestScore * 0.9 },
        { skill: 'Relevance', first: firstScore * 1.1, latest: latestScore * 1.2 },
    ].map(item => ({...item, fullMark: 120}));
}

// --- NEW: A component specifically for the analytics skeleton loading state ---
const AnalyticsSkeleton = () => (
    <div className="space-y-8">
      <SkeletonLoader className="h-9 w-1/3 rounded-md" />
      <SkeletonLoader className="h-6 w-1/2 rounded-md" />

      {/* Performance Trends Skeleton */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <SkeletonLoader className="h-8 w-1/3 mb-4 rounded-md" />
        <SkeletonLoader className="h-[300px] w-full rounded-md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skill Comparison Skeleton */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <SkeletonLoader className="h-8 w-1/2 mb-4 rounded-md" />
            <SkeletonLoader className="h-6 w-1/3 mb-4 rounded-md" />
            <div className="flex justify-center items-center h-[300px]">
              <SkeletonLoader className="h-[250px] w-[250px] rounded-full" />
            </div>
        </div>
        {/* Top Improvement Opportunities Skeleton */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <SkeletonLoader className="h-8 w-2/3 mb-4 rounded-md" />
          <SkeletonLoader className="h-6 w-1/2 mb-6 rounded-md" />
          <div className="space-y-6">
            <SkeletonLoader className="h-8 w-full rounded-md" />
            <SkeletonLoader className="h-8 w-full rounded-md" />
            <SkeletonLoader className="h-8 w-full rounded-md" />
            <SkeletonLoader className="h-8 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
);

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topImprovements, setTopImprovements] = useState<{ name: string; score: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics');
        if (!response.ok) throw new Error('Failed to fetch analytics data.');
        const result: AnalyticsData[] = await response.json();
        setData(result);
        const improvementCounts = new Map<string, number>();
        result.forEach(interview => {
          interview.questions.forEach(question => {
            question.ai_feedback?.improvements?.forEach(imp => {
              improvementCounts.set(imp, (improvementCounts.get(imp) || 0) + 1);
            });
          });
        });
        const sortedImprovements = Array.from(improvementCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const maxCount = sortedImprovements.length > 0 ? sortedImprovements[0][1] : 0;
        const formattedImprovements = sortedImprovements.map(([name, count]) => ({ name, score: maxCount > 0 ? (count / maxCount) * 100 : 0 }));
        setTopImprovements(formattedImprovements);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    // Simulate a slightly longer load time to see the skeleton effect
    setTimeout(fetchData, 500);
  }, []);

  const formattedData = data.map(item => ({ ...item, date: new Date(item.created_at).toLocaleDateString() }));
  const firstInterview = data.length > 0 ? data[0] : null;
  const latestInterview = data.length > 0 ? data[data.length - 1] : null;
  const skillComparisonData = getSkillData(firstInterview, latestInterview);

  // --- UPDATED LOADING STATE ---
  if (isLoading) return <AnalyticsSkeleton />;

  if (error) return <div className="text-center p-10 text-red-400">Error: {error}</div>;
  if (data.length === 0) return <div className="text-center p-10 bg-gray-800 rounded-lg border border-gray-700">Complete at least one interview to see your analytics.</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Analytics</h1>
      <p className="text-gray-400">Track your interview performance over time</p>
      {/* Performance Trends Section */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Performance Trends</h2>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" /><XAxis dataKey="date" stroke="#A0AEC0" /><YAxis stroke="#A0AEC0" domain={[0, 100]}/><Tooltip contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #4A5568' }} /><Legend /><Line type="monotone" dataKey="overall_score" name="Overall Score" stroke="#4299E1" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skill Comparison Section */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Skill Comparison</h2>
            <p className="text-sm text-gray-400 mb-4">First vs. Latest Interview</p>
             <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillComparisonData}>
                        <PolarGrid stroke="#4A5568"/><PolarAngleAxis dataKey="skill" stroke="#A0AEC0" tick={{ fill: '#A0AEC0', fontSize: 12 }}/><PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false}/><Tooltip contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #4A5568' }} /><Legend /><Radar name="First" dataKey="first" stroke="#F56565" fill="#F56565" fillOpacity={0.6} /><Radar name="Latest" dataKey="latest" stroke="#48BB78" fill="#48BB78" fillOpacity={0.6} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
        {/* Top Improvement Opportunities Section */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Top Improvement Opportunities</h2>
            <p className="text-sm text-gray-400 mb-4">Based on all your past interviews</p>
            {topImprovements.length > 0 ? (
                <div className="space-y-4">
                    {topImprovements.map(item => (
                        <div key={item.name}><div className="flex justify-between mb-1"><span className="text-base font-medium text-gray-300">{item.name}</span></div><div className="w-full bg-gray-700 rounded-full h-4"><div className="bg-yellow-500 h-4 rounded-full" style={{ width: `${item.score}%` }}></div></div></div>
                    ))}
                </div>
            ) : (<p className="text-gray-400">No specific improvement trends identified yet. Complete more interviews!</p>)}
        </div>
      </div>
    </div>
  )
}