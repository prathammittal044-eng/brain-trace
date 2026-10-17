import React, { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  Clock,
  Target,
  FileText,
  Printer,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Zap,
  Puzzle,
  Compass,
  AlertTriangle,
  Download,
  Loader2,
  Check
} from 'lucide-react';
import { AssessmentSession, CognitiveDomain } from '../../types/cognitiveAssessment';
import { DOMAIN_METADATA } from '../../utils/cognitiveScoring';
import { downloadCognitiveAssessmentPdf } from '../../services/cognitiveReportPdf';

interface AssessmentResultsProps {
  session: AssessmentSession;
  onViewReport: () => void;
  onViewHistory: () => void;
  onReturnToDashboard: () => void;
}

export const AssessmentResults: React.FC<AssessmentResultsProps> = ({
  session,
  onViewReport,
  onViewHistory,
  onReturnToDashboard
}) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);
  const [downloadErrorMsg, setDownloadErrorMsg] = useState<string | null>(null);

  const score = session.score;
  const overallScore = score?.overallScore || 0;

  // Format duration
  const minutes = Math.floor((session.durationSeconds || 0) / 60);
  const seconds = (session.durationSeconds || 0) % 60;
  const durationFormatted = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;

  // Format completed date
  const completedDate = session.completedAt
    ? new Date(session.completedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('en-GB');

  const domainList: CognitiveDomain[] = [
    'memory',
    'attention',
    'workingMemory',
    'pattern',
    'visualSpatial'
  ];

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    setDownloadSuccessMsg(null);
    setDownloadErrorMsg(null);

    try {
      const res = await downloadCognitiveAssessmentPdf(session);
      if (res.success) {
        setDownloadSuccessMsg(`Downloaded ${res.filename}`);
        setTimeout(() => setDownloadSuccessMsg(null), 5000);
      } else {
        setDownloadErrorMsg(res.error || 'Failed to generate PDF');
      }
    } catch (err) {
      console.error('PDF generation error in Results:', err);
      setDownloadErrorMsg('Unexpected error downloading PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Top Completion Header Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              Assessment Completed
            </span>
            <span className="text-xs text-neutral-500 font-medium">{completedDate}</span>
          </div>
        </div>

        <button
          onClick={onReturnToDashboard}
          className="text-xs font-bold text-neutral-600 hover:text-black transition-colors self-start sm:self-auto cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>

      {/* Main Score Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#09090b] shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] space-y-6">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-neutral-100">
          
          {/* Left Title */}
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-bold">
              <Brain className="w-3.5 h-3.5 text-black" />
              <span>Daily Cognitive Activity Summary</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-black tracking-tight">
              Assessment Summary
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-md font-normal leading-relaxed">
              Performance breakdown from today’s 5 cognitive domains. Calculated as the unweighted mean across all completed scored trials.
            </p>
          </div>

          {/* Right Giant Score Box */}
          <div className="bg-neutral-50 border-2 border-black rounded-3xl p-6 flex flex-col items-center justify-center min-w-[200px] shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Activity Score
            </span>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-5xl sm:text-6xl font-black text-black tracking-tight">
                {overallScore}
              </span>
              <span className="text-sm font-bold text-neutral-400">/ 100</span>
            </div>
            <div className="text-xs font-extrabold px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Completed Session
            </div>
          </div>

        </div>

        {/* 4 Stats Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="bg-neutral-50/80 border border-neutral-200 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-neutral-200 text-black flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-neutral-500 font-bold uppercase">Duration</div>
              <div className="text-xs sm:text-sm font-extrabold text-black">{durationFormatted}</div>
            </div>
          </div>

          <div className="bg-neutral-50/80 border border-neutral-200 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-neutral-500 font-bold uppercase">Scored Tasks</div>
              <div className="text-xs sm:text-sm font-extrabold text-black">
                {score?.totalScoredQuestions || 10} Tasks
              </div>
            </div>
          </div>

          <div className="bg-neutral-50/80 border border-neutral-200 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-neutral-500 font-bold uppercase">Precision</div>
              <div className="text-xs sm:text-sm font-extrabold text-black">
                {score?.totalCorrectQuestions || 0} Correct
              </div>
            </div>
          </div>

          <div className="bg-neutral-50/80 border border-neutral-200 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-neutral-500 font-bold uppercase">Session ID</div>
              <div className="text-xs font-mono font-bold text-black truncate max-w-[80px]">
                {session.id.slice(-6)}
              </div>
            </div>
          </div>

        </div>

        {/* 5 Domain Score Breakdown Bars */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-black">
              Domain Performance Breakdown
            </h3>
            <span className="text-[11px] text-neutral-400 font-semibold">
              Unweighted Category Accuracy
            </span>
          </div>

          <div className="space-y-3">
            {domainList.map((dom) => {
              const domData = score?.domainScores[dom] || {
                domain: dom,
                domainName: DOMAIN_METADATA[dom].name,
                correctResponses: 0,
                totalScoredResponses: 2,
                scorePercentage: 0,
                accuracyDescription: ''
              };

              const percentage = domData.scorePercentage;

              return (
                <div
                  key={dom}
                  className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-neutral-200 text-neutral-800 flex items-center justify-center shrink-0">
                        {dom === 'memory' && <Brain className="w-3.5 h-3.5" />}
                        {dom === 'attention' && <Target className="w-3.5 h-3.5" />}
                        {dom === 'workingMemory' && <Zap className="w-3.5 h-3.5" />}
                        {dom === 'pattern' && <Puzzle className="w-3.5 h-3.5" />}
                        {dom === 'visualSpatial' && <Compass className="w-3.5 h-3.5" />}
                      </div>
                      <span className="font-bold text-black">{domData.domainName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-500 font-medium">
                        {domData.correctResponses} of {domData.totalScoredResponses} Correct
                      </span>
                      <span className="font-black text-sm text-black">{percentage}%</span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        percentage >= 80
                          ? 'bg-emerald-600'
                          : percentage >= 60
                          ? 'bg-amber-500'
                          : 'bg-neutral-800'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rule-Based Neutral Observations */}
        {score?.observations && score.observations.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-black">
              Task Performance Observations
            </h3>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
              <ul className="space-y-1.5 text-xs text-neutral-700 leading-relaxed list-disc list-inside font-normal">
                {score.observations.map((obs, idx) => (
                  <li key={idx} className="font-medium text-neutral-800">
                    {obs}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Strict Medical Disclaimer Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950 font-normal">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold">Medical Notice:</span> The Daily Cognitive Activity Score reflects performance on these specific digital exercises only. It is not an indicator of dementia, cognitive impairment, or medical neurological diagnosis.
          </p>
        </div>

        {/* Download Feedback Banner */}
        {downloadSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccessMsg}</span>
          </div>
        )}
        {downloadErrorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{downloadErrorMsg}</span>
          </div>
        )}

        {/* 4 Working Action Buttons */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-neutral-100">
          
          <button
            type="button"
            onClick={onViewReport}
            className="px-4 py-3 rounded-xl bg-[#09090b] text-white text-xs font-bold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Detailed Report</span>
          </button>

          <button
            type="button"
            onClick={onViewHistory}
            className="px-4 py-3 rounded-xl border border-neutral-300 bg-white text-neutral-800 hover:text-black hover:border-black text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Assessment History</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="px-4 py-3 rounded-xl border border-neutral-300 bg-white text-neutral-800 hover:text-black hover:border-black disabled:opacity-60 disabled:cursor-not-allowed text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-neutral-600" />
                <span>Print / Save PDF</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onReturnToDashboard}
            className="px-4 py-3 rounded-xl border border-neutral-200 text-neutral-600 hover:text-black text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Return to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>

    </div>
  );
};
