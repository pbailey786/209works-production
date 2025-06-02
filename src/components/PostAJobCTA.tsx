import React from "react";

export default function PostAJobCTA() {
  return (
    <section className="w-full py-12 sm:py-16 bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col items-center justify-center text-center mt-8">
      <h2 className="text-2xl sm:text-4xl font-bold mb-4 text-gray-900">Are you hiring locally?</h2>
      <p className="text-base sm:text-xl text-gray-700 mb-8 max-w-xl mx-auto">
        Post your job and reach real people in your community.
      </p>
      <a
        href="#"
        className="px-8 py-4 rounded-lg bg-purple-700 text-white font-semibold text-lg shadow-md hover:bg-purple-800 transition focus:outline-none focus:ring-2 focus:ring-purple-500"
        aria-label="Post a job"
      >
        Post a Job
      </a>
    </section>
  );
} 