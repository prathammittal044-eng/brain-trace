import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  X,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Brain,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import {
  CompanionMessage,
  sendCompanionMessage
} from '../../services/geminiCompanionService';
import {
  CompanionAction,
  CompanionContext,
  executeCompanionNavigation,
  NAVIGATION_REGISTRY,
  NavigationDestination
} from '../../services/companionNavigation';

interface CompanionChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  context?: CompanionContext;
  onNavigate?: (destination: NavigationDestination) => void;
}

const DEFAULT_SUGGESTIONS = [
  "How do I upload an MRI?",
  "Where can I find my reports?",
  "How does the cognitive assessment work?",
  "How do I book a doctor's appointment?"
];

export const CompanionChatPanel: React.FC<CompanionChatPanelProps> = ({
  isOpen,
  onClose,
  context,
  onNavigate
}) => {
  const [messages, setMessages] = useState<CompanionMessage[]>(() => {
    // Generate context-aware initial greeting
    let greeting = "Hi! I'm your BrainTrace companion. I can help you find things around the app, explain how features work, or answer common questions. What do you need help with?";
    
    if (context?.currentRoute === 'try-braintrace') {
      if (context.activeTab === 'Cognitive Test') {
        greeting = "Hi! Need a hand with today's brain check? I can explain how the 5 cognitive domains work, how scoring is calculated, or show you earlier assessment reports.";
      } else if (context.activeTab === 'My Scans') {
        greeting = "Hi! Need help with brain MRI scan uploads, volumetric analysis, or viewing earlier scans?";
      } else if (context.activeTab === 'Appointments') {
        greeting = "Hi! Looking to book or review an appointment with a neurologist? I can guide you through our specialist directory.";
      } else if (context.activeTab === 'Messages') {
        greeting = "Hi! Need help messaging your doctors, sharing assessment reports, or starting a telehealth consultation?";
      }
    }

    return [
      {
        id: 'msg-init',
        role: 'assistant',
        content: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Keyboard shortcut: Escape closes panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    setErrorMessage(null);
    setInputQuery('');

    const userMsg: CompanionMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const response = await sendCompanionMessage(newHistory, context);

      const assistantMsg: CompanionMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: response.action
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setErrorMessage("Hmm, I couldn't reach the assistant right now. Your message is still here—please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = (action: CompanionAction) => {
    if (!action || action.type !== 'navigate') return;
    
    // Execute through global bus or callback
    if (onNavigate) {
      onNavigate(action.destination);
    } else {
      executeCompanionNavigation(action.destination);
    }
  };

  const handleResetConversation = () => {
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        role: 'assistant',
        content: "New conversation started! How can I assist you with BrainTrace today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setErrorMessage(null);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="companion-title"
      className="fixed bottom-22 right-5 sm:bottom-24 sm:right-6 w-[calc(100vw-2.5rem)] sm:w-96 max-h-[82vh] h-[540px] bg-white rounded-3xl border-2 border-[#09090b] shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] flex flex-col z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      
      {/* ==================== HEADER ==================== */}
      <div className="p-3.5 sm:p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Mascot Mini Avatar */}
          <div className="w-8 h-8 rounded-xl bg-white border border-neutral-300 flex items-center justify-center p-1 shadow-2xs">
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
              <rect x="12" y="18" width="76" height="66" rx="30" fill="#F4F4F6" stroke="#09090B" strokeWidth="6" />
              <path d="M26 22 C 26 12, 46 12, 50 20 C 54 12, 74 12, 74 22" stroke="#09090B" strokeWidth="6" fill="#FFFFFF" />
              <ellipse cx="38" cy="46" rx="5" ry="6" fill="#09090B" />
              <ellipse cx="62" cy="46" rx="5" ry="6" fill="#09090B" />
              <path d="M 44 58 Q 50 64 56 58" stroke="#09090B" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 id="companion-title" className="text-xs font-bold text-black tracking-tight leading-tight">
                BrainTrace Companion
              </h2>
              <span className="px-1.5 py-0.2 rounded-md bg-neutral-200 text-neutral-800 text-[9px] font-mono font-bold">
                Gemini AI
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 font-normal leading-tight">
              Here to help you navigate
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleResetConversation}
            className="w-7 h-7 rounded-lg hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-black transition-colors cursor-pointer"
            title="Start new conversation"
            aria-label="Start new conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-black transition-colors cursor-pointer"
            title="Close companion"
            aria-label="Close companion"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ==================== MESSAGES LIST ==================== */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin text-xs"
        role="log"
        aria-live="polite"
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5 animate-in fade-in duration-200`}
            >
              <div
                className={`p-3 rounded-2xl max-w-[88%] leading-relaxed ${
                  isUser
                    ? 'bg-[#09090b] text-white rounded-br-xs shadow-2xs font-medium'
                    : 'bg-neutral-100 text-[#09090b] rounded-bl-xs border border-neutral-200/60 font-normal'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Structured Action Navigation Button */}
                {msg.action && (
                  <div className="mt-2.5 pt-2 border-t border-neutral-200/80">
                    <button
                      type="button"
                      onClick={() => handleExecuteAction(msg.action!)}
                      className="w-full py-2 px-3 rounded-xl bg-white hover:bg-neutral-50 text-black border border-neutral-300 hover:border-black font-bold text-xs flex items-center justify-between gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      <span>{msg.action.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>
                )}
              </div>

              <span className="text-[9px] text-neutral-400 px-1 font-mono">
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {/* Typing Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-neutral-400 pl-1 animate-in fade-in">
            <div className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-neutral-600 animate-spin" />
            </div>
            <div className="bg-neutral-100 px-3 py-2 rounded-2xl rounded-bl-xs flex items-center gap-1.5 border border-neutral-200">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1 space-y-1">
              <p>{errorMessage}</p>
              <button
                type="button"
                onClick={() => handleSendMessage()}
                className="text-red-800 font-bold hover:underline cursor-pointer text-[11px]"
              >
                Retry Request →
              </button>
            </div>
          </div>
        )}

        {/* Suggested Question Chips (Only shown if 1 message or just started) */}
        {messages.length <= 2 && !isLoading && (
          <div className="pt-2 space-y-1.5">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              <span>Suggested questions</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {DEFAULT_SUGGESTIONS.map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  className="w-full text-left p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 hover:text-black font-medium text-xs transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <span className="truncate">{chip}</span>
                  <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:text-black shrink-0 ml-1 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ==================== INPUT COMPOSER ==================== */}
      <div className="p-3 bg-white border-t border-neutral-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask me anything about BrainTrace..."
              maxLength={400}
              className="w-full pl-3 pr-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black resize-none transition-colors max-h-24 font-normal"
            />
          </div>

          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            aria-label="Send message"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              inputQuery.trim() && !isLoading
                ? 'bg-[#09090b] text-white hover:bg-neutral-800 shadow-xs'
                : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4 -translate-x-0.2" />
          </button>
        </form>

        <div className="text-[10px] text-neutral-400 text-center pt-1.5 flex items-center justify-center gap-1">
          <span>AI Companion • Not for clinical diagnosis</span>
        </div>
      </div>

    </div>
  );
};
