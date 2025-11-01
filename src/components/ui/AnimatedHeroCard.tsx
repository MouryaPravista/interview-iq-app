'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const questions = [
  "Describe a challenging project you worked on.",
  "Tell me about a time you disagreed with a manager.",
  "What are your biggest strengths and weaknesses?",
  "How do you handle tight deadlines and pressure?",
  "Explain a complex technical concept to a non-technical person."
];

export function AnimatedHeroCard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % questions.length);
    }, 4000); // Change question every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      // Add a continuous floating animation
      animate={{ y: ["-8px", "8px"] }}
      transition={{
        duration: 4,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      }}
      // Add a responsive hover effect
      whileHover={{ scale: 1.03, y: -15, transition: { duration: 0.2 } }}
      className="bg-[#1C1C1C] p-8 rounded-xl border border-gray-800 flex flex-col items-center justify-center h-full cursor-pointer"
    >
      <div className="w-full max-w-sm">
        <div className="bg-black/50 p-4 rounded-md mb-4 border border-gray-700 h-20 flex items-center justify-center text-center">
            <AnimatePresence mode="wait">
                <motion.p
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.5 }}
                    className="text-sm text-gray-400"
                >
                    Q: {questions[index]}
                </motion.p>
            </AnimatePresence>
        </div>
        <svg width="100%" height="80" viewBox="0 0 300 80" className="mb-4 text-gray-700">
            <path d="M 0 40 Q 37.5 10, 75 40 T 150 40 T 225 40 T 300 40" stroke="currentColor" fill="none" strokeWidth="2">
                <animate attributeName="d" values="M 0 40 Q 37.5 10, 75 40 T 150 40 T 225 40 T 300 40; M 0 40 Q 37.5 70, 75 40 T 150 40 T 225 40 T 300 40; M 0 40 Q 37.5 10, 75 40 T 150 40 T 225 40 T 300 40" dur="2s" repeatCount="indefinite" />
            </path>
        </svg>
        <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-black/50 p-3 rounded-md border border-teal-500/20 text-teal-400 opacity-60"><p className="font-semibold text-sm">Strengths</p></div>
            <div className="bg-black/50 p-3 rounded-md border border-teal-500/20 text-teal-400 opacity-60"><p className="font-semibold text-sm">Improvements</p></div>
            <div className="bg-black/50 p-3 rounded-md border border-teal-500/20 text-teal-400 opacity-60"><p className="font-semibold text-sm">Score</p></div>
        </div>
      </div>
    </motion.div>
  );
}