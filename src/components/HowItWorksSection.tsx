import React from 'react';

const steps = [
  {
    icon: '🔍',
    title: 'Search Local Jobs',
    description:
      'Browse jobs that are truly in your area—no remote spam, just real local opportunities.',
  },
  {
    icon: '💬',
    title: 'Apply Easily',
    description:
      'Quickly apply to jobs with a simple process. No endless forms or hoops to jump through.',
  },
  {
    icon: '🤝',
    title: 'Get Hired Nearby',
    description:
      'Connect with local employers and land a job close to home. Support your community!',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="flex w-full flex-col items-center justify-center bg-white py-12 text-center sm:py-16">
      <h2 className="mb-8 text-2xl font-bold text-gray-900 sm:text-4xl">
        How It Works
      </h2>
      <div className="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center rounded-xl border border-purple-100 bg-purple-50 p-6 shadow-sm sm:p-8"
          >
            <div className="mb-4 text-4xl" aria-label={step.title + ' icon'}>
              {step.icon}
            </div>
            <h3 className="mb-2 text-lg font-semibold text-purple-700 sm:text-xl">
              {step.title}
            </h3>
            <p className="text-base text-gray-700">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
