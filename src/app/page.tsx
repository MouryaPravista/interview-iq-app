import Link from 'next/link';
import { 
  BarChartIcon, 
  CodeIcon,
  SpeakerLoudIcon,
  UploadIcon,
  RocketIcon,
  TargetIcon,
} from '@radix-ui/react-icons';
import { LogoIcon } from '@/components/ui/LogoIcon';
import { AnimatedHeroCard } from '@/components/ui/AnimatedHeroCard';

// Reusable Component for Feature Cards
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-[#1C1C1C] p-6 rounded-lg border border-gray-800 transition-transform hover:-translate-y-1">
    <div className="mb-4 text-[#10B981] w-8 h-8">
      {icon}
    </div>
    <h3 className="text-lg font-bold mb-2 text-white">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
  </div>
);

// Reusable Component for "How It Works" Section
const HowItWorksStep = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="flex flex-col items-center text-center px-4 py-2">
    <div className="w-16 h-16 flex items-center justify-center bg-gray-900/50 rounded-full mb-5 border border-gray-700 transition-all duration-300 hover:border-teal-500/50 hover:scale-110">
      <div className="text-teal-400">
        {icon}
      </div>
    </div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-400 text-sm max-w-[220px] leading-relaxed">{description}</p>
  </div>
);

// --- The Main Landing Page Component ---
export default function LandingPage() {
  return (
    <div className="bg-[#111111] text-white min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-4 border-b border-gray-800">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="font-bold text-xl flex items-center gap-2">
            <LogoIcon />
            Interview IQ
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-300 hover:text-white transition-colors">Log In</Link>
            <Link href="/signup" className="bg-[#10B981] text-black font-bold py-2 px-4 rounded-md hover:bg-teal-400 transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                Speak with Confidence. Interview with a Plan.
              </h1>
              <p className="text-lg text-gray-400 mb-8 max-w-xl">
                Interview IQ is your personal AI coach. We help you practice, find your weak spots, and build the skills you need to walk into any interview feeling prepared.
              </p>
              <div className="flex">
                <Link href="/signup" className="bg-[#10B981] text-black font-bold py-3 px-6 rounded-md hover:bg-teal-400 transition-transform hover:scale-105">
                  Start My Journey
                </Link>
              </div>
            </div>
            
            <AnimatedHeroCard />

          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-black/20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-16">Your Path to Interview Mastery</h2>
            <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 lg:grid-cols-4 sm:gap-x-8">
              <HowItWorksStep icon={<UploadIcon width={28} height={28}/>} title="Provide Context" description="Paste a job description or upload your resume for tailored questions." />
              <HowItWorksStep icon={<SpeakerLoudIcon width={28} height={28}/>} title="Practice Live" description="Engage in a mock interview with our advanced AI, just like the real thing." />
              <HowItWorksStep icon={<TargetIcon width={28} height={28}/>} title="Get Instant Feedback" description="Receive a detailed breakdown of your performance and actionable advice." />
              <HowItWorksStep icon={<RocketIcon width={28} height={28}/>} title="Track & Improve" description="Analyze your progress over time to pinpoint and eliminate weaknesses." />
            </div>
          </div>
        </section>

        {/* Features Section - UPDATED */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">A Smarter Way to Prepare</h2>
                <p className="text-gray-400 mt-2">Core features designed for your success.</p>
            </div>
            {/* Responsive grid for features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<CodeIcon className="w-full h-full" />}
                title="Hyper-Relevant Questions"
                description="Stop practicing generic questions. Our AI builds a question set that precisely targets the skills recruiters are looking for."
              />
              <FeatureCard 
                icon={<SpeakerLoudIcon className="w-full h-full" />}
                title="Comprehensive AI Feedback"
                description="It's not just what you say, but how you say it. Get feedback on clarity, keyword usage, and communication style."
              />
              <FeatureCard 
                icon={<BarChartIcon className="w-full h-full" />}
                title="Data-Driven Analytics"
                description="Don't guess if you're improving. Track your scores over time and see exactly where to focus your efforts."
              />
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800">
        <div className="container mx-auto px-6 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} Interview IQ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}