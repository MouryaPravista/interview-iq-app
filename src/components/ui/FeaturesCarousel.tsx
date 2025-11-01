'use client'

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChartIcon, 
  CodeIcon,
  SpeakerLoudIcon,
} from '@radix-ui/react-icons';

const features = [
  {
    icon: <CodeIcon className="w-8 h-8" />,
    title: "Hyper-Relevant Questions",
    description: "Stop practicing generic questions. Our AI builds a question set that precisely targets the skills recruiters are looking for."
  },
  {
    icon: <SpeakerLoudIcon className="w-8 h-8" />,
    title: "Comprehensive AI Feedback",
    description: "It's not just what you say, but how you say it. Get feedback on clarity, keyword usage, and communication style."
  },
  {
    icon: <BarChartIcon className="w-8 h-8" />,
    title: "Data-Driven Analytics",
    description: "Don't guess if you're improving. Track your scores over time and see exactly where to focus your efforts."
  }
];

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-[#1C1C1C] p-6 rounded-lg border border-gray-800 h-full">
    <div className="mb-4 text-[#10B981]">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
    <p className="text-gray-400 text-sm">{description}</p>
  </div>
);

export function FeaturesCarousel() {
  const [width, setWidth] = useState(0);
  const carousel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (carousel.current) {
      // Calculate the total scrollable width
      setWidth(carousel.current.scrollWidth - carousel.current.offsetWidth);
    }
  }, []);

  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">A Smarter Way to Prepare</h2>
            <p className="text-gray-400 mt-2">Core features designed for your success.</p>
        </div>
        
        <motion.div ref={carousel} className="cursor-grab overflow-hidden" whileTap={{ cursor: "grabbing" }}>
          <motion.div 
            drag="x"
            dragConstraints={{ right: 0, left: -width }}
            className="flex gap-8"
          >
            {features.map((feature, i) => (
              <motion.div key={i} className="min-w-[90%] sm:min-w-[45%] md:min-w-[31%]">
                <FeatureCard 
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}