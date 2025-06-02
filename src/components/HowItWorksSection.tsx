import React from "react";

const steps = [
  {
    icon: "🔍",
    title: "Search Local Jobs",
    description: "Browse jobs that are truly in your area—no remote spam, just real local opportunities.",
  },
  {
    icon: "💬",
    title: "Apply Easily",
    description: "Quickly apply to jobs with a simple process. No endless forms or hoops to jump through.",
  },
  {
    icon: "🤝",
    title: "Get Hired Nearby",
    description: "Connect with local employers and land a job close to home. Support your community!",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="w-full py-12 sm:py-16 bg-white flex flex-col items-center justify-center text-center">
      <h2 className="text-2xl sm:text-4xl font-bold mb-8 text-gray-900">How It Works</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl w-full">
        {steps.map((step, idx) => (
          <div key={idx} className="bg-purple-50 rounded-xl p-6 sm:p-8 flex flex-col items-center shadow-sm border border-purple-100">
            <div className="text-4xl mb-4" aria-label={step.title + ' icon'}>{step.icon}</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-purple-700">{step.title}</h3>
            <p className="text-gray-700 text-base">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
} 