import ResultsClientPage from './ResultsClientPage';

// --- FIX APPLIED HERE ---
// 1. The function is now 'async'.
// 2. We can now correctly destructure the 'id' from 'params'.
export default async function ResultsPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // The rest of the logic remains the same.
  // We pass the resolved 'id' as a simple string prop to the Client Component.
  return <ResultsClientPage id={id} />;
}