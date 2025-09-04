import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
// This specific import path is the correct way to use pdf-parse in a Next.js ES Module environment.
import pdf from 'pdf-parse/lib/pdf-parse.js';

// The prompt for analyzing a resume.
function getResumePrompt(resumeText: string, difficulty: string): string {
  const questionCount = 7;
  return `
    You are a senior hiring manager conducting an interview. You have been handed the following resume text.
    Your task is to generate exactly ${questionCount} in-depth interview questions based on the resume's content, with a difficulty of "${difficulty}".
    Probe their experience on listed projects and test their knowledge of listed skills. Do not ask generic questions.
    Resume Text: --- ${resumeText} ---
    Return the result as a single, valid JSON object with a key named "questions" which contains an array of the generated question strings.
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

    // 1. Upload the original PDF to Supabase Storage
    const filename = `${user.id}-${Date.now()}-${resumeFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('resumes') // The bucket we created with the SQL command.
      .upload(filename, fileBuffer, {
        contentType: 'application/pdf',
      });

    if (uploadError) {
      console.error("Supabase storage error:", uploadError);
      throw new Error("Failed to upload resume to storage.");
    }

    // 2. Get the public URL of the uploaded file.
    const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(uploadData.path);

    // 3. Parse the PDF file to extract text
    const data = await pdf(fileBuffer);
    const resumeText = data.text;
    if (!resumeText) throw new Error("Could not extract text from the PDF.");
    
    // 4. Call the Google Gemini AI with the extracted resume text
    const prompt = getResumePrompt(resumeText, difficulty);
    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`;
    const geminiResponse = await fetch(googleApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!geminiResponse.ok) throw new Error('Google Gemini API failed');
    const geminiResult = await geminiResponse.json();
    let generatedText = geminiResult.candidates[0].content.parts[0].text;
    generatedText = generatedText.trim().replace(/^```json\n/, '').replace(/\n```$/, '');
    const questionsList = JSON.parse(generatedText).questions;

    // 5. Create the interview in the database, now including the resume URL
    const jobDescriptionForDb = `Interview based on resume: ${resumeText.substring(0, 100)}...`;
    const { data: interviewData, error: interviewError } = await supabase.from('interviews').insert({
      user_id: user.id,
      job_description: jobDescriptionForDb,
      difficulty: difficulty,
      resume_url: publicUrl // Save the URL to the new column
    }).select('id').single();

    if (interviewError || !interviewData) throw new Error('Failed to create interview session.');
    
    const interviewId = interviewData.id;
    const questionsToInsert = questionsList.map((q: string) => ({ interview_id: interviewId, question_text: q }));
    await supabase.from('questions').insert(questionsToInsert);

    return NextResponse.json({ interviewId });
  } catch (error) {
    console.error("Error in generateFromResume route:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}