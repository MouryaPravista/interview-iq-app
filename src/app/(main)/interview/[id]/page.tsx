import InterviewClientPage from './InterviewClientPage';

// This is now a Server Component. It can safely access params.
export default function InterviewPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // It renders the Client Component and passes the 'id' as a simple prop.
  return <InterviewClientPage id={id} />;
}