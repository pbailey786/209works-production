import React from 'react';

const testimonials = [
  {
    quote:
      'I found my dream job just a few blocks from home. No more endless remote listings!',
    name: 'Sarah L.',
    role: 'Marketing Specialist',
  },
  {
    quote:
      'As a local business, we finally reached real candidates in our area. Super easy to use!',
    name: 'Tom R.',
    role: 'Owner, Main Street Bakery',
  },
  {
    quote:
      'The process was fast and simple. I love supporting my community and working close to home.',
    name: 'Jasmine P.',
    role: 'Graphic Designer',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="flex w-full flex-col items-center justify-center bg-purple-50 py-12 text-center sm:py-16">
      <h2 className="mb-8 text-2xl font-bold text-gray-900 sm:text-4xl">
        What Locals Are Saying
      </h2>
      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
        {testimonials.map((t, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center rounded-xl border border-purple-100 bg-white p-6 shadow-md sm:p-8"
          >
            <div
              className="mb-4 text-lg italic text-gray-700"
              aria-label={`Testimonial from ${t.name}`}
            >
              “{t.quote}”
            </div>
            <div className="font-semibold text-purple-700">{t.name}</div>
            <div className="text-xs text-gray-500">{t.role}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
