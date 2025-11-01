import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI(); // Automatically uses OPENAI_API_KEY from environment variables

// --- UPDATED PROMPT FOR OPENAI'S JSON MODE ---
function getOpenAIPrompt(jobDescription: string, difficulty: string): string {
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
    You are an expert hiring manager. Generate exactly ${questionCount} interview questions for a candidate based on the following job description.
    The difficulty level for the questions should be: "${difficulty}". 
    Guideline for this difficulty: ${difficultyGuideline}
    
    The job description is:
    ---
    ${jobDescription}
    ---

    Return your response as a JSON object with a single key "questions" which contains an array of the question strings.
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

    const prompt = getOpenAIPrompt(jobDescription, difficulty);

    // --- REPLACED GEMINI FETCH WITH OPENAI SDK CALL ---
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Or "gpt-3.5-turbo", a powerful and cost-effective model
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a helpful assistant designed to output JSON." },
        { role: "user", content: prompt }
      ]
    });

    if (!completion.choices[0].message.content) {
      throw new Error('OpenAI returned an empty response.');
    }

    const result = JSON.parse(completion.choices[0].message.content);
    const questionsList: string[] = result.questions;

    if (!Array.isArray(questionsList) || questionsList.length === 0) {
        throw new Error('AI failed to generate questions in the expected format.');
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