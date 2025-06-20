import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JobsGPT - AI Job Search | 209 Works',
  description: 'Chat with Rust Moreno, your AI job search assistant for the 209 area. Find jobs in Stockton, Modesto, Tracy, and throughout the Central Valley.',
  keywords: 'AI job search, 209 area jobs, Stockton jobs, Modesto jobs, Central Valley careers, conversational job search',
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden">
      {children}
    </div>
  );
}
