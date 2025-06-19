import Link from 'next/link';
import { 
  BarChartIcon, 
  CodeIcon,
  SpeakerLoudIcon,
} from '@radix-ui/react-icons';
import { LogoIcon } from '@/components/ui/LogoIcon'; // Import the new LogoIcon

// Reusable Component for Feature Cards (New Style)
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-[#111111] p-6 rounded-lg border border-gray-800">
    <div className="mb-4">{icon}</div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-400 text-sm">{description}</p>
  </div>
);

// Reusable Component for "How It Works" Steps (New Style)
const HowItWorksStep = ({ number, title, description }: { number: string, title: string, description: string }) => (
  <div className="flex flex-col items-center text-center">
    <div className="w-10 h-10 flex items-center justify-center bg-gray-800 text-white font-semibold rounded-full text-md mb-4 border border-gray-700">
      {number}
    </div>
    <h3 className="text-md font-semibold mb-2">{title}</h3>
    <p className="text-gray-500 text-sm max-w-xs">{description}</p>
  </div>
);

// --- The Main Landing Page Component ---
export default function LandingPage() {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="font-bold text-xl flex items-center gap-2">
            <LogoIcon /> {/* <-- CORRECTED LOGO */}
            Interview IQ
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-300 hover:text-white transition-colors">Log In</Link>
            <Link href="/signup" className="bg-white text-black font-bold py-2 px-4 rounded-md hover:bg-gray-200 transition-colors">
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
            {/* Left Column */}
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                Ace Your Next Interview with AI-Powered Practice
              </h1>
              <p className="text-lg text-gray-400 mb-8 max-w-xl">
                Paste a job description to get tailored questions, and improve with real-time analysis of your communication skills and technical knowledge.
              </p>
              <div className="flex space-x-4">
                <Link href="/signup" className="bg-white text-black font-bold py-3 px-6 rounded-md hover:bg-gray-200 transition-colors">
                  Get Started
                </Link>
                <Link href="#how-it-works" className="border border-gray-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-gray-900 transition-colors">
                  How It Works
                </Link>
              </div>
            </div>
            {/* Right Column (Graphical Element) */}
            <div className="bg-[#111111] p-8 rounded-xl border border-gray-800 flex flex-col items-center justify-center h-full">
              <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mb-6 border border-gray-700">
                <SpeakerLoudIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold">AI Interview Simulation</h2>
              <p className="text-gray-400 mt-2 text-center">Real-time feedback on your responses, body language, and communication skills.</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<CodeIcon className="w-8 h-8 text-gray-400" />}
                title="Job-Specific Questions"
                description="Our AI analyzes any job description to create a truly tailored interview experience."
              />
              <FeatureCard 
                icon={<LogoIcon className="w-8 h-8 text-gray-400" />} // Using new logo here too for consistency
                title="AI Interview Simulation"
                description="Engage with an AI that asks relevant questions and provides feedback just like a real interviewer."
              />
              <FeatureCard 
                icon={<BarChartIcon className="w-8 h-8 text-gray-400" />}
                title="Performance Analytics"
                description="Get detailed scores and actionable feedback to track your improvement over time."
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">How It Works</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-12">
              <HowItWorksStep number="1" title="Paste Job Description" description="Enter the details of the job you're applying for." />
              <HowItWorksStep number="2" title="Configure Interview" description="Choose your desired difficulty and duration." />
              <HowItWorksStep number="3" title="Practice Interview" description="Engage in a mock interview with our AI." />
              <HowItWorksStep number="4" title="Review Results" description="Get detailed feedback and improvement suggestions." />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800">
        <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                <div className="col-span-1 md:col-span-2">
                    <h3 className="font-bold text-lg mb-2">Interview IQ</h3>
                    <p className="text-gray-400 text-sm">Ace your next interview with AI-powered practice.</p>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-200 mb-3">Company</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="#" className="text-gray-400 hover:text-white">About</Link></li>
                        <li><Link href="#" className="text-gray-400 hover:text-white">Careers</Link></li>
                        <li><Link href="#" className="text-gray-400 hover:text-white">Contact</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-200 mb-3">Legal</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="#" className="text-gray-400 hover:text-white">Privacy</Link></li>
                        <li><Link href="#" className="text-gray-400 hover:text-white">Terms</Link></li>
                        <li><Link href="#" className="text-gray-400 hover:text-white">Cookies</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-200 mb-3">Support</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="#" className="text-gray-400 hover:text-white">Help</Link></li>
                        <li><Link href="#" className="text-gray-400 hover:text-white">FAQ</Link></li>
                    </ul>
                </div>
            </div>
            <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
                <p>© {new Date().getFullYear()} Interview IQ. All rights reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}