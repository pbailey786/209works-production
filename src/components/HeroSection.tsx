import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/jobs?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/jobs");
    }
  };

  return (
    <section className="w-full py-16 sm:py-20 bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col items-center justify-center text-center">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-purple-200 mb-4">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
          <span className="text-purple-700 font-semibold text-sm">Powered by JobsGPT</span>
        </div>
      </div>
      <h1 className="text-4xl sm:text-6xl font-extrabold mb-4 text-gray-900">
        Jobs That Are <span className="text-purple-600">Actually Local</span>
      </h1>
      <p className="text-base sm:text-2xl text-gray-700 mb-8 max-w-xl mx-auto">
        Ask our AI anything about jobs in the 209 area. Your dream job is just a conversation away.
      </p>
      <form
        className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl justify-center"
        role="search"
        aria-label="Job search form"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          placeholder="Ask me about jobs in the 209 area..."
          aria-label="Ask about jobs in your area"
          className="flex-1 px-4 py-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="px-8 py-4 rounded-lg bg-purple-700 text-white font-semibold hover:bg-purple-800 transition text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label="Search Jobs"
        >
          Search Jobs
        </button>
      </form>
    </section>
  );
} 