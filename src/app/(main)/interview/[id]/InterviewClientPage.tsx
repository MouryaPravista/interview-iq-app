'use client'

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Webcam from "react-webcam";
import WarningBanner from '@/components/ui/WarningBanner';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import type { ISpeechRecognition, ISpeechRecognitionEvent, ISpeechRecognitionErrorEvent, ISpeechRecognitionStatic } from '@/lib/types';
import { Pencil1Icon, CheckIcon, Cross1Icon } from '@radix-ui/react-icons';

interface Question { id: string; question_text: string; }
interface InterviewData { id: string; questions: Question[]; }

export default function InterviewClientPage({ id }: { id: string }) {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const faceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [faceDetector, setFaceDetector] = useState<FaceDetector | undefined>(undefined);
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasBeenWarned, setHasBeenWarned] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState('');

  const disqualifyAndMoveNext = useCallback(async (reason: string) => {
    if (!interviewData || isAnalyzing) return;
    if (isListening) recognitionRef.current?.stop();
    const finalTranscript = `[Answer Disqualified: ${reason}]`;
    await fetch(`/api/interview/answer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: interviewData.questions[currentQuestionIndex].id, userAnswer: finalTranscript }) });
    setTranscript('');
    if (currentQuestionIndex < interviewData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsAnalyzing(true);
      try {
        await fetch('/api/interview/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ interviewId: id }) });
        router.push(`/results/${id}`);
      } catch (err) {
        setIsAnalyzing(false);
        toast.error(err instanceof Error ? err.message : "An error occurred during final analysis.");
      }
    }
  }, [interviewData, isAnalyzing, isListening, currentQuestionIndex, id, router]);

  const triggerWarning = useCallback((message: string) => { if (!hasBeenWarned) { setWarningMessage(message); setShowWarning(true); setHasBeenWarned(true); } }, [hasBeenWarned]);

  // --- CONSOLIDATED AND CORRECTED SETUP HOOK ---
  useEffect(() => {
    const initialize = async () => {
      // 1. Initialize Face Detector
      try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
        const detector = await FaceDetector.createFromOptions(vision, { baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite` }, runningMode: 'VIDEO' });
        setFaceDetector(detector);
      } catch (e) { console.error("Error initializing MediaPipe:", e); }

      // 2. Fetch Interview Data
      const supabase = createClient();
      const { data, error } = await supabase.from('interviews').select(`id, questions (id, question_text)`).eq('id', id).single();
      if (error || !data) {
        toast.error("Could not load interview data.");
        router.push('/dashboard');
        return;
      }
      setInterviewData(data as InterviewData);

      // 3. Set up Speech Recognition
      const SpeechRecognition: ISpeechRecognitionStatic | undefined = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition: ISpeechRecognition = new SpeechRecognition();
        recognition.continuous = true; recognition.interimResults = true;
        recognition.onresult = (event) => { let finalTranscript = ''; for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript; } setTranscript(prev => prev + finalTranscript); };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => { toast.error(`Speech recognition error: ${event.error}.`); };
        recognitionRef.current = recognition;
      }
      
      // 4. Set loading to false only after all setup is complete
      setIsLoading(false);
    };
    
    void initialize();
  }, [id, router]);

  // --- Hook for anti-cheating features ---
  useEffect(() => {
    const handleVisibilityChange = () => { if (document.hidden) { void (hasBeenWarned ? disqualifyAndMoveNext("Tab Switched") : triggerWarning("Please remain on this tab. Switching will disqualify the question.")); } };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => { document.removeEventListener('visibilitychange', handleVisibilityChange); if (faceDetectionIntervalRef.current) clearInterval(faceDetectionIntervalRef.current); };
  }, [hasBeenWarned, disqualifyAndMoveNext, triggerWarning]);

  const startFaceDetectionLoop = useCallback(() => {
    if (faceDetectionIntervalRef.current) clearInterval(faceDetectionIntervalRef.current);
    faceDetectionIntervalRef.current = setInterval(() => {
      if (faceDetector && webcamRef.current?.video && webcamRef.current.video.readyState === 4) {
        const detections = faceDetector.detectForVideo(webcamRef.current.video, Date.now());
        if (detections.detections.length > 1) { void (hasBeenWarned ? disqualifyAndMoveNext("Multiple faces detected") : triggerWarning("Multiple faces detected. Please ensure you are alone.")); }
      }
    }, 2500);
  }, [faceDetector, hasBeenWarned, disqualifyAndMoveNext, triggerWarning]);

  const handleToggleListening = () => { if (isEditing) setIsEditing(false); if (isListening) { recognitionRef.current?.stop(); } else { setTranscript(''); recognitionRef.current?.start(); } setIsListening(!isListening); };
  
  const handleNextQuestion = async () => {
    if (!interviewData) return;
    if (isListening) recognitionRef.current?.stop();
    const finalTranscript = isEditing ? editedTranscript : transcript;
    await fetch(`/api/interview/answer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: interviewData.questions[currentQuestionIndex].id, userAnswer: finalTranscript }) });
    setTranscript(''); setEditedTranscript(''); setIsEditing(false);
    if (currentQuestionIndex < interviewData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsAnalyzing(true);
      try {
        await fetch('/api/interview/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ interviewId: id }) });
        router.push(`/results/${id}`);
      } catch (err) { setIsAnalyzing(false); toast.error(err instanceof Error ? err.message : "An error occurred during final analysis."); }
    }
  };

  const handleEditClick = () => { setEditedTranscript(transcript); setIsEditing(true); };
  const handleSaveEdit = () => { setTranscript(editedTranscript); setIsEditing(false); };
  const handleCancelEdit = () => { setIsEditing(false); setEditedTranscript(''); };
  
  if (isLoading) return <div className="text-center p-10 font-semibold text-lg">Loading Interview & Security Features...</div>;
  if (!interviewData) return <div className="text-center p-10">Interview not found.</div>;
  const currentQuestion = interviewData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === interviewData.questions.length - 1;

  return (
    <>
      {showWarning && <WarningBanner message={warningMessage} onClose={() => setShowWarning(false)} />}
      <div className={`flex flex-col md:flex-row gap-8 max-w-6xl mx-auto ${showWarning ? 'pt-16' : 'pt-4'}`}>
        <div className="md:w-2/3 space-y-4">
          <div className="relative bg-black aspect-video rounded-lg border border-gray-700 overflow-hidden">
            <Webcam ref={webcamRef} mirrored={true} className="absolute top-0 left-0 w-full h-full object-cover" onUserMedia={startFaceDetectionLoop} videoConstraints={{ width: 1280, height: 720 }}/>
          </div>
          <div className="flex justify-center gap-4">
            <button onClick={handleToggleListening} disabled={isAnalyzing} className={`px-6 py-3 rounded-lg font-bold text-white disabled:bg-gray-600 transition-colors ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>{isListening ? 'Stop Answering' : 'Start Answering'}</button>
            <button onClick={handleNextQuestion} disabled={isAnalyzing} className="px-6 py-3 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed flex items-center justify-center transition-colors">{isAnalyzing ? "Analyzing..." : (isLastQuestion ? 'Finish & See Results' : 'Save & Next Question')}</button>
          </div>
        </div>
        <div className="md:w-1/3 bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4 flex flex-col">
          <h2 className="font-semibold text-lg">Question {currentQuestionIndex + 1} of {interviewData.questions.length}</h2>
          <p className="text-gray-200">{currentQuestion.question_text}</p>
          <hr className="border-gray-600"/>
          <div className="flex-grow flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Your Answer (Transcript):</h3>
                {!isListening && transcript && !isEditing && (<button onClick={handleEditClick} className="text-gray-400 hover:text-white p-1 rounded-md flex items-center gap-1 text-sm"><Pencil1Icon /> Edit</button>)}
            </div>
            {isEditing ? (
              <div className="flex-grow flex flex-col gap-2">
                <textarea value={editedTranscript} onChange={(e) => setEditedTranscript(e.target.value)} className="w-full flex-grow bg-[#1C1C1C] border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                <div className="flex justify-end gap-2">
                    <button onClick={handleCancelEdit} className="text-sm px-3 py-1 rounded-md bg-gray-600 hover:bg-gray-500 flex items-center gap-1"><Cross1Icon /> Cancel</button>
                    <button onClick={handleSaveEdit} className="text-sm px-3 py-1 rounded-md bg-green-600 hover:bg-green-500 flex items-center gap-1"><CheckIcon /> Save</button>
                </div>
              </div>
            ) : ( <p className="text-gray-400 min-h-[100px] flex-grow">{transcript || "..."}</p> )}
          </div>
        </div>
      </div>
    </>
  );
}