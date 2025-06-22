import React from 'react';

export default function PostAJobCTA() {
  return (
    <section className="mt-8 flex w-full flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 py-12 text-center sm:py-16">
      <h2 className="mb-4 text-2xl font-bold text-gray-900 sm:text-4xl">
        Are you hiring locally?
      </h2>
      <p className="mx-auto mb-8 max-w-xl text-base text-gray-700 sm:text-xl">
        Post your job and reach real people in your community.
      </p>
      <a
        href="#"
        className="rounded-lg bg-purple-700 px-8 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
        aria-label="Post a job"
      >
        Post a Job
      </a>
    </section>
  );
}
