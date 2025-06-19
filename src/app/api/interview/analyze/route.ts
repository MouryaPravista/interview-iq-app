import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// The master prompt for analyzing an answer
function getAnalysisPrompt(question: string, answer: string): string {
  return `Analyze the following interview answer based on the question asked. Provide feedback in a structured JSON format.

  The JSON object must contain three keys:
  1. "strengths": An array of strings highlighting what the user did well. Be specific (e.g., "Used the STAR method effectively," "Provided a concrete example").
  2. "improvements": An array of strings suggesting how the user could improve their answer. Be constructive (e.g., "Could quantify the result more," "Try to be more concise").
  3. "score": An integer between 0 and 100, representing the quality of the answer.

  Return ONLY the JSON object, with no other text or explanations.

  Question: "${question}"
  Answer: "${answer}"
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
      if (!q.user_answer) return Promise.resolve();

      const prompt = getAnalysisPrompt(q.question_text, q.user_answer);
      // CORRECTED MODEL NAME HERE: gemini-1.5-flash-latest
      const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`;
      
      const geminiResponse = await fetch(googleApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (!geminiResponse.ok) {
        console.error(`Google Gemini API failed for question ${q.id}:`, await geminiResponse.text());
        return Promise.resolve();
      }

      const geminiResult = await geminiResponse.json();
      const generatedText = geminiResult.candidates[0].content.parts[0].text;
      const jsonString = generatedText.substring(generatedText.indexOf('{'), generatedText.lastIndexOf('}') + 1);

      try {
        const analysis = JSON.parse(jsonString);
        totalScore += analysis.score || 0;
        return supabase.from('questions').update({ ai_feedback: analysis, score: analysis.score }).eq('id', q.id);
      } catch (e) {
        console.error('Failed to parse AI response for question:', q.id, jsonString);
        return Promise.resolve();
      }
    });

    await Promise.all(analysisPromises);
    
    const overallScore = questions.length > 0 ? Math.round(totalScore / questions.length) : 0;
    const { error: updateError } = await supabase.from('interviews').update({ overall_score: overallScore }).eq('id', interviewId);
    if (updateError) throw updateError;

    return NextResponse.json({ success: true, overallScore });

  } catch (error) {
    console.error('Error in analyze route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}