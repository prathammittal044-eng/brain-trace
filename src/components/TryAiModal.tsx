import React, { useState } from 'react';
import { X, Sparkles, Search, CheckCircle2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface TryAiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TryAiModal: React.FC<TryAiModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#09090b] text-white border-2 border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white">Access Key Dispatched!</h3>
            <p className="text-sm text-neutral-300 max-w-md mx-auto">
              We’ve sent your instant BrainTrace Sandbox credentials to <span className="text-amber-300 font-bold">{email}</span>. You can now explore the 700M+ candidate search engine.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-white text-black font-bold text-sm rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-300">
              <Sparkles className="w-4 h-4" /> Try BrainTrace Sandbox
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Unlock 700M+ Profiles in Real Time
              </h3>
              <p className="text-sm text-neutral-300 mt-1">
                Enter your work email to get instant access to our AI search engine, 30+ language parser, and sample lead enrichment API.
              </p>
            </div>

            <form onSubmit={handleDemoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-400 mb-1">
                  Work Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-400 mb-1">
                  Initial Search Goal (Optional)
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Hire Senior Backend Engineers in Hyderabad"
                  className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-white hover:bg-neutral-200 text-black font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                Get Free BrainTrace Sandbox Key <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Instant Setup • No Credit Card Required
              </span>
              <span className="flex items-center gap-1 text-amber-300 font-semibold">
                <Zap className="w-3.5 h-3.5" /> 500 Free Search Credits
              </span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
