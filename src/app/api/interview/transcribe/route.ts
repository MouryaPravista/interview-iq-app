import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI();

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // 2. Get the audio file from the form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return new NextResponse(JSON.stringify({ error: 'No audio file provided' }), { status: 400 });
    }

    // 3. Call the OpenAI Whisper API for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1', // This is the primary Whisper model
    });

    // 4. Return the transcribed text
    return NextResponse.json({ transcript: transcription.text });

  } catch (error) {
    console.error("Error in transcription route:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}