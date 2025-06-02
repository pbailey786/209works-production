import React from "react";

const testimonials = [
  {
    quote: "I found my dream job just a few blocks from home. No more endless remote listings!",
    name: "Sarah L.",
    role: "Marketing Specialist",
  },
  {
    quote: "As a local business, we finally reached real candidates in our area. Super easy to use!",
    name: "Tom R.",
    role: "Owner, Main Street Bakery",
  },
  {
    quote: "The process was fast and simple. I love supporting my community and working close to home.",
    name: "Jasmine P.",
    role: "Graphic Designer",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="w-full py-12 sm:py-16 bg-purple-50 flex flex-col items-center justify-center text-center">
      <h2 className="text-2xl sm:text-4xl font-bold mb-8 text-gray-900">What Locals Are Saying</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl w-full">
        {testimonials.map((t, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 sm:p-8 shadow-md border border-purple-100 flex flex-col items-center">
            <div className="text-lg italic text-gray-700 mb-4" aria-label={`Testimonial from ${t.name}`}>“{t.quote}”</div>
            <div className="font-semibold text-purple-700">{t.name}</div>
            <div className="text-xs text-gray-500">{t.role}</div>
          </div>
        ))}
      </div>
    </section>
  );
} 