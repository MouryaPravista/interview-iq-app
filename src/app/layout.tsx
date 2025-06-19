import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast"; // --- IMPORT THE TOASTER ---

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Interview IQ - AI-Powered Interview Practice",
  description: "Ace your next interview with AI-powered mock interviews tailored to specific job descriptions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`}> {/* Changed to pure black for consistency */}
        
        {/* --- ADD THE TOASTER COMPONENT HERE --- */}
        {/* This component will handle rendering all notifications. */}
        {/* We can customize its default appearance for our dark theme. */}
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />

        {children}
      </body>
    </html>
  );
}