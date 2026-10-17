import React, { useState } from 'react';
import {
  Trees,
  Lamp,
  Waves,
  Paperclip,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { PRACTICE_QUESTION } from './CognitiveQuestionBank';

interface PracticeRoundProps {
  onStartAssessment: () => void;
  onBackToIntro: () => void;
}

export const PracticeRound: React.FC<PracticeRoundProps> = ({
  onStartAssessment,
  onBackToIntro
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hasChecked, setHasChecked] = useState(false);

  const toggleOption = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    // If they change selection after checking, reset checked state
    if (hasChecked) setHasChecked(false);
  };

  const handleCheck = () => {
    setHasChecked(true);
  };

  const handleReset = () => {
    setSelectedIds([]);
    setHasChecked(false);
  };

  // Target IDs for practice
  const targetIds = (PRACTICE_QUESTION.options || [])
    .filter((o) => o.isTarget)
    .map((o) => o.id);

  const isAllCorrect =
    targetIds.every((id) => selectedIds.includes(id)) &&
    selectedIds.length === targetIds.length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToIntro}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 hover:border-black text-xs font-bold text-neutral-700 hover:text-black transition-all bg-white cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Introduction</span>
        </button>

        <span className="text-xs font-semibold text-neutral-400">
          Daily Assessment • Step 2 of 4 (Practice)
        </span>
      </div>

      {/* Main Practice Container Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#09090b] shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] space-y-6">
        
        {/* Practice Banner */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>Unscored Practice Exercise</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-black tracking-tight">
              Get Familiar with the Controls
            </h2>
          </div>

          <span className="hidden sm:inline-block px-3 py-1 bg-neutral-100 rounded-lg text-xs font-bold text-neutral-500">
            Practice Round
          </span>
        </div>

        {/* Plain Language Instructions */}
        <div className="space-y-2">
          <p className="text-sm text-neutral-700 leading-relaxed font-normal">
            Before we begin the scored activities, let’s try one simple practice task together.
          </p>
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
            <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
              Your Task:
            </span>
            <p className="text-sm font-semibold text-black">
              Select every item below that belongs to the <span className="underline decoration-emerald-500 decoration-2 font-bold">Natural World</span>. You can tap multiple cards.
            </p>
          </div>
        </div>

        {/* 4 Interactive Option Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {(PRACTICE_QUESTION.options || []).map((opt) => {
            const isSelected = selectedIds.includes(opt.id);
            const isTarget = opt.isTarget;

            let cardBorder = isSelected
              ? 'border-2 border-black bg-neutral-50 shadow-sm'
              : 'border border-neutral-200 bg-white hover:border-neutral-400';

            if (hasChecked) {
              if (isSelected && isTarget) {
                cardBorder = 'border-2 border-emerald-600 bg-emerald-50/70 shadow-xs';
              } else if (isSelected && !isTarget) {
                cardBorder = 'border-2 border-rose-500 bg-rose-50/70 shadow-xs';
              } else if (!isSelected && isTarget) {
                cardBorder = 'border-2 border-dashed border-emerald-500 bg-emerald-50/30';
              }
            }

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleOption(opt.id)}
                className={`p-4 rounded-2xl transition-all text-left flex items-center justify-between cursor-pointer ${cardBorder}`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#09090b] text-white'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {opt.iconName === 'Trees' && <Trees className="w-5 h-5" />}
                    {opt.iconName === 'Lamp' && <Lamp className="w-5 h-5" />}
                    {opt.iconName === 'Waves' && <Waves className="w-5 h-5" />}
                    {opt.iconName === 'Paperclip' && <Paperclip className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-black block">{opt.label}</span>
                    <span className="text-[11px] text-neutral-500 font-normal">
                      {opt.isTarget ? 'Nature item' : 'Household / Office'}
                    </span>
                  </div>
                </div>

                {/* Selection Indicator Checkbox */}
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                    isSelected
                      ? 'bg-[#09090b] border-black text-white'
                      : 'border-neutral-300 bg-white'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Neutral Explanatory Feedback (Shows after checking) */}
        {hasChecked && (
          <div
            className={`p-4 rounded-2xl border ${
              isAllCorrect
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-neutral-50 border-neutral-300 text-neutral-800'
            } space-y-2 animate-in fade-in duration-150`}
          >
            <div className="flex items-center gap-2">
              {isAllCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Great Practice Interaction!
                  </span>
                </>
              ) : (
                <>
                  <HelpCircle className="w-4 h-4 text-neutral-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Practice Feedback & Walkthrough
                  </span>
                </>
              )}
            </div>

            <p className="text-xs leading-relaxed font-medium">
              <span className="font-bold">Explanation:</span> "Oak Tree" and "Forest Stream" belong to the Natural World, whereas "Desk Lamp" and "Iron Stapler" are manufactured objects.
              {isAllCorrect
                ? ' You selected both correct targets with precision.'
                : ' You can click "Try Again" to re-practice, or click "Start Today\'s Assessment" whenever you feel ready.'}
            </p>

            <div className="text-[11px] text-neutral-500 italic">
              Note: This practice round is not included in your Daily Cognitive Activity Score.
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-100">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!hasChecked ? (
              <button
                type="button"
                onClick={handleCheck}
                disabled={selectedIds.length === 0}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Check Practice Answer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 hover:text-black text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onStartAssessment}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#09090b] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_rgba(9,9,11,0.6)] transition-all"
          >
            <span>Start Today's Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>

      </div>

    </div>
  );
};
