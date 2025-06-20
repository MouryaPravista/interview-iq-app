import ResultsClientPage from './ResultsClientPage';

// This is now a Server Component.
export default function ResultsPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // It renders the Client Component and passes the 'id' as a simple prop.
  return <ResultsClientPage id={id} />;
}