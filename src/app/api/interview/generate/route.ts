import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function getQuestionCount(difficulty: string): number { switch (difficulty.toLowerCase()) { case 'easy': return 5; case 'medium': return 7; case 'hard': return 10; default: return 7; } }
function getAdvancedPrompt(jobDescription: string, difficulty: string, questionCount: number): string { let difficultyInstructions = ''; switch (difficulty.toLowerCase()) { case 'easy': difficultyInstructions = `- Focus on foundational knowledge...`; break; case 'medium': difficultyInstructions = `- Ask questions that require comparing...`; break; case 'hard': difficultyInstructions = `- Ask complex, multi-part questions...`; break; } const randomSeed = `(Variation ID: ${Date.now()})`; return `You are an expert...${randomSeed}...${difficultyInstructions}...${jobDescription}...`; }

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    const { jobDescription, difficulty } = await request.json();
    if (!jobDescription || !difficulty) return new NextResponse(JSON.stringify({ error: 'Missing job description or difficulty' }), { status: 400 });
    const questionCount = getQuestionCount(difficulty);
    const prompt = getAdvancedPrompt(jobDescription, difficulty, questionCount);
    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`;
    const geminiResponse = await fetch(googleApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    if (!geminiResponse.ok) { const errorText = await geminiResponse.text(); throw new Error(`Google Gemini API failed: ${errorText}`); }
    const geminiResult = await geminiResponse.json();
    let generatedText = geminiResult.candidates[0].content.parts[0].text;
    generatedText = generatedText.trim().replace(/^```json\n/, '').replace(/\n```$/, '');
    let questionsList: string[] = [];
    try {
      questionsList = JSON.parse(generatedText);
    } catch (_e) {
      console.error("Failed to parse JSON from AI. Raw text:", generatedText);
      throw new Error('The AI returned an invalid response. Please try again.');
    }
    const { data: interviewData, error: interviewError } = await supabase.from('interviews').insert({ user_id: user.id, job_description: jobDescription, difficulty: difficulty }).select('id').single();
    if (interviewError || !interviewData) throw new Error('Failed to create interview session.');
    const interviewId = interviewData.id;
    const questionsToInsert = questionsList.map((q) => ({ interview_id: interviewId, question_text: q }));
    await supabase.from('questions').insert(questionsToInsert);
    return NextResponse.json({ interviewId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}