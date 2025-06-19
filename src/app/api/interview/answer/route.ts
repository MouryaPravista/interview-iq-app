import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { questionId, userAnswer } = await request.json()

  if (!questionId || userAnswer === undefined) {
    return new NextResponse(JSON.stringify({ error: 'Missing questionId or userAnswer' }), { status: 400 })
  }

  try {
    // Our RLS policy ensures a user can only update questions
    // that belong to an interview they own.
    const { error } = await supabase
      .from('questions')
      .update({ user_answer: userAnswer })
      .eq('id', questionId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving answer:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 })
  }
}