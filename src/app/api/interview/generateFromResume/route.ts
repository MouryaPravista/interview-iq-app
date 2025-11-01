import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import OpenAI from 'openai';

const openai = new OpenAI();

// --- UPDATED PROMPT FOR OPENAI'S JSON MODE ---
function getResumePrompt(resumeText: string, difficulty: string): string {
  const questionCount = 7;
  return `
    You are a senior hiring manager conducting an interview. Based on the following resume text, generate exactly ${questionCount} in-depth interview questions.
    The interview difficulty should be "${difficulty}".
    Probe their experience on listed projects and test their knowledge of listed skills. Do not ask generic questions.
    Resume Text: --- ${resumeText} ---
    Return your response as a JSON object with a single key "questions" which contains an array of the generated question strings.
  `;
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const formData = await request.formData();
    const resumeFile = formData.get('resumeFile') as File;
    const difficulty = formData.get('difficulty') as string;

    if (!resumeFile || !difficulty) {
      return new NextResponse(JSON.stringify({ error: 'Missing resume file or difficulty' }), { status: 400 });
    }

    const fileBuffer = Buffer.from(await resumeFile.arrayBuffer());

    const filename = `${user.id}-${Date.now()}-${resumeFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from('resumes').upload(filename, fileBuffer, { contentType: 'application/pdf' });
    if (uploadError) throw new Error("Failed to upload resume to storage.");

    const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(uploadData.path);
    const data = await pdf(fileBuffer);
    const resumeText = data.text;
    if (!resumeText) throw new Error("Could not extract text from the PDF.");
    
    const prompt = getResumePrompt(resumeText, difficulty);
    
    // --- REPLACED GEMINI FETCH WITH OPENAI SDK CALL ---
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
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

    const jobDescriptionForDb = `Interview based on resume: ${resumeText.substring(0, 100)}...`;
    const { data: interviewData, error: interviewError } = await supabase.from('interviews').insert({
      user_id: user.id,
      job_description: jobDescriptionForDb,
      difficulty: difficulty,
      resume_url: publicUrl
    }).select('id').single();

    if (interviewError || !interviewData) throw new Error('Failed to create interview session.');
    
    const interviewId = interviewData.id;
    const questionsToInsert = questionsList.map((q: string) => ({ interview_id: interviewId, question_text: q }));
    await supabase.from('questions').insert(questionsToInsert);

    return NextResponse.json({ interviewId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}