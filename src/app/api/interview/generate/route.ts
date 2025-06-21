import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// --- A NEW, MORE ROBUST PROMPT ---
// This prompt is simpler and more direct, making it far more reliable for the AI.
// It still incorporates the key dynamic elements we need.
function getRobustPrompt(jobDescription: string, difficulty: string): string {
  let questionCount: number;
  let difficultyGuideline: string;

  switch (difficulty.toLowerCase()) {
    case 'easy':
      questionCount = 5;
      difficultyGuideline = "Focus on foundational, single-part questions. Ask for definitions and basic concepts.";
      break;
    case 'hard':
      questionCount = 10;
      difficultyGuideline = "Focus on complex, multi-part questions about system design, architecture, and challenging behavioral scenarios.";
      break;
    default: // Medium
      questionCount = 7;
      difficultyGuideline = "Focus on scenario-based questions that require comparing technologies or describing personal project experience.";
      break;
  }

  return `
    Generate exactly ${questionCount} interview questions for a candidate based on the following job description.
    
    The difficulty level for the questions should be: "${difficulty}". 
    Guideline for this difficulty: ${difficultyGuideline}
    
    To ensure variety, please generate a different set of questions than you might have previously for this same prompt.

    The job description is:
    ---
    ${jobDescription}
    ---

    Your response MUST be a single, valid JSON array of strings. Do not include any other text, comments, or markdown formatting.
    Example Response: ["What is your experience with React?", "Describe a time you handled a difficult team member."]
  `;
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

    const prompt = getRobustPrompt(jobDescription, difficulty);
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
    } catch (e) {
      console.error("CRITICAL ERROR: Failed to parse JSON from AI. Raw text from AI was:", generatedText);
      throw new Error('The AI returned a response in an unexpected format. Please try again.');
    }

    const { data: interviewData, error: interviewError } = await supabase
      .from('interviews')
      .insert({ user_id: user.id, job_description: jobDescription, difficulty: difficulty })
      .select('id').single();

    if (interviewError || !interviewData) throw new Error('Failed to create interview session in the database.');
    
    const interviewId = interviewData.id;
    const questionsToInsert = questionsList.map((q) => ({ interview_id: interviewId, question_text: q }));
    await supabase.from('questions').insert(questionsToInsert);

    return NextResponse.json({ interviewId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}