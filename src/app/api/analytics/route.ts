import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // --- UPDATED QUERY ---
    // We now fetch the ai_feedback from every question in every completed interview.
    const { data, error } = await supabase
      .from('interviews')
      .select('created_at, overall_score, questions(ai_feedback)') // <-- IMPORTANT CHANGE HERE
      .eq('user_id', user.id)
      .not('overall_score', 'is', null)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Error fetching analytics data:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}