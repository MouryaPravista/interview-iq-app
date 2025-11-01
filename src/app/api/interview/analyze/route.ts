import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

// --- UPDATED PROMPT FOR OPENAI'S JSON MODE ---
function getAnalysisPrompt(question: string, answer: string): string {
  return `Analyze the following interview answer based on the question asked.

  Question: "${question}"
  Answer: "${answer}"

  Provide feedback in a structured JSON object. The object must contain three keys:
  1. "strengths": An array of strings highlighting what the user did well. Be specific (e.g., "Used the STAR method effectively," "Provided a concrete example").
  2. "improvements": An array of strings suggesting how the user could improve. Be constructive (e.g., "Could quantify the result more," "Try to be more concise").
  3. "score": An integer between 0 and 100 representing the answer's quality.
  `;
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { interviewId } = await request.json();
    if (!interviewId) return new NextResponse(JSON.stringify({ error: 'Missing interviewId' }), { status: 400 });

    const { data: questions, error: fetchError } = await supabase
      .from('questions')
      .select('id, question_text, user_answer')
      .eq('interview_id', interviewId)
      .not('user_answer', 'is', null);

    if (fetchError) throw fetchError;
    if (!questions || questions.length === 0) throw new Error('No answered questions found for this interview.');

    let totalScore = 0;
    const analysisPromises = questions.map(async (q) => {
      if (!q.user_answer || q.user_answer.startsWith('[Answer Disqualified')) {
        return Promise.resolve();
      }

      const prompt = getAnalysisPrompt(q.question_text, q.user_answer);
      
      try {
        // --- REPLACED GEMINI FETCH WITH OPENAI SDK CALL ---
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: "You are a helpful assistant that provides interview feedback in JSON format." },
              { role: "user", content: prompt }
            ]
        });

        if (!completion.choices[0].message.content) {
            throw new Error(`OpenAI returned an empty response for question ${q.id}.`);
        }

        const analysis = JSON.parse(completion.choices[0].message.content);
        totalScore += analysis.score || 0;
        await supabase.from('questions').update({ ai_feedback: analysis, score: analysis.score }).eq('id', q.id);
      } catch (e) {
        console.error('Failed to analyze or parse response for question:', q.id, "Error:", e);
        return Promise.resolve();
      }
    });

    await Promise.all(analysisPromises);
    
    const scoredQuestions = questions.filter(q => !q.user_answer?.startsWith('[Answer Disqualified'));
    const overallScore = scoredQuestions.length > 0 ? Math.round(totalScore / scoredQuestions.length) : 0;
    
    await supabase.from('interviews').update({ overall_score: overallScore }).eq('id', interviewId);

    return NextResponse.json({ success: true, overallScore });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}