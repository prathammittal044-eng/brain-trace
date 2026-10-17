import React from 'react';
import { Sparkles, Brain, FileCheck2, Compass } from 'lucide-react';
import { ScrollRevealContainer, ScrollRevealItem } from './ScrollReveal';

interface ResearchSectionProps {
  onOpenModal?: () => void;
}

export const ResearchSection: React.FC<ResearchSectionProps> = () => {
  const stats = [
    {
      icon: <Brain className="w-5 h-5 text-white" />,
      title: 'AI-Assisted Brain Health',
      subtitle: 'Early detection & screening'
    },
    {
      icon: <FileCheck2 className="w-5 h-5 text-white" />,
      title: 'Explainable MRI Reports',
      subtitle: 'Grad-CAM visual insights'
    },
    {
      icon: <Compass className="w-5 h-5 text-white" />,
      title: 'Specialist Care Navigation',
      subtitle: 'Seamless expert referrals'
    }
  ];

  return (
    <section id="mission" className="py-24 bg-[#FFFFFF] text-[#09090b] relative border-b border-neutral-100">
      <ScrollRevealContainer 
        staggerDelay={0.15}
        delayChildren={0.05}
        amount={0.15}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        
        {/* Mission / Why BrainTrace Banner */}
        <ScrollRevealItem className="bg-white text-[#09090b] rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(9,9,11,1)] border-2 border-[#09090b]">
          
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 text-neutral-900 border border-neutral-300 text-xs font-extrabold uppercase tracking-widest mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#09090b]" /> WHY BRAINTRACE?
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6 text-[#09090b]">
              Helping Patients Navigate the Journey from Early Cognitive Concerns to Specialist Care
            </h2>

            <p className="text-neutral-600 text-base sm:text-lg leading-relaxed mb-10 max-w-3xl font-normal">
              Cognitive decline is often recognized too late, not because effective care doesn't exist, but because the path from the first symptoms to the right specialist is fragmented and confusing. BrainTrace brings AI-assisted screening, explainable MRI analysis, cognitive assessments, and personalized care navigation together into one unified brain health platform, helping patients, caregivers, and clinicians make informed decisions faster.
            </p>

            {/* Staggered Stat Cards Grid */}
            <ScrollRevealContainer 
              staggerDelay={0.12}
              delayChildren={0.1}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-neutral-200"
            >
              {stats.map((stat, idx) => (
                <ScrollRevealItem key={idx}>
                  <div className="bg-neutral-50 border-2 border-[#09090b] p-5 rounded-2xl flex items-start gap-3.5 shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] transition-transform hover:-translate-y-0.5">
                    <div className="p-2.5 bg-[#09090b] text-white rounded-xl shrink-0">
                      {stat.icon}
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-[#09090b] leading-snug">
                        {stat.title}
                      </div>
                      <div className="text-xs text-neutral-600 mt-1 font-medium">
                        {stat.subtitle}
                      </div>
                    </div>
                  </div>
                </ScrollRevealItem>
              ))}
            </ScrollRevealContainer>

          </div>

        </ScrollRevealItem>

      </ScrollRevealContainer>
    </section>
  );
};


