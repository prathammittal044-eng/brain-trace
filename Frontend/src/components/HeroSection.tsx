import React from 'react';
import { motion } from 'motion/react';
import { ScrollRevealContainer, ScrollRevealItem } from './ScrollReveal';

interface HeroSectionProps {
  onOpenModal: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenModal }) => {
  return (
    <section className="relative min-h-screen w-full bg-[#080706] text-white flex flex-col justify-between overflow-hidden pt-28 pb-16">
      
      {/* Background Video with Low Opacity */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
        // src="https://v1.pinimg.com/videos/iht/expMp4/4b/26/f7/4b26f7e8e6bb575a75ee6c4677bb429c_720w.mp4"
      />

      {/* Subtle Dark Gradient Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080706] via-transparent to-[#080706]/70 pointer-events-none" />

      <ScrollRevealContainer 
        staggerDelay={0.15}
        delayChildren={0.1}
        amount={0.15}
        className="relative z-10 max-w-6xl ml-0 mr-auto px-6 sm:px-10 lg:px-16 text-left flex-1 flex flex-col items-start justify-center my-auto w-full"
      >
        
        {/* Main Headline Group */}
        <ScrollRevealItem className="space-y-2 mb-6 text-left w-full">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight font-normal leading-tight text-left">
            <span className="block font-serif-italic font-normal text-amber-100/90 tracking-normal drop-shadow-lg py-1">
              India’s AI for
            </span>
            <span className="block font-bold text-white tracking-tight text-3xl sm:text-5xl md:text-6xl lg:text-[62px] leading-tight mt-1">
              Patients, Caretakers and Healthcare Professionals
            </span>
          </h1>
        </ScrollRevealItem>

        {/* Subtitle */}
        <ScrollRevealItem className="max-w-2xl text-neutral-300 text-base sm:text-lg md:text-xl font-normal leading-relaxed mb-8 sm:mb-10 text-left">
          Powered by research-grade MRI datasets, explainable AI, and an intelligent multi-stage pipeline transforming brain scans into transparent clinical insights within seconds.
        </ScrollRevealItem>

        {/* CTA Button */}
        <ScrollRevealItem className="flex flex-col sm:flex-row items-start gap-4 mb-12">
          <button
            onClick={onOpenModal}
            className="px-8 py-3.5 bg-white hover:bg-neutral-100 text-black font-semibold text-base rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-2xl hover:shadow-white/20 flex items-center gap-2 cursor-pointer"
          >
            Try BrainTrace
          </button>
        </ScrollRevealItem>

      </ScrollRevealContainer>

    </section>
  );
};
