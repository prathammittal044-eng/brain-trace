import React, { useState, useEffect } from 'react';
import { Check, ArrowRight, User, HeartHandshake, Stethoscope, ChevronLeft, ChevronRight, Pause, Play, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SolutionsSectionProps {
  onOpenModal: () => void;
}

export const SolutionsSection: React.FC<SolutionsSectionProps> = ({ onOpenModal }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const slides = [
    {
      id: 'patient',
      heading: 'For Patients',
      badge: 'AI-POWERED DEMENTIA SCREENING',
      tagline: 'Detect cognitive decline early, understand your results, and connect with the right specialist—all in one place.',
      description: 'BrainTrace combines AI-powered MRI analysis, cognitive assessment, and explainable reports to help patients identify potential signs of dementia early and take informed next steps with confidence.',
      features: [
        'Upload a brain MRI and receive AI-assisted analysis within seconds',
        'Complete a guided cognitive assessment to complement MRI findings',
        'Understand results through simple AI explanations and Grad-CAM visualizations',
        'Download a comprehensive report and share it directly with specialists',
      ],
      cta: 'Start AI Screening',
      roleLabel: 'Patient Profile',
      icon: <User className="w-20 h-20 text-[#09090b]" />,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
      footerBadge: '✔ Instant AI Analysis Enabled',
    },
    {
      id: 'caregiver',
      heading: 'For Caregivers',
      badge: 'CAREGIVER SUPPORT & TRACKING',
      tagline: 'Monitor your loved one\'s cognitive health without managing scattered reports and appointments.',
      description: 'BrainTrace provides caregivers with a centralized platform to track reports, understand AI-generated insights, and coordinate specialist consultations while staying informed throughout the care journey.',
      features: [
        'Access previous reports and monitor cognitive progression over time',
        'Receive AI-generated explanations in easy-to-understand language',
        'Locate nearby neurologists and dementia specialists',
        'Share reports securely and coordinate consultations with healthcare providers',
      ],
      cta: 'Support a Loved One',
      roleLabel: 'Caregiver Profile',
      icon: <HeartHandshake className="w-20 h-20 text-[#09090b]" />,
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      footerBadge: '✔ Longitudinal Health History',
    },
    {
      id: 'doctor',
      heading: 'For Healthcare Professionals',
      badge: 'CLINICAL DECISION SUPPORT',
      tagline: 'Spend less time reviewing scans and more time treating patients.',
      description: 'BrainTrace delivers AI-assisted MRI classification, explainable Grad-CAM visualizations, cognitive assessment summaries, and structured reports—helping clinicians make faster, more informed decisions.',
      features: [
        'Review AI-generated MRI classification with confidence scores',
        'Inspect Grad-CAM heatmaps highlighting influential brain regions',
        'Access standardized cognitive assessment summaries',
        'Receive structured reports to support clinical decision-making—not replace it',
      ],
      cta: 'Explore Clinical Workflow',
      roleLabel: 'Clinician Profile',
      icon: <Stethoscope className="w-20 h-20 text-[#09090b]" />,
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
      footerBadge: '✔ Grad-CAM Visualizations & DICOM Support',
    },
  ];

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, slides.length]);

  const slide = slides[currentSlide];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.05,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }
    }
  };

  return (
    <section id="solutions" className="py-24 bg-[#FFFFFF] text-[#09090b] relative border-b border-neutral-100">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        
        {/* Section Header */}
        <motion.div 
          variants={itemVariants}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#09090b] leading-tight mb-4">
            Tailored Intelligence for Every Healthcare Partner
          </h2>
          <p className="text-lg text-neutral-600 font-normal">
            Whether you are a patient, caregiver, or clinician, BrainTrace adapts to deliver clear, actionable insights.
          </p>
        </motion.div>

        {/* Role Selector Pills & Controls */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4 mb-8 max-w-5xl mx-auto px-2">
          
          <div className="flex items-center gap-2 flex-wrap">
            {slides.map((item, idx) => {
              const isActive = idx === currentSlide;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentSlide(idx);
                  }}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer border-2 flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#09090b] text-white border-[#09090b] shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-black hover:bg-neutral-50'
                  }`}
                >
                  <span>{item.heading}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 rounded-xl border-2 border-neutral-300 bg-white hover:border-black text-neutral-700 hover:text-black transition-all cursor-pointer"
              title={isPlaying ? "Pause auto-scroll" : "Play auto-scroll"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              className="p-2.5 rounded-xl border-2 border-neutral-300 bg-white hover:border-black text-neutral-700 hover:text-black transition-all cursor-pointer"
              title="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              className="p-2.5 rounded-xl border-2 border-neutral-300 bg-white hover:border-black text-neutral-700 hover:text-black transition-all cursor-pointer"
              title="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </motion.div>

        {/* Slide Carousel Container */}
        <motion.div variants={itemVariants} className="relative overflow-hidden min-h-[520px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
              className="bg-white border-2 border-[#09090b] rounded-3xl p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(9,9,11,1)]"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left Content Column */}
                <div className="lg:col-span-7 space-y-6">
                  
                  <div>
                    <span className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-md border inline-block mb-3 ${slide.badgeColor}`}>
                      {slide.badge}
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-extrabold text-[#09090b] tracking-tight">
                      {slide.heading}
                    </h3>
                  </div>

                  <p className="text-lg sm:text-xl font-semibold text-neutral-800 leading-snug italic">
                    "{slide.tagline}"
                  </p>

                  <p className="text-neutral-600 leading-relaxed text-sm sm:text-base">
                    {slide.description}
                  </p>

                  {/* Features Bullet List */}
                  <div className="space-y-3 pt-1">
                    {slide.features.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#09090b] text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="text-sm font-medium text-neutral-800">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button & Footer Badge */}
                  <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <button
                      onClick={onOpenModal}
                      className="px-6 py-3.5 bg-[#09090b] hover:bg-neutral-800 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                      {slide.cta} <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-100 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-900">
                      <span>{slide.footerBadge}</span>
                    </div>
                  </div>

                </div>

                {/* Right Column: Person Icon Display (Replacing Terminal) */}
                <div className="lg:col-span-5 bg-[#F3F3F5] text-[#09090b] rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] relative overflow-hidden border-2 border-black min-h-[380px] group">
                  
                  {/* Outer ring accent */}
                  <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-white border-4 border-black flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] transition-transform duration-500 group-hover:scale-105 mb-6">
                    {slide.icon}
                  </div>

                  <div className="bg-[#09090b] text-white px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest shadow-md">
                    {slide.roleLabel}
                  </div>

                  <div className="mt-3 text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-black" /> BrainTrace Medical AI Engine
                  </div>

                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Progress Bar for Auto Loop */}
        <motion.div variants={itemVariants} className="mt-6 max-w-5xl mx-auto flex items-center gap-2">
          {slides.map((_, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className="h-1.5 flex-1 rounded-full bg-neutral-200 overflow-hidden cursor-pointer"
            >
              <div
                className={`h-full bg-[#09090b] transition-all duration-300 ${
                  idx === currentSlide ? 'w-full' : 'w-0'
                }`}
              />
            </div>
          ))}
        </motion.div>

      </motion.div>
    </section>
  );
};

