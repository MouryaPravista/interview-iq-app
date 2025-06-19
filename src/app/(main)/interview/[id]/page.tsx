import InterviewClientPage from './InterviewClientPage';

// --- FIX APPLIED HERE ---
// 1. The function is now 'async'.
// 2. We can now correctly destructure the 'id' from 'params'.
export default async function InterviewPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // The rest of the logic remains the same.
  return <InterviewClientPage id={id} />;
}