import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, MessageSquare, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ContactFormData } from '../types';
import { ScrollRevealContainer, ScrollRevealItem } from './ScrollReveal';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    workEmail: '',
    company: '',
    role: '',
    inquiryType: 'Accuracy of ML Model',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setShowToast(true);
    }, 1000);
  };

  return (
    <section id="contact" className="py-24 bg-[#FFFFFF] text-[#09090b] relative border-b border-neutral-100">
      <ScrollRevealContainer 
        staggerDelay={0.15}
        delayChildren={0.05}
        amount={0.15}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        
        {/* Contact Header */}
        <ScrollRevealItem className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-3">
            <MessageSquare className="w-3.5 h-3.5 text-black" /> Direct Contact
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#09090b] leading-tight mb-4">
            Connect with the BrainTrace Team
          </h2>
          <p className="text-lg text-neutral-600 font-normal">
            Request a personalized platform walk-through, explore 700M+ profile analytics, or discuss custom API deployment for your organization.
          </p>
        </ScrollRevealItem>

        {/* Contact Form & Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Info Column - Replaced with Image */}
          <ScrollRevealItem className="lg:col-span-5 space-y-8">
            <div className="bg-neutral-50 border-2 border-[#09090b] rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(9,9,11,1)]">
              <img 
                src="https://i.pinimg.com/1200x/13/41/6d/13416d5cfff794deb15536999a7912d4.jpg" 
                alt="BrainTrace Contact" 
                className="w-full h-auto aspect-square object-cover block"
              />
            </div>
          </ScrollRevealItem>

          {/* Right Contact Form Column */}
          <ScrollRevealItem className="lg:col-span-7 bg-white border-2 border-[#09090b] rounded-3xl p-8 sm:p-10 shadow-[8px_8px_0px_0px_rgba(9,9,11,1)]">
            
            {isSubmitted ? (
              <div className="text-center py-12 space-y-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-500 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>
                <h3 className="text-2xl font-black text-[#09090b]">Message Sent Successfully!</h3>
                <p className="text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out to BrainTrace. Our executive team has received your request and will contact you via email shortly.
                </p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({
                      fullName: '',
                      workEmail: '',
                      company: '',
                      role: '',
                      inquiryType: 'Enterprise Hiring',
                      message: ''
                    });
                  }}
                  className="mt-6 px-6 py-2.5 bg-[#09090b] text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                
                <h3 className="text-xl font-extrabold text-[#09090b] mb-2">Reach out or Register Your Complaints</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Aditi Rao"
                      className="w-full bg-neutral-50 text-black border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.workEmail}
                      onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                      placeholder="aditi@company.com"
                      className="w-full bg-neutral-50 text-black border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                      City*
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g. Ghaziabad, Kolkata"
                      className="w-full bg-neutral-50 text-black border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="e.g. Uttar Pradesh/ West Bengal"
                      className="w-full bg-neutral-50 text-black border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Inquiry Category
                  </label>
                  <select
                    value={formData.inquiryType}
                    onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                    className="w-full bg-neutral-50 text-black border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                  >
                    <option value="Complaint">Complaints</option>
                    <option value="Chatbot Failure">Chatbot&Failure</option>
                    <option value="Bug Reports">Bug&Reports</option>
                    <option value="Partnership">Partnership & Media Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Your Requirements / Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your team size, hiring goals, or data intelligence requirements..."
                    className="w-full bg-neutral-50 text-black border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#09090b] hover:bg-neutral-800 text-white font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-2xl"
                >
                  {isSubmitting ? (
                    <span>Submitting Message...</span>
                  ) : (
                    <>
                      <span>Submit Request</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-neutral-500 text-center mt-2">
                  By submitting, you agree to BrainTrace's Privacy Policy & Data Terms.
                </p>

              </form>
            )}

          </ScrollRevealItem>

        </div>

      </ScrollRevealContainer>

      {/* Instant Toast Notification on Successful Submission */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-auto bg-[#09090b] text-white border-2 border-emerald-500 rounded-2xl p-4 shadow-[8px_8px_0px_0px_rgba(16,185,129,0.25)] flex items-start gap-3.5"
          >
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>

            <div className="flex-1 pr-2">
              <div className="text-sm font-extrabold text-white flex items-center gap-2 flex-wrap">
                <span>Message Received!</span>
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <Sparkles className="w-3 h-3 text-emerald-400" /> Executive Priority
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                Thank you{formData.fullName ? `, ${formData.fullName.split(' ')[0]}` : ''}! Your inquiry has been dispatched to our lead data architect. We will respond shortly.
              </p>
            </div>

            <button
              onClick={() => setShowToast(false)}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
};
