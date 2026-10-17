import React, { useState } from 'react';
import {
  Calendar,
  FileText,
  Clock,
  Brain,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Sparkles,
  Info,
  Download,
  Loader2,
  Check
} from 'lucide-react';
import { AssessmentSession } from '../../types/cognitiveAssessment';
import { downloadCognitiveAssessmentPdf } from '../../services/cognitiveReportPdf';

interface AssessmentHistoryViewProps {
  history: AssessmentSession[];
  onSelectSession: (session: AssessmentSession) => void;
  onStartNewAssessment: () => void;
  onBackToDashboard: () => void;
}

export const AssessmentHistoryView: React.FC<AssessmentHistoryViewProps> = ({
  history,
  onSelectSession,
  onStartNewAssessment,
  onBackToDashboard
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [downloadingSessionId, setDownloadingSessionId] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const handleDownloadPdf = async (session: AssessmentSession, e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadingSessionId) return; // prevent duplicate clicks
    setDownloadingSessionId(session.id);
    setDownloadNotice(null);

    try {
      const res = await downloadCognitiveAssessmentPdf(session);
      if (res.success) {
        setDownloadNotice(`Downloaded: ${res.filename}`);
        setTimeout(() => setDownloadNotice(null), 5000);
      } else {
        setDownloadNotice(`Error: ${res.error || 'Failed to download PDF'}`);
        setTimeout(() => setDownloadNotice(null), 5000);
      }
    } catch (err) {
      console.error('History PDF download error:', err);
      setDownloadNotice('Unexpected error generating report.');
      setTimeout(() => setDownloadNotice(null), 5000);
    } finally {
      setDownloadingSessionId(null);
    }
  };

  const filtered = history.filter((s) => {
    if (!filterQuery) return true;
    const dateStr = s.completedAt || s.startedAt;
    return dateStr.toLowerCase().includes(filterQuery.toLowerCase()) || s.id.toLowerCase().includes(filterQuery.toLowerCase());
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-300 hover:border-black text-xs font-bold text-neutral-700 hover:text-black transition-all bg-white cursor-pointer shadow-xs mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
            Cognitive Assessment History
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-normal mt-0.5">
            Review past daily assessment records, domain performance trends, and printable reports
          </p>
        </div>

        <button
          type="button"
          onClick={onStartNewAssessment}
          className="px-5 py-2.5 rounded-xl bg-[#09090b] text-white text-xs font-bold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]"
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Start New Assessment</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#09090b] shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] space-y-6">
        
        {/* Comparison Notice Banner */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start gap-2.5 text-xs text-neutral-600">
          <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold text-black">Historical Comparison Notice:</span> Daily scores reflect personal engagement across comparable exercise batteries. Variations in daily scores can occur from sleep quality, stress, or time of day.
          </p>
        </div>

        {/* Global Download Feedback Banner */}
        {downloadNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadNotice}</span>
          </div>
        )}

        {/* Sessions List or Empty State */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-black">No Assessment Records Found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              You haven't completed any cognitive assessments yet. Take your first Daily Brain Check to begin building your baseline record.
            </p>
            <button
              type="button"
              onClick={onStartNewAssessment}
              className="mt-2 px-6 py-2.5 rounded-xl bg-[#09090b] text-white text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Start First Assessment
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((session) => {
              const score = session.score;
              const overallScore = score?.overallScore || 0;

              // Date formatting
              const rawDate = session.completedAt || session.startedAt;
              const dateObj = new Date(rawDate);
              const day = dateObj.toLocaleDateString('en-GB', { day: 'numeric' });
              const month = dateObj.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
              const fullDateStr = dateObj.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              const minutes = Math.floor((session.durationSeconds || 0) / 60);
              const seconds = (session.durationSeconds || 0) % 60;
              const durationStr = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;

              return (
                <div
                  key={session.id}
                  className="p-4 sm:p-5 rounded-2xl border-2 border-neutral-200 bg-neutral-50/40 hover:bg-neutral-50 hover:border-black transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  
                  {/* Left: Date Badge + Title */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex flex-col items-center justify-center shrink-0 border border-emerald-200 shadow-xs">
                      <span className="text-sm font-black leading-none">{day}</span>
                      <span className="text-[10px] font-bold tracking-wider">{month}</span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-black">
                          Daily Cognitive Check
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-600">
                          {session.version || 'v1.2.0'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 font-medium flex items-center gap-2">
                        <span>Completed • {fullDateStr}</span>
                        <span>•</span>
                        <span>{durationStr}</span>
                      </p>
                    </div>
                  </div>

                  {/* Middle / Right: Score & View Report Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-200">
                    
                    {/* Score display */}
                    <div className="text-left sm:text-right">
                      <div className="text-sm sm:text-base font-black text-black">
                        {overallScore} <span className="text-xs text-neutral-400 font-normal">/ 100</span>
                      </div>
                      <div className="text-[10px] font-extrabold text-emerald-600">
                        Completed
                      </div>
                    </div>

                    {/* Action Buttons: Download PDF + View Report */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDownloadPdf(session, e)}
                        disabled={downloadingSessionId === session.id}
                        title="Download PDF report directly"
                        className="px-3 py-2 rounded-xl border border-neutral-300 bg-white hover:border-black text-neutral-800 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {downloadingSessionId === session.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span className="hidden sm:inline">Generating...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5 text-neutral-600" />
                            <span className="hidden sm:inline">PDF</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectSession(session)}
                        className="px-4 py-2 rounded-xl bg-white border-2 border-neutral-300 hover:border-black text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-neutral-600" />
                        <span>View Report</span>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
