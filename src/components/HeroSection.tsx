import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/jobs?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/jobs');
    }
  };

  return (
    <section className="flex w-full flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 py-16 text-center sm:py-20">
      <div className="mb-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/80 px-4 py-2 backdrop-blur-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-600">
            <span className="text-xs font-bold text-white">AI</span>
          </div>
          <span className="text-sm font-semibold text-purple-700">
            Powered by JobsGPT
          </span>
        </div>
      </div>
      <h1 className="mb-4 text-4xl font-extrabold text-gray-900 sm:text-6xl">
        Jobs That Are <span className="text-purple-600">Actually Local</span>
      </h1>
      <p className="mx-auto mb-8 max-w-xl text-base text-gray-700 sm:text-2xl">
        Ask our AI anything about jobs in the 209 area. Your dream job is just a
        conversation away.
      </p>
      <form
        className="flex w-full max-w-2xl flex-col justify-center gap-4 sm:flex-row"
        role="search"
        aria-label="Job search form"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          placeholder="Ask me about jobs in the 209 area..."
          aria-label="Ask about jobs in your area"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-lg bg-purple-700 px-8 py-4 text-base font-semibold text-white transition hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label="Search Jobs"
        >
          Search Jobs
        </button>
      </form>
    </section>
  );
}
