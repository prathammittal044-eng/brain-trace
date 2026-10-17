import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Sparkles } from 'lucide-react';

interface CompanionMascotProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
}

export const CompanionMascot: React.FC<CompanionMascotProps> = ({
  isOpen,
  onToggle,
  unreadCount = 0
}) => {
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Show introductory speech bubble once per session if not opened
  useEffect(() => {
    const hasSeenGreeting = sessionStorage.getItem('braintrace_companion_bubble_dismissed');
    if (!hasSeenGreeting && !isOpen) {
      const timer = setTimeout(() => {
        setShowSpeechBubble(true);
      }, 1500);

      // Auto-hide after 6 seconds
      const hideTimer = setTimeout(() => {
        setShowSpeechBubble(false);
      }, 7500);

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [isOpen]);

  const handleDismissBubble = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSpeechBubble(false);
    sessionStorage.setItem('braintrace_companion_bubble_dismissed', 'true');
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 select-none flex flex-col items-end">
      
      {/* Speech Bubble Tooltip */}
      {(showSpeechBubble || isHovered) && !isOpen && (
        <div 
          className="mb-2 mr-1 animate-in fade-in slide-in-from-bottom-2 duration-200 relative group"
          role="status"
          aria-live="polite"
        >
          <div className="bg-white text-[#09090b] text-xs font-semibold px-3 py-1.5 rounded-xl border-2 border-[#09090b] shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Need a hand?</span>
            <button
              onClick={handleDismissBubble}
              className="text-neutral-400 hover:text-black ml-1 p-0.5 rounded cursor-pointer"
              title="Dismiss"
              aria-label="Dismiss greeting bubble"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          {/* Triangular Tail */}
          <div className="w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-[#09090b] rotate-45 absolute -bottom-1.5 right-6 z-10" />
        </div>
      )}

      {/* Main Mascot Button */}
      <button
        type="button"
        onClick={onToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={isOpen ? 'Close BrainTrace Companion chat' : 'Ask BrainTrace Companion'}
        aria-expanded={isOpen}
        className={`relative w-14 h-14 sm:w-15 sm:h-15 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-black/20 ${
          isOpen
            ? 'bg-[#09090b] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(9,9,11,0.3)]'
            : 'bg-white hover:bg-neutral-50 text-black border-2 border-[#09090b] shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative w-11 h-11 flex items-center justify-center">
            {/* Brain Healthcare Mascot SVG */}
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full transform transition-transform duration-300 group-hover:scale-105"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Soft Body Background */}
              <rect x="12" y="18" width="76" height="66" rx="30" fill="#F4F4F6" stroke="#09090B" strokeWidth="5" />
              
              {/* Brain Lobes Top Curves */}
              <path
                d="M26 22 C 26 12, 46 12, 50 20 C 54 12, 74 12, 74 22"
                stroke="#09090B"
                strokeWidth="5"
                strokeLinecap="round"
                fill="#FFFFFF"
              />

              {/* Left Brain Hemisphere Fissure */}
              <path
                d="M 28 38 Q 20 48 30 58 Q 36 64 34 72"
                stroke="#09090B"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />

              {/* Right Brain Hemisphere Fissure */}
              <path
                d="M 72 38 Q 80 48 70 58 Q 64 64 66 72"
                stroke="#09090B"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />

              {/* Expressive Eyes with Blink Animation */}
              <g className="animate-[pulse_3.5s_infinite]">
                {/* Left Eye */}
                <ellipse cx="38" cy="46" rx="5.5" ry="6.5" fill="#09090B" />
                <circle cx="36" cy="43.5" r="2" fill="#FFFFFF" />
                
                {/* Right Eye */}
                <ellipse cx="62" cy="46" rx="5.5" ry="6.5" fill="#09090B" />
                <circle cx="60" cy="43.5" r="2" fill="#FFFFFF" />
              </g>

              {/* Friendly Gentle Smile */}
              <path
                d="M 44 58 Q 50 64 56 58"
                stroke="#09090B"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />

              {/* Rosy Cheeks */}
              <circle cx="28" cy="52" r="3.5" fill="#E4E4E7" />
              <circle cx="72" cy="52" r="3.5" fill="#E4E4E7" />

              {/* Sparkle / Antenna Node at top */}
              <circle cx="50" cy="11" r="4.5" fill="#09090B" />
              <line x1="50" y1="15" x2="50" y2="21" stroke="#09090B" strokeWidth="4" strokeLinecap="round" />
            </svg>

            {/* Online Sparkle Badge */}
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-black/10" />
          </div>
        )}

        {/* Unread notification counter badge */}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

    </div>
  );
};
