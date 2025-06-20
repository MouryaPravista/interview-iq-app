import InterviewClientPage from './InterviewClientPage';
import React from 'react'; // --- IMPORT REACT ---

// The props for a dynamic page are now treated as a Promise.
// We type it explicitly and use React.use() to unwrap it.
type PageProps = {
    params: Promise<{ id: string }>
}

export default function InterviewPage(props: PageProps) {
  // --- THE DEFINITIVE FIX ---
  // React.use() is the official way to resolve the params promise.
  const { id } = React.use(props.params);

  // It now renders the Client Component with the unwrapped id.
  return <InterviewClientPage id={id} />;
}