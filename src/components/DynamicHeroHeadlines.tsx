'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface HeroMessage {
  headline: string;
  subheadline: string;
}

const heroMessages: HeroMessage[] = [
  {
    headline: "Why Compete with the Whole Country?",
    subheadline: "You're not looking for a job in New York. 209 Works connects you with real employers hiring right here in the Central Valley — no national noise, just local results."
  },
  {
    headline: "Local Jobs. Less Competition. Better Odds.",
    subheadline: "Skip the resume pileups on the big sites. We focus only on the 209 — so your application actually gets seen."
  },
  {
    headline: "Find Work That Fits Your Life in the 209",
    subheadline: "From warehouse shifts to healthcare gigs, discover flexible, local jobs that match your lifestyle — not someone else's algorithm."
  },
  {
    headline: "Get Hired Without the National Headache",
    subheadline: "Tired of ghost jobs and out-of-state recruiters? We're local, just like you. Real employers, real openings, real fast."
  },
  {
    headline: "Built for the Central Valley. Not Silicon Valley.",
    subheadline: "Forget generic job boards. 209 Works is made for our communities — with real roles and better matches from nearby employers."
  }
];

export default function DynamicHeroHeadlines() {
  // Default to first message for SSR and SEO
  const [currentMessage, setCurrentMessage] = useState<HeroMessage>(heroMessages[0]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Random selection on client-side mount
    const randomIndex = Math.floor(Math.random() * heroMessages.length);
    setCurrentMessage(heroMessages[randomIndex]);
    setIsLoaded(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center"
    >
      {/* Main Headline */}
      <motion.h1 
        className="mb-8 font-inter text-5xl font-black uppercase leading-tight tracking-tight text-[#9fdf9f] sm:text-6xl md:text-7xl"
        key={currentMessage.headline} // Key for re-animation when content changes
        initial={isLoaded ? { opacity: 0, y: 20 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {currentMessage.headline}
      </motion.h1>

      {/* Subtitle */}
      <motion.p 
        className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-gray-300 sm:text-2xl"
        key={currentMessage.subheadline} // Key for re-animation when content changes
        initial={isLoaded ? { opacity: 0, y: 20 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {currentMessage.subheadline}
      </motion.p>
    </motion.div>
  );
}
