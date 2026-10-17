import React, { useState } from 'react';
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Brain,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  Hash,
  FileCheck,
  Download,
  Loader2,
  Check
} from 'lucide-react';
import { AssessmentSession, CognitiveDomain, PatientResponse } from '../../types/cognitiveAssessment';
import { DOMAIN_METADATA, CLINICAL_DISCLAIMER_TEXT } from '../../utils/cognitiveScoring';
import { downloadCognitiveAssessmentPdf } from '../../services/cognitiveReportPdf';
import { BrainTraceLogo } from '../BrainTraceLogo';

interface CognitiveReportProps {
  session: AssessmentSession;
  onBack: () => void;
}

export const CognitiveReport: React.FC<CognitiveReportProps> = ({ session, onBack }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [downloadErrorMessage, setDownloadErrorMessage] = useState<string | null>(null);

  const score = session.score;
  const overallScore = score?.overallScore || 0;

  // Format completed date
  const completedDate = session.completedAt
    ? new Date(session.completedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('en-GB');

  // Format duration
  const minutes = Math.floor((session.durationSeconds || 0) / 60);
  const seconds = (session.durationSeconds || 0) % 60;
  const durationFormatted = `${minutes} min ${seconds} sec`;

  const domainList: CognitiveDomain[] = [
    'memory',
    'attention',
    'workingMemory',
    'pattern',
    'visualSpatial'
  ];

  const handleGeneratePdf = async () => {
    if (isGeneratingPdf) return; // Prevent concurrent duplicate downloads
    setIsGeneratingPdf(true);
    setDownloadSuccessMessage(null);
    setDownloadErrorMessage(null);

    try {
      const result = await downloadCognitiveAssessmentPdf(session);
      if (result.success) {
        setDownloadSuccessMessage(`Saved: ${result.filename}`);
        setTimeout(() => {
          setDownloadSuccessMessage(null);
        }, 5000);
      } else {
        setDownloadErrorMessage(result.error || 'Failed to download report PDF');
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      setDownloadErrorMessage('An unexpected error occurred while generating PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      
      {/* Non-printing Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-neutral-300 hover:border-black text-xs font-bold text-neutral-700 hover:text-black transition-all bg-white cursor-pointer shadow-xs self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {downloadSuccessMessage && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{downloadSuccessMessage}</span>
            </div>
          )}

          {downloadErrorMessage && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-300 text-red-800 text-xs font-semibold animate-in fade-in">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>{downloadErrorMessage}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleBrowserPrint}
            title="Open system print dialog"
            className="px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-700 hover:text-black hover:border-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">System Print</span>
          </button>

          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="px-5 py-2.5 rounded-xl bg-[#09090b] text-white text-xs font-bold hover:bg-neutral-800 disabled:bg-neutral-600 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Print Report (Save as PDF)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PRINTABLE REPORT DOCUMENT CONTAINER                         */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-neutral-900 shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] print:border-none print:shadow-none print:p-0 space-y-8 print:space-y-6">
        
        {/* Document Header with Logo & Brand */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-black pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-black flex items-center justify-center p-1 text-white">
                <BrainTraceLogo className="w-full h-full text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-black">BrainTrace</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight pt-1">
              Daily Cognitive Activity Report
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              Digital Brain Wellness & Longitudinal Monitoring System
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1 text-xs">
            <div className="inline-block px-3 py-1 rounded-full bg-neutral-100 font-bold text-black border border-neutral-300 text-[11px]">
              Prototype Evaluation Record
            </div>
            <div className="text-neutral-500 font-mono text-[11px] pt-1">
              Session ID: <span className="text-black font-bold">{session.id}</span>
            </div>
            <div className="text-neutral-500 text-[11px]">
              Engine Version: <span className="text-black font-semibold">{session.version || 'v1.2.0-daily'}</span>
            </div>
          </div>
        </div>

        {/* Patient & Administration Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs">
          <div>
            <div className="text-[10px] uppercase font-bold text-neutral-400">Patient Identifier</div>
            <div className="font-bold text-black text-sm">
              {(!session.patientName || session.patientName.includes('Ankit') || session.patientName.includes('Bhadra') || session.patientName.includes('Alex Morgan'))
                ? 'Demo Patient (DX-4091)'
                : session.patientName}
            </div>
            <div className="text-[10px] text-neutral-500 font-mono">ID: {session.patientId}</div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-neutral-400">Administration Date</div>
            <div className="font-bold text-black text-sm">{completedDate}</div>
            <div className="text-[10px] text-neutral-500">Scheduled Daily Check</div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-neutral-400">Total Duration</div>
            <div className="font-bold text-black text-sm">{durationFormatted}</div>
            <div className="text-[10px] text-neutral-500">Unconstrained, self-paced</div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-neutral-400">Overall Activity Score</div>
            <div className="font-black text-black text-base">{overallScore} / 100</div>
            <div className="text-[10px] text-emerald-700 font-bold">Unweighted Category Mean</div>
          </div>
        </div>

        {/* 1. Score Summary Box */}
        <div className="p-6 rounded-2xl border-2 border-black bg-neutral-50 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <span className="text-xs uppercase font-extrabold text-neutral-500 tracking-wider">
              Summary Performance Index
            </span>
            <h2 className="text-xl font-black text-black">
              Overall Daily Cognitive Activity Score
            </h2>
            <p className="text-xs text-neutral-600 max-w-lg leading-relaxed">
              This score aggregates performance across 5 cognitive categories containing {score?.totalScoredQuestions || 10} scored questions. It reflects task precision and target discrimination on today’s interactive stimuli.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-neutral-300 min-w-[140px] shrink-0 text-center shadow-xs">
            <span className="text-4xl font-black text-black tracking-tight">{overallScore}</span>
            <span className="text-[11px] font-bold text-neutral-500">out of 100</span>
          </div>
        </div>

        {/* 2. Five Domain Performance Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-black">
              Categorical Domain Performance
            </h3>
            <span className="text-[11px] text-neutral-500 font-medium">
              Calculated as Correct Responses / Total Scored Responses × 100
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

              return (
                <div
                  key={dom}
                  className="p-4 rounded-xl border border-neutral-200 bg-white space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div>
                      <span className="font-extrabold text-black text-sm block">
                        {domData.domainName}
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        {DOMAIN_METADATA[dom].description}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 pt-1 sm:pt-0">
                      <span className="text-xs font-bold text-neutral-600">
                        {domData.correctResponses} / {domData.totalScoredResponses} Items
                      </span>
                      <span className="text-base font-black text-black w-14 text-right">
                        {domData.scorePercentage}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden border border-neutral-200">
                    <div
                      className={`h-full ${
                        domData.scorePercentage >= 80
                          ? 'bg-emerald-600'
                          : domData.scorePercentage >= 60
                          ? 'bg-amber-500'
                          : 'bg-neutral-800'
                      }`}
                      style={{ width: `${domData.scorePercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Raw Performance Statistics Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-black border-b border-neutral-200 pb-2">
            Detailed Task Statistics
          </h3>

          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 border-b border-neutral-200 text-neutral-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Domain</th>
                  <th className="py-2.5 px-3">Activity Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Raw Performance Metrics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {(Object.values(session.responses || {}) as PatientResponse[]).map((resp, idx) => {
                  return (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="py-2.5 px-3 font-bold text-black uppercase text-[10px]">
                        {resp.domain}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-700 capitalize font-medium">
                        {resp.activityKind.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2.5 px-3">
                        {resp.isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Full Credit
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold text-[11px]">
                            Partial / Variance
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600 text-[11px]">
                        {resp.rawDetails?.summaryText ||
                          `Correct: ${resp.rawDetails?.correctSelections ?? (resp.isCorrect ? 1 : 0)}, Errors: ${
                            resp.rawDetails?.incorrectSelections ?? (resp.isCorrect ? 0 : 1)
                          }, Time: ${resp.rawDetails?.timeTakenSeconds ?? '-'}s`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Neutral Observations */}
        {score?.observations && score.observations.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-black border-b border-neutral-200 pb-2">
              Task Performance Observations
            </h3>
            <ul className="space-y-1.5 text-xs text-neutral-700 leading-relaxed list-disc list-inside bg-neutral-50 p-4 rounded-xl border border-neutral-200">
              {score.observations.map((obs, idx) => (
                <li key={idx} className="font-medium text-neutral-800">
                  {obs}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 5. Suggested Next Steps */}
        <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-black">
            Suggested Next Steps
          </h4>
          <ul className="text-xs text-neutral-600 space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Continue periodic daily sessions to establish personal baseline trends over 30 days.</li>
            <li>Maintain regular aerobic physical activity, adequate hydration, and consistent sleep hygiene.</li>
            <li>If you or family members notice persistent memory changes or everyday difficulties, share these longitudinal records with a qualified healthcare provider.</li>
          </ul>
        </div>

        {/* 6. Medical Disclaimer and Limitations */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 text-[11px] text-amber-950 space-y-1 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 uppercase">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span>Clinical Disclaimer & Regulatory Limitations</span>
          </div>
          <p>{CLINICAL_DISCLAIMER_TEXT}</p>
          <p className="font-semibold pt-0.5">
            This digital report has not been signed, reviewed, or approved as a medical diagnostic report by a licensed physician. It is an algorithmic summary of prototype cognitive wellness activities.
          </p>
        </div>

        {/* Footer Document Signature / Stamp */}
        <div className="border-t border-neutral-300 pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-neutral-500 gap-2">
          <div>Generated by BrainTrace Cognitive Health Engine • Local Prototype Session</div>
          <div>Report Document ID: DX-REP-{session.id.slice(-8).toUpperCase()}</div>
        </div>

      </div>

    </div>
  );
};
