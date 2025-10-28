import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// --- THE CORRECTED PROMPT FUNCTION ---
// The underscores have been removed from the parameters, so they are correctly passed to the prompt string.
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
      if (!q.user_answer || q.user_answer.startsWith('[Answer Disqualified')) {
        // Skip analysis for disqualified or empty answers
        return Promise.resolve();
      }

      const prompt = getAnalysisPrompt(q.question_text, q.user_answer);
      const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`;
      
      const geminiResponse = await fetch(googleApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (!geminiResponse.ok) {
        console.error(`Google Gemini API failed for question ${q.id}:`, await geminiResponse.text());
        // Don't update the question if the API fails
        return Promise.resolve();
      }

      const geminiResult = await geminiResponse.json();
      const generatedText = geminiResult.candidates[0].content.parts[0].text;
      const jsonString = generatedText.substring(generatedText.indexOf('{'), generatedText.lastIndexOf('}') + 1);

      try {
        const analysis = JSON.parse(jsonString);
        totalScore += analysis.score || 0;
        // Update the question with the new feedback
        await supabase.from('questions').update({ ai_feedback: analysis, score: analysis.score }).eq('id', q.id);
      } catch (e) {
        // Log the actual error object
        console.error('Failed to parse AI response for question:', q.id, "Error:", e, "Raw Text:", jsonString);
        // Don't update the question if parsing fails
        return Promise.resolve();
      }
    });

    await Promise.all(analysisPromises);
    
    // Only calculate the average based on questions that were actually scored
    const scoredQuestions = questions.filter(q => !q.user_answer?.startsWith('[Answer Disqualified'));
    const overallScore = scoredQuestions.length > 0 ? Math.round(totalScore / scoredQuestions.length) : 0;
    
    await supabase.from('interviews').update({ overall_score: overallScore }).eq('id', interviewId);

    return NextResponse.json({ success: true, overallScore });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}