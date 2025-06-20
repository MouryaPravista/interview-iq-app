import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// --- NEW DYNAMIC QUESTION COUNT LOGIC ---
function getQuestionCount(difficulty: string): number {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 5;
    case 'medium':
      return 7;
    case 'hard':
      return 10;
    default:
      return 7;
  }
}

// --- NEW, ADVANCED PROMPT GENERATION ---
function getAdvancedPrompt(jobDescription: string, difficulty: string, questionCount: number): string {
  let difficultyInstructions = '';
  switch (difficulty.toLowerCase()) {
    case 'easy':
      difficultyInstructions = `- Focus on foundational knowledge and definitions. - Ask about the purpose of key technologies mentioned. - Include simple behavioral questions like "Tell me about yourself." - Avoid complex multi-part questions or deep architectural scenarios.`;
      break;
    case 'medium':
      difficultyInstructions = `- Ask questions that require comparing or contrasting technologies. - Include scenario-based questions, like "How would you handle...". - Ask about personal project experience related to the job. - Questions should require more than a one-sentence answer.`;
      break;
    case 'hard':
      difficultyInstructions = `- Ask complex, multi-part questions about system design and architecture. - Present challenging hypothetical scenarios related to debugging or scaling. - Pose behavioral questions that require deep self-reflection and use of the STAR method (e.g., "Describe your most significant failure."). - Questions should probe the candidate's strategic thinking and problem-solving abilities.`;
      break;
  }
  const randomSeed = `(Variation ID: ${Date.now()})`;
  return `You are an expert technical interviewer. Generate a set of ${questionCount} interview questions based on the following job description and a difficulty level of "${difficulty}". ${randomSeed}\n\nAdhere to these difficulty guidelines strictly:\n${difficultyInstructions}\n\nThe questions must cover a mix of technical skills, behavioral situations, and role-specific challenges mentioned in the job description.\n\nReturn the result as a single, valid JSON array of strings. Do not include any other text, comments, or markdown formatting outside of the JSON array itself.\n\nExample format:\n["What is your experience with React?", "Describe a time you handled a difficult team member."]\n\nJob Description:\n---\n${jobDescription}\n---`;
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { jobDescription, difficulty } = await request.json();
    if (!jobDescription || !difficulty) {
      return new NextResponse(JSON.stringify({ error: 'Missing job description or difficulty' }), { status: 400 });
    }

    const questionCount = getQuestionCount(difficulty);
    const prompt = getAdvancedPrompt(jobDescription, difficulty, questionCount);
    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`;
    
    const geminiResponse = await fetch(googleApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        throw new Error(`Google Gemini API failed: ${errorText}`);
    }

    const geminiResult = await geminiResponse.json();
    
    let generatedText = geminiResult.candidates[0].content.parts[0].text;
    generatedText = generatedText.trim().replace(/^```json\n/, '').replace(/\n```$/, '');

    let questionsList: string[] = [];
    try {
      questionsList = JSON.parse(generatedText);
    } catch (_e) { // --- FIX APPLIED HERE: Renamed unused var to _e ---
      console.error("Failed to parse JSON from AI. Raw text:", generatedText);
      throw new Error('The AI returned an invalid response. Please try again.');
    }

    const { data: interviewData, error: interviewError } = await supabase
      .from('interviews')
      .insert({ user_id: user.id, job_description: jobDescription, difficulty: difficulty })
      .select('id').single();

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