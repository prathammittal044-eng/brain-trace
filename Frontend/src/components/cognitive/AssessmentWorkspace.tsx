import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Target,
  Zap,
  Puzzle,
  Compass,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Pause,
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  Eye,
  Check,
  X
} from 'lucide-react';
import {
  AssessmentSession,
  PatientResponse,
  CognitiveQuestion,
  CognitiveDomain
} from '../../types/cognitiveAssessment';
import {
  ASSESSMENT_QUESTIONS,
  MEMORY_STUDY_ITEMS
} from './CognitiveQuestionBank';
import { CognitiveShapeVisual } from './CognitiveShapeVisual';
import { DOMAIN_METADATA, calculateOverallAssessmentScore } from '../../utils/cognitiveScoring';
import {
  saveActiveSession,
  saveCompletedAssessment,
  clearActiveSession
} from '../../services/cognitiveAssessmentService';

interface AssessmentWorkspaceProps {
  session: AssessmentSession;
  onComplete: (completedSession: AssessmentSession) => void;
  onPauseAndExit: () => void;
}

export const AssessmentWorkspace: React.FC<AssessmentWorkspaceProps> = ({
  session,
  onComplete,
  onPauseAndExit
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(session.currentStepIndex || 0);
  const [responses, setResponses] = useState<Record<string, PatientResponse>>(session.responses || {});
  const [startTime] = useState<number>(Date.now());
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Per-question interactive states
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [singleChoiceId, setSingleChoiceId] = useState<string | null>(null);

  // Working Memory specific states
  const [wmSequenceStep, setWmSequenceStep] = useState<'watch' | 'input'>('watch');
  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number | null>(null);
  const [userTappedSequence, setUserTappedSequence] = useState<number[]>([]);
  const [hasReplayed, setHasReplayed] = useState(false);

  // Question timer
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  const currentQuestion: CognitiveQuestion = ASSESSMENT_QUESTIONS[currentStepIndex] || ASSESSMENT_QUESTIONS[0];
  const totalQuestions = ASSESSMENT_QUESTIONS.length;
  const progressPercent = Math.round(((currentStepIndex + 1) / totalQuestions) * 100);

  // Auto-play working memory sequence when reaching a sequence step
  useEffect(() => {
    setQuestionStartTime(Date.now());
    setValidationError(null);

    // Reset answer inputs based on current question type
    if (currentQuestion.activityKind === 'working_memory_sequence') {
      setWmSequenceStep('watch');
      setUserTappedSequence([]);
      setActiveHighlightIndex(null);
      setHasReplayed(false);

      const target = currentQuestion.sequenceTarget || [];
      playSequenceAnimation(target);
    } else if (
      currentQuestion.activityKind === 'pattern_reasoning' ||
      currentQuestion.activityKind === 'visual_spatial_match'
    ) {
      // Check if previous answer exists
      const existing = responses[currentQuestion.id];
      if (existing) {
        setSingleChoiceId(existing.userAnswer as string);
      } else {
        setSingleChoiceId(null);
      }
      setSelectedOptionIds([]);
    } else {
      // Multi-select or memory study
      const existing = responses[currentQuestion.id];
      if (existing && Array.isArray(existing.userAnswer)) {
        setSelectedOptionIds(existing.userAnswer);
      } else {
        setSelectedOptionIds([]);
      }
      setSingleChoiceId(null);
    }
  }, [currentStepIndex]);

  // Sequence player animation for Working Memory
  const playSequenceAnimation = (target: number[]) => {
    setWmSequenceStep('watch');
    setActiveHighlightIndex(null);

    target.forEach((padNum, idx) => {
      setTimeout(() => {
        setActiveHighlightIndex(padNum);
        setTimeout(() => {
          setActiveHighlightIndex(null);
        }, 600);
      }, 700 + idx * 900);
    });

    // End playback and allow user input
    setTimeout(() => {
      setWmSequenceStep('input');
    }, 700 + target.length * 900 + 400);
  };

  // Persist session to local storage when step or responses change
  useEffect(() => {
    const updated: AssessmentSession = {
      ...session,
      currentStepIndex,
      responses,
      durationSeconds: Math.round((Date.now() - startTime) / 1000)
    };
    saveActiveSession(updated);
  }, [currentStepIndex, responses]);

  // Toggle multi-select card
  const handleToggleCard = (id: string) => {
    setValidationError(null);
    setSelectedOptionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select single-choice card
  const handleSelectSingleChoice = (id: string) => {
    setValidationError(null);
    setSingleChoiceId(id);
  };

  // Working Memory Pad Tap
  const handlePadTap = (padNum: number) => {
    if (wmSequenceStep !== 'input') return;
    setValidationError(null);

    const targetLength = currentQuestion.sequenceTarget?.length || 3;
    if (userTappedSequence.length >= targetLength) return;

    setUserTappedSequence((prev) => [...prev, padNum]);
  };

  const handleClearPadSequence = () => {
    setUserTappedSequence([]);
    setValidationError(null);
  };

  const handleReplaySequence = () => {
    if (hasReplayed) return;
    setHasReplayed(true);
    setUserTappedSequence([]);
    playSequenceAnimation(currentQuestion.sequenceTarget || []);
  };

  // Submit Answer and Move Forward
  const handleContinue = () => {
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
    let recordResponse: PatientResponse | null = null;

    // 1. Memory Study Phase (Introductory study, unscored trial)
    if (currentQuestion.activityKind === 'memory_study') {
      recordResponse = {
        questionId: currentQuestion.id,
        domain: currentQuestion.domain as CognitiveDomain,
        activityKind: currentQuestion.activityKind,
        userAnswer: 'memorized',
        isCorrect: true,
        scoreEarned: 1,
        rawDetails: { timeTakenSeconds: timeTaken, summaryText: '6 everyday items studied' },
        answeredAt: new Date().toISOString()
      };
    }

    // 2. Attention Target Selection
    else if (currentQuestion.activityKind === 'attention_target') {
      if (selectedOptionIds.length === 0) {
        setValidationError('Please select the matching targets in the grid before continuing.');
        return;
      }

      const options = currentQuestion.options || [];
      const actualTargets = options.filter((o) => o.isTarget).map((o) => o.id);
      const correctSelected = selectedOptionIds.filter((id) => actualTargets.includes(id));
      const incorrectSelected = selectedOptionIds.filter((id) => !actualTargets.includes(id));
      const missed = actualTargets.filter((id) => !selectedOptionIds.includes(id));

      const isExactMatch = correctSelected.length === actualTargets.length && incorrectSelected.length === 0;
      // Partial credit calculation: correct selections minus penalty for incorrect
      const earned = Math.max(0, (correctSelected.length - incorrectSelected.length * 0.5) / actualTargets.length);

      recordResponse = {
        questionId: currentQuestion.id,
        domain: currentQuestion.domain as CognitiveDomain,
        activityKind: currentQuestion.activityKind,
        userAnswer: selectedOptionIds,
        isCorrect: isExactMatch,
        scoreEarned: Math.min(1, Math.max(0, earned)),
        rawDetails: {
          correctSelections: correctSelected.length,
          totalExpected: actualTargets.length,
          missedSelections: missed.length,
          incorrectSelections: incorrectSelected.length,
          timeTakenSeconds: timeTaken
        },
        answeredAt: new Date().toISOString()
      };
    }

    // 3. Working Memory Sequence
    else if (currentQuestion.activityKind === 'working_memory_sequence') {
      const target = currentQuestion.sequenceTarget || [];
      if (userTappedSequence.length < target.length) {
        setValidationError(`Please tap all ${target.length} tiles in the sequence before submitting.`);
        return;
      }

      let correctPositions = 0;
      target.forEach((num, idx) => {
        if (userTappedSequence[idx] === num) correctPositions++;
      });

      const isExact = correctPositions === target.length;
      const earned = correctPositions / target.length;

      recordResponse = {
        questionId: currentQuestion.id,
        domain: currentQuestion.domain as CognitiveDomain,
        activityKind: currentQuestion.activityKind,
        userAnswer: userTappedSequence,
        isCorrect: isExact,
        scoreEarned: earned,
        rawDetails: {
          sequenceLength: target.length,
          correctSelections: correctPositions,
          errorsCount: target.length - correctPositions,
          timeTakenSeconds: timeTaken
        },
        answeredAt: new Date().toISOString()
      };
    }

    // 4. Pattern Reasoning or Visual Spatial Match (Single Choice)
    else if (
      currentQuestion.activityKind === 'pattern_reasoning' ||
      currentQuestion.activityKind === 'visual_spatial_match'
    ) {
      if (!singleChoiceId) {
        setValidationError('Please choose an answer option from the cards below.');
        return;
      }

      const options = currentQuestion.options || [];
      const chosenOpt = options.find((o) => o.id === singleChoiceId);
      const isCorrect = chosenOpt?.isTarget === true;

      recordResponse = {
        questionId: currentQuestion.id,
        domain: currentQuestion.domain as CognitiveDomain,
        activityKind: currentQuestion.activityKind,
        userAnswer: singleChoiceId,
        isCorrect,
        scoreEarned: isCorrect ? 1 : 0,
        rawDetails: {
          timeTakenSeconds: timeTaken,
          summaryText: isCorrect ? 'Correct choice' : 'Incorrect choice'
        },
        answeredAt: new Date().toISOString()
      };
    }

    // 5. Rule Grouping (Multi-Select)
    else if (currentQuestion.activityKind === 'rule_grouping') {
      if (selectedOptionIds.length === 0) {
        setValidationError('Please select the shapes that follow the rule.');
        return;
      }

      const options = currentQuestion.options || [];
      const actualTargets = options.filter((o) => o.isTarget).map((o) => o.id);
      const correctSelected = selectedOptionIds.filter((id) => actualTargets.includes(id));
      const incorrectSelected = selectedOptionIds.filter((id) => !actualTargets.includes(id));

      const isExact = correctSelected.length === actualTargets.length && incorrectSelected.length === 0;
      const earned = Math.max(0, (correctSelected.length - incorrectSelected.length * 0.5) / actualTargets.length);

      recordResponse = {
        questionId: currentQuestion.id,
        domain: currentQuestion.domain as CognitiveDomain,
        activityKind: currentQuestion.activityKind,
        userAnswer: selectedOptionIds,
        isCorrect: isExact,
        scoreEarned: Math.min(1, Math.max(0, earned)),
        rawDetails: {
          correctSelections: correctSelected.length,
          totalExpected: actualTargets.length,
          incorrectSelections: incorrectSelected.length,
          timeTakenSeconds: timeTaken
        },
        answeredAt: new Date().toISOString()
      };
    }

    // 6. Delayed Memory Recall (Final Task)
    else if (currentQuestion.activityKind === 'memory_delayed_recall') {
      if (selectedOptionIds.length === 0) {
        setValidationError('Please select the items you remember from earlier in the check.');
        return;
      }

      const options = currentQuestion.options || [];
      const actualTargets = options.filter((o) => o.isTarget).map((o) => o.id);
      const correctSelected = selectedOptionIds.filter((id) => actualTargets.includes(id));
      const incorrectSelected = selectedOptionIds.filter((id) => !actualTargets.includes(id));
      const missed = actualTargets.filter((id) => !selectedOptionIds.includes(id));

      const isExact = correctSelected.length === actualTargets.length && incorrectSelected.length === 0;
      const earned = Math.max(0, (correctSelected.length - incorrectSelected.length * 0.5) / actualTargets.length);

      recordResponse = {
        questionId: currentQuestion.id,
        domain: 'memory',
        activityKind: 'memory_delayed_recall',
        userAnswer: selectedOptionIds,
        isCorrect: isExact,
        scoreEarned: Math.min(1, Math.max(0, earned)),
        rawDetails: {
          correctSelections: correctSelected.length,
          totalExpected: 6,
          missedSelections: missed.length,
          incorrectSelections: incorrectSelected.length,
          timeTakenSeconds: timeTaken
        },
        answeredAt: new Date().toISOString()
      };
    }

    // Save response to state
    const newResponses = {
      ...responses,
      ...(recordResponse ? { [currentQuestion.id]: recordResponse } : {})
    };
    setResponses(newResponses);

    // Check if this was the last question
    if (currentStepIndex >= totalQuestions - 1) {
      // Complete Assessment Session
      const totalDuration = Math.round((Date.now() - startTime) / 1000);
      const responseList = Object.values(newResponses) as PatientResponse[];
      const calculatedScore = calculateOverallAssessmentScore(responseList, totalDuration, 10);

      const completedSession: AssessmentSession = {
        ...session,
        status: 'completed',
        completedAt: new Date().toISOString(),
        currentStepIndex: totalQuestions,
        responses: newResponses,
        score: calculatedScore,
        durationSeconds: totalDuration
      };

      saveCompletedAssessment(completedSession);
      onComplete(completedSession);
    } else {
      // Advance to next step
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  // Previous Question navigation where permitted
  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      // Do not allow backing up into delayed recall or memory study once advanced
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const domainInfo = DOMAIN_METADATA[currentQuestion.domain as CognitiveDomain] || {
    name: 'Cognitive Check',
    description: 'Cognitive Exercise'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Top Workspace Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#09090b] shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Domain & Step Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
            {currentQuestion.domain === 'memory' && <Brain className="w-5 h-5" />}
            {currentQuestion.domain === 'attention' && <Target className="w-5 h-5" />}
            {currentQuestion.domain === 'workingMemory' && <Zap className="w-5 h-5" />}
            {currentQuestion.domain === 'pattern' && <Puzzle className="w-5 h-5" />}
            {currentQuestion.domain === 'visualSpatial' && <Compass className="w-5 h-5" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                {domainInfo.name}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                Task {currentStepIndex + 1} of {totalQuestions}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-black">
              {currentQuestion.title}
            </h2>
          </div>
        </div>

        {/* Progress Bar & Pause Button */}
        <div className="flex items-center gap-4">
          <div className="w-36 sm:w-48 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden border border-neutral-200">
              <div
                className="h-full bg-[#09090b] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExitDialogOpen(true)}
            className="p-2.5 rounded-xl border border-neutral-200 hover:border-black text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="Pause Assessment"
            aria-label="Pause Assessment"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Main Task Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#09090b] shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] space-y-6">
        
        {/* Task Instructions Banner */}
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-700">
            <Info className="w-3.5 h-3.5 text-black" />
            <span>Instructions</span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-normal">
            {currentQuestion.instructions}
          </p>
          <p className="text-xs sm:text-sm font-bold text-black pt-1">
            {currentQuestion.detailPrompt}
          </p>
        </div>

        {/* ========================================================= */}
        {/* ACTIVITY 1: MEMORY STUDY PHASE                             */}
        {/* ========================================================= */}
        {currentQuestion.activityKind === 'memory_study' && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {MEMORY_STUDY_ITEMS.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border-2 border-neutral-200 bg-neutral-50/70 hover:border-black transition-all flex flex-col items-center text-center space-y-2 shadow-xs"
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-xl font-bold text-black shadow-xs">
                    {idx === 0 && '🍎'}
                    {idx === 1 && '⏰'}
                    {idx === 2 && '🌊'}
                    {idx === 3 && '🌸'}
                    {idx === 4 && '🔑'}
                    {idx === 5 && '🚲'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-black">{item.label}</h4>
                    <p className="text-[11px] text-neutral-500 font-medium">{item.hint}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-950 font-medium">
              <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Take your time to memorize all 6 items. You will recall these items near the end of today's check.
              </span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ACTIVITY 2: ATTENTION TARGET DISCRIMINATION                 */}
        {/* ========================================================= */}
        {currentQuestion.activityKind === 'attention_target' && (
          <div className="space-y-4 pt-2">
            
            {/* Grid of 12 Shape Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(currentQuestion.options || []).map((opt) => {
                const isSelected = selectedOptionIds.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleToggleCard(opt.id)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2.5 cursor-pointer min-h-[110px] ${
                      isSelected
                        ? 'border-black bg-neutral-100 shadow-xs'
                        : 'border-neutral-200 bg-white hover:border-neutral-400'
                    }`}
                  >
                    <CognitiveShapeVisual shapeSvg={opt.shapeSvg} className="w-10 h-10" />
                    <span className="text-[11px] font-bold text-neutral-800 leading-tight">
                      {opt.label}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected ? 'bg-black border-black text-white' : 'border-neutral-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selection counter badge */}
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 px-1">
              <span>Targets Expected: ~{currentQuestion.targetCount || 4}</span>
              <span className="font-bold text-black">Selected: {selectedOptionIds.length}</span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ACTIVITY 3: WORKING MEMORY (3x3 RESPONSIVE PAD)            */}
        {/* ========================================================= */}
        {currentQuestion.activityKind === 'working_memory_sequence' && (
          <div className="space-y-6 pt-2 flex flex-col items-center">
            
            {/* Sequence Status Header */}
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              {wmSequenceStep === 'watch' ? (
                <div className="px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 flex items-center gap-1.5 animate-pulse">
                  <Eye className="w-3.5 h-3.5 text-amber-700" />
                  <span>Observing Sequence... Watch Carefully</span>
                </div>
              ) : (
                <div className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Your Turn: Tap the tiles in the recorded order</span>
                </div>
              )}
            </div>

            {/* 3x3 Grid Pad */}
            <div className="grid grid-cols-3 gap-3.5 max-w-xs w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((padNum) => {
                const isIlluminated = activeHighlightIndex === padNum;
                const tapIndex = userTappedSequence.indexOf(padNum);
                const hasBeenTapped = tapIndex !== -1;

                let padStyle = 'bg-neutral-50 border-neutral-300 text-black hover:border-black';

                if (isIlluminated) {
                  padStyle = 'bg-emerald-500 border-emerald-600 text-white scale-105 shadow-md';
                } else if (hasBeenTapped) {
                  padStyle = 'bg-[#09090b] border-black text-white shadow-xs';
                }

                return (
                  <button
                    key={padNum}
                    type="button"
                    disabled={wmSequenceStep === 'watch'}
                    onClick={() => handlePadTap(padNum)}
                    className={`aspect-square rounded-2xl border-2 font-black text-xl transition-all flex flex-col items-center justify-center relative cursor-pointer disabled:cursor-not-allowed ${padStyle}`}
                  >
                    <span>{padNum}</span>
                    {hasBeenTapped && (
                      <span className="absolute bottom-1.5 text-[9px] font-bold text-emerald-300">
                        Step {tapIndex + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sequence Tapped Summary & Replay */}
            <div className="w-full max-w-sm flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-neutral-500">Tapped:</span>
                <span className="font-bold text-black">
                  {userTappedSequence.length} of {currentQuestion.sequenceTarget?.length || 3}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {userTappedSequence.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearPadSequence}
                    className="px-2.5 py-1 rounded-lg border border-neutral-200 text-neutral-600 text-xs font-semibold hover:text-black cursor-pointer"
                  >
                    Clear
                  </button>
                )}

                {wmSequenceStep === 'input' && !hasReplayed && (
                  <button
                    type="button"
                    onClick={handleReplaySequence}
                    className="px-2.5 py-1 rounded-lg border border-neutral-200 text-neutral-600 text-xs font-semibold hover:text-black flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Replay (Once)</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* ACTIVITY 4: PATTERN REASONING (MULTIPLE CHOICE)             */}
        {/* ========================================================= */}
        {currentQuestion.activityKind === 'pattern_reasoning' && (
          <div className="space-y-6 pt-2">
            
            {/* Visual Sequence Card */}
            <div className="p-6 rounded-2xl bg-neutral-50 border-2 border-neutral-300 text-center space-y-2">
              <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">Sequence</span>
              <div className="text-2xl sm:text-3xl font-black text-black tracking-widest flex items-center justify-center gap-3">
                <span>3</span>
                <span className="text-neutral-400 font-normal">➔</span>
                <span>6</span>
                <span className="text-neutral-400 font-normal">➔</span>
                <span>12</span>
                <span className="text-neutral-400 font-normal">➔</span>
                <span>24</span>
                <span className="text-neutral-400 font-normal">➔</span>
                <span className="px-4 py-1 rounded-xl bg-emerald-100 text-emerald-800 border-2 border-emerald-500">
                  ?
                </span>
              </div>
            </div>

            {/* Option Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(currentQuestion.options || []).map((opt) => {
                const isSelected = singleChoiceId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectSingleChoice(opt.id)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[90px] ${
                      isSelected
                        ? 'border-black bg-neutral-100 font-black text-xl shadow-xs'
                        : 'border-neutral-200 bg-white hover:border-neutral-400 font-bold text-lg'
                    }`}
                  >
                    <span className="text-black">{opt.label}</span>
                  </button>
                );
              })}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* ACTIVITY 4: RULE GROUPING (EXPLICIT CRITERIA / SWITCH)     */}
        {/* ========================================================= */}
        {currentQuestion.activityKind === 'rule_grouping' && (
          <div className="space-y-4 pt-2">
            
            {/* Rule Callout Banner */}
            {currentQuestion.ruleDescription && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 font-bold text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{currentQuestion.ruleDescription}</span>
              </div>
            )}

            {/* Shape Options */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {(currentQuestion.options || []).map((opt) => {
                const isSelected = selectedOptionIds.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleToggleCard(opt.id)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'border-black bg-neutral-100 shadow-xs'
                        : 'border-neutral-200 bg-white hover:border-neutral-400'
                    }`}
                  >
                    <CognitiveShapeVisual shapeSvg={opt.shapeSvg} className="w-12 h-12" />
                    <span className="text-xs font-bold text-black">{opt.label}</span>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected ? 'bg-black border-black text-white' : 'border-neutral-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* ACTIVITY 5: VISUAL-SPATIAL (ROTATION / MATRIX MATCH)       */}
        {/* ========================================================= */}
        {currentQuestion.activityKind === 'visual_spatial_match' && (
          <div className="space-y-6 pt-2">
            
            {/* Target Reference Box */}
            <div className="p-5 rounded-2xl bg-neutral-50 border-2 border-neutral-300 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-xl bg-white border border-neutral-200 p-2 flex items-center justify-center shadow-xs">
                {currentQuestion.id === 'q-vs-1' ? (
                  <CognitiveShapeVisual shapeSvg="l-target" className="w-12 h-12" />
                ) : (
                  <CognitiveShapeVisual shapeSvg="quad-correct" className="w-12 h-12" />
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Target Shape to Match
                </span>
                <p className="text-xs sm:text-sm font-bold text-black">
                  {currentQuestion.id === 'q-vs-1'
                    ? 'Reference Shape (North-East Orientation)'
                    : '2x2 Quadrant Symmetry Grid (Find the missing piece)'}
                </p>
              </div>
            </div>

            {/* 4 Alternative Choices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(currentQuestion.options || []).map((opt) => {
                const isSelected = singleChoiceId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectSingleChoice(opt.id)}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3.5 cursor-pointer text-left ${
                      isSelected
                        ? 'border-black bg-neutral-100 shadow-xs'
                        : 'border-neutral-200 bg-white hover:border-neutral-400'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl bg-neutral-50 border border-neutral-200 p-1 flex items-center justify-center shrink-0">
                      <CognitiveShapeVisual shapeSvg={opt.shapeSvg} className="w-10 h-10" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-bold text-black block">{opt.label}</span>
                      <span className="text-[10px] text-neutral-400">Option choice</span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-black bg-black text-white' : 'border-neutral-300'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* ACTIVITY 1 RETURN: DELAYED MEMORY RECALL (FINAL TASK)       */}
        {/* ========================================================= */}
        {currentQuestion.activityKind === 'memory_delayed_recall' && (
          <div className="space-y-4 pt-2">
            
            {/* Header badge */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 font-medium text-xs flex items-center gap-2">
              <Brain className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Select all 6 original items you studied at the start of the assessment. 6 of the 12 items below are distractors.
              </span>
            </div>

            {/* 12 Item Cards (6 Originals + 6 Distractors) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(currentQuestion.options || []).map((opt) => {
                const isSelected = selectedOptionIds.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleToggleCard(opt.id)}
                    className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer min-h-[95px] ${
                      isSelected
                        ? 'border-black bg-neutral-100 shadow-xs'
                        : 'border-neutral-200 bg-white hover:border-neutral-400'
                    }`}
                  >
                    <span className="text-xl">
                      {opt.id === 'm-apple' && '🍎'}
                      {opt.id === 'm-clock' && '⏰'}
                      {opt.id === 'm-river' && '🌊'}
                      {opt.id === 'm-garden' && '🌸'}
                      {opt.id === 'm-key' && '🔑'}
                      {opt.id === 'm-bicycle' && '🚲'}
                      {opt.id === 'd-book' && '📖'}
                      {opt.id === 'd-candle' && '🕯️'}
                      {opt.id === 'd-mountain' && '⛰️'}
                      {opt.id === 'd-shoe' && '👟'}
                      {opt.id === 'd-pencil' && '✏️'}
                      {opt.id === 'd-bottle' && '🍾'}
                    </span>
                    <span className="text-xs font-bold text-black leading-tight">{opt.label}</span>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected ? 'bg-black border-black text-white' : 'border-neutral-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 px-1 pt-1">
              <span>Expected Items: 6 original items</span>
              <span className="font-bold text-black">Selected: {selectedOptionIds.length}</span>
            </div>

          </div>
        )}

        {/* Validation Error Message */}
        {validationError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Bottom Navigation Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-100">
          
          <div>
            {currentStepIndex > 0 && currentQuestion.activityKind !== 'memory_delayed_recall' && (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:text-black text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Task</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#09090b] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_rgba(9,9,11,0.6)] transition-all"
          >
            <span>
              {currentStepIndex >= totalQuestions - 1
                ? 'Submit Assessment & View Results'
                : currentQuestion.activityKind === 'memory_study'
                ? 'I Have Memorized Them (Continue)'
                : 'Continue to Next Task'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>

      </div>

      {/* Confirmation Dialog for Early Pause / Exit */}
      {isExitDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border-2 border-black shadow-2xl space-y-4">
            
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <Pause className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-black">Pause Cognitive Assessment?</h3>
              <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                You can save your current progress and resume whenever you're ready, or exit to the dashboard.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={onPauseAndExit}
                className="w-full py-3 rounded-xl bg-[#09090b] text-white font-bold text-xs hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Save Progress & Return to Dashboard
              </button>

              <button
                type="button"
                onClick={() => {
                  clearActiveSession();
                  onPauseAndExit();
                }}
                className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Discard Session & Exit
              </button>

              <button
                type="button"
                onClick={() => setIsExitDialogOpen(false)}
                className="w-full py-2 text-xs font-semibold text-neutral-500 hover:text-black transition-colors cursor-pointer"
              >
                Keep Going
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
