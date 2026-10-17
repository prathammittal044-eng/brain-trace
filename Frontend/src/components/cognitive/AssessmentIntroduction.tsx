import React from 'react';
import {
  Brain,
  Clock,
  ShieldCheck,
  Target,
  Zap,
  Puzzle,
  Compass,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface AssessmentIntroductionProps {
  onStartPractice: () => void;
  onBackToDashboard: () => void;
  hasResumeSession?: boolean;
  onResumeSession?: () => void;
  onDiscardSession?: () => void;
}

export const AssessmentIntroduction: React.FC<AssessmentIntroductionProps> = ({
  onStartPractice,
  onBackToDashboard,
  hasResumeSession,
  onResumeSession,
  onDiscardSession
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Top Breadcrumb / Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 hover:border-black text-xs font-bold text-neutral-700 hover:text-black transition-all bg-white cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>

        <span className="text-xs font-semibold text-neutral-400">
          Daily Assessment • Step 1 of 4
        </span>
      </div>

      {/* In-progress active session banner if user refreshed or paused previously */}
      {hasResumeSession && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-amber-950">In-Progress Session Detected</h4>
              <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                You have an uncompleted assessment from earlier. Would you like to resume where you left off or start fresh?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onResumeSession && (
              <button
                onClick={onResumeSession}
                className="px-4 py-2 rounded-xl bg-[#09090b] text-white text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Resume Session
              </button>
            )}
            {onDiscardSession && (
              <button
                onClick={onDiscardSession}
                className="px-3 py-2 rounded-xl border border-neutral-300 text-neutral-600 text-xs font-semibold hover:bg-white transition-colors cursor-pointer"
              >
                Start New
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#09090b] shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] space-y-6">
        
        {/* Header Badge & Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Brain className="w-3.5 h-3.5 text-emerald-700" />
            <span>Interactive Assessment Experience</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-black tracking-tight">
            Your Daily Brain Check
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed max-w-2xl font-normal">
            Welcome to today’s cognitive check. You will complete a sequence of 5 brief, interactive exercises that explore different aspects of cognitive function, from memory and sustained attention to spatial reasoning.
          </p>
        </div>

        {/* 3 Quick Overview Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Estimated Duration</div>
              <div className="text-sm font-extrabold text-black">5 – 8 Minutes</div>
              <div className="text-[10px] text-neutral-400">Self-paced, no rush</div>
            </div>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Total Domains</div>
              <div className="text-sm font-extrabold text-black">5 Core Areas</div>
              <div className="text-[10px] text-neutral-400">10 Scored Tasks</div>
            </div>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Evaluation Type</div>
              <div className="text-sm font-extrabold text-black">Cognitive Wellness</div>
              <div className="text-[10px] text-neutral-400">Longitudinal Tracking</div>
            </div>
          </div>

        </div>

        {/* Five Domains Covered */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            Cognitive Domains Covered
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* Domain 1 */}
            <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/70 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-black">1. Memory Recall</h4>
                <p className="text-[11px] text-neutral-500 leading-snug font-normal mt-0.5">
                  Study 6 everyday items early in the session and identify them during delayed recall at the end.
                </p>
              </div>
            </div>

            {/* Domain 2 */}
            <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/70 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-black">2. Attention Challenge</h4>
                <p className="text-[11px] text-neutral-500 leading-snug font-normal mt-0.5">
                  Select specified visual targets across geometric grids while ignoring distractor symbols.
                </p>
              </div>
            </div>

            {/* Domain 3 */}
            <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/70 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-black">3. Working Memory</h4>
                <p className="text-[11px] text-neutral-500 leading-snug font-normal mt-0.5">
                  Observe and sequentially reproduce illuminated tile sequences on a responsive 3x3 pad.
                </p>
              </div>
            </div>

            {/* Domain 4 */}
            <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/70 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                <Puzzle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-black">4. Pattern & Rule Challenge</h4>
                <p className="text-[11px] text-neutral-500 leading-snug font-normal mt-0.5">
                  Identify logical number patterns, follow explicit categorization criteria, and adapt to rule shifts.
                </p>
              </div>
            </div>

            {/* Domain 5 */}
            <div className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/70 flex items-start gap-3 md:col-span-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-black">5. Visual-Spatial Challenge</h4>
                <p className="text-[11px] text-neutral-500 leading-snug font-normal mt-0.5">
                  Discriminate between 2D rotated shapes and symmetrical quadrant alignments without relying on color alone.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* How Answers Are Recorded & Accessibility */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-neutral-900">How Your Responses Are Recorded</h4>
          <p className="text-xs text-neutral-600 leading-relaxed font-normal">
            Every task is completed at your own comfortable pace with large touch targets. You can take your time to review instructions on each screen before clicking to continue. You can pause or exit at any moment.
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-100/70 border border-neutral-200 text-xs text-neutral-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold text-black">Privacy Notice:</span> Your assessment responses are stored locally as part of your BrainTrace personal cognitive assessment log. No personal secrets or raw medical data are transmitted to unverified external trackers.
          </p>
        </div>

        {/* Clear Medical Disclaimer */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold">Medical Disclaimer:</span> These cognitive exercises are designed exclusively for longitudinal performance tracking and brain wellness engagement. They do not constitute a clinical neurological diagnosis, do not screen for specific medical conditions, and are never a substitute for direct evaluation by a qualified physician.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-100">
          <button
            onClick={onBackToDashboard}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-neutral-300 hover:border-black text-xs font-bold text-neutral-700 hover:text-black transition-colors cursor-pointer"
          >
            Back to Dashboard
          </button>

          <button
            onClick={onStartPractice}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#09090b] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[3px_3px_0px_0px_rgba(9,9,11,0.6)]"
          >
            <span>Begin Assessment (Practice Round)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
