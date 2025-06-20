'use client'

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Webcam from "react-webcam";
import WarningBanner from '@/components/ui/WarningBanner';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

interface Question { id: string; question_text: string; }
interface InterviewData { id: string; questions: Question[]; }

export default function InterviewClientPage({ id }: { id: string }) {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
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
  
  const disqualifyAndMoveNext = useCallback(async (reason: string) => {
    if (!interviewData || isAnalyzing) return;
    if (isListening) recognitionRef.current?.stop();
    await fetch(`/api/interview/answer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: interviewData.questions[currentQuestionIndex].id, userAnswer: `[Answer Disqualified: ${reason}]` }) });
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

  useEffect(() => {
    const createFaceDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
        const detector = await FaceDetector.createFromOptions(vision, { baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite` }, runningMode: 'VIDEO' });
        setFaceDetector(detector);
      } catch (e) { console.error("Error initializing MediaPipe FaceDetector:", e); }
    };
    void createFaceDetector();
    const handleVisibilityChange = () => { if (document.hidden) { void (hasBeenWarned ? disqualifyAndMoveNext("Tab Switched") : triggerWarning("Please remain on this tab. Switching again will disqualify the question.")); } };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => { document.removeEventListener('visibilitychange', handleVisibilityChange); if (faceDetectionIntervalRef.current) clearInterval(faceDetectionIntervalRef.current); faceDetector?.close(); };
  }, [hasBeenWarned, disqualifyAndMoveNext, triggerWarning, faceDetector]);

  const startFaceDetectionLoop = useCallback(() => {
    if (faceDetectionIntervalRef.current) clearInterval(faceDetectionIntervalRef.current);
    faceDetectionIntervalRef.current = setInterval(() => {
      if (faceDetector && webcamRef.current?.video && webcamRef.current.video.readyState === 4) {
        const detections = faceDetector.detectForVideo(webcamRef.current.video, Date.now());
        if (detections.detections.length > 1) { void (hasBeenWarned ? disqualifyAndMoveNext("Multiple faces detected") : triggerWarning("Multiple faces detected. Please ensure you are alone.")); }
      }
    }, 2500);
  }, [faceDetector, hasBeenWarned, disqualifyAndMoveNext, triggerWarning]);
  
  useEffect(() => { const fetchInterviewData = async () => { const supabase = createClient(); const { data, error } = await supabase.from('interviews').select(`id, questions (id, question_text)`).eq('id', id).single(); if (error || !data) { toast.error("Could not load interview data."); router.push('/dashboard'); } else { setInterviewData(data as InterviewData); setIsLoading(false); } }; void fetchInterviewData(); }, [id, router]);
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; recognition.interimResults = true;
      recognition.onresult = (event: SpeechRecognitionEvent) => { let finalTranscript = ''; for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript; } setTranscript(prev => prev + finalTranscript); };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: SpeechRecognitionError) => { toast.error(`Speech recognition error: ${event.error}.`); };
      recognitionRef.current = recognition;
    }
  }, []);

  const handleToggleListening = () => { if (isListening) { recognitionRef.current?.stop(); } else { setTranscript(''); recognitionRef.current?.start(); } setIsListening(!isListening); };
  const handleNextQuestion = () => { void disqualifyAndMoveNext("Manually moved to next question"); };

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
            <button onClick={handleToggleListening} disabled={!faceDetector || isAnalyzing} className={`px-6 py-3 rounded-lg font-bold text-white disabled:bg-gray-600 transition-colors ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>{isListening ? 'Stop Answering' : 'Start Answering'}</button>
            <button onClick={handleNextQuestion} disabled={!faceDetector || isAnalyzing} className="px-6 py-3 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed flex items-center justify-center transition-colors">{isAnalyzing ? "Analyzing..." : (isLastQuestion ? 'Finish & See Results' : 'Save & Next Question')}</button>
          </div>
        </div>
        <div className="md:w-1/3 bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
          <h2 className="font-semibold text-lg">Question {currentQuestionIndex + 1} of {interviewData.questions.length}</h2>
          <p className="text-gray-200">{currentQuestion.question_text}</p><hr className="border-gray-600"/><div><h3 className="font-semibold mb-2">Your Answer (Transcript):</h3><p className="text-gray-400 min-h-[100px]">{transcript || "..."}</p></div>
        </div>
      </div>
    </>
  );
}