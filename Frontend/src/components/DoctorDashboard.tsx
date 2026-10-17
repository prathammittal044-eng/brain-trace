import React, { useState, useEffect } from 'react';
import { appointmentApi } from '../services/apiClient';

import { 
  Stethoscope, 
  Brain, 
  Users, 
  Calendar, 
  Clock, 
  Search, 
  Upload, 
  FileText, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Home, 
  Download, 
  Send, 
  Activity, 
  ShieldCheck, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Zap,
  Info,
  Eye,
  X,
  Printer,
  User,
  HeartPulse
} from 'lucide-react';
import { BrainTraceLogo } from './BrainTraceLogo';

interface ConsultationReport {
  reportId: string;
  date: string;
  mriSummary: string;
  hippocampalVol: string;
  cognitiveScore: string;
  reactionTime: string;
  memoryAccuracy: string;
  aiRiskLevel: string;
  doctorNotes: string;
  medications: string[];
  recommendedActions: string[];
}

interface Appointment {
  id: string;
  patient: string;
  age: number;
  time: string;
  type: string;
  status: string;
  issue: string;
  report: ConsultationReport;
}

interface DoctorDashboardProps {
  userName: string;
  onLogout: () => void;
  onBackToHome: () => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  userName,
  onLogout,
  onBackToHome
}) => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'ai-mri' | 'patients' | 'prescription'>('appointments');

  // Appointments state with comprehensive consultation reports
  const [appointments, setAppointments] = useState<Appointment[]>([
    { 
      id: '1', 
      patient: 'Demo Patient (DX-4091)', 
      age: 65, 
      time: '10:00 AM', 
      type: 'In-Person Consultation', 
      status: 'Upcoming', 
      issue: 'Follow-up on MRI brain scan & memory test',
      report: {
        reportId: 'REP-2026-081',
        date: 'July 25, 2026',
        mriSummary: 'Normal brain parenchyma without acute ischemic changes. Minimal periventricular white matter hyperintensities (Fazekas 1). Ventricles normal.',
        hippocampalVol: '3.82 cm³ (98.2% expected for age group)',
        cognitiveScore: '88 / 100 (Normal Cognitive Profile)',
        reactionTime: '342 ms (Optimal Visual-Spatial Motor Response)',
        memoryAccuracy: '92% Delayed Word Recall Precision',
        aiRiskLevel: 'LOW / STABLE',
        doctorNotes: 'Patient shows exemplary cognitive stability. BrainTrace daily memory exercises are yielding positive attention span maintenance.',
        medications: ['Donepezil 5mg (1 tab daily after breakfast)', 'Omega-3 Fatty Acids 1000mg'],
        recommendedActions: [
          'Continue 15-minute daily BrainTrace memory & recall puzzles',
          'Schedule routine follow-up MRI in 6 months',
          'Maintain regular aerobic physical activity (30 mins/day)'
        ]
      }
    },
    { 
      id: '2', 
      patient: 'Priya Sharma', 
      age: 62, 
      time: '11:30 AM', 
      type: 'Tele-Consultation', 
      status: 'Confirmed', 
      issue: 'Mild cognitive impairment evaluation & speech test',
      report: {
        reportId: 'REP-2026-082',
        date: 'July 25, 2026',
        mriSummary: 'Slight age-related temporal lobe volume reduction. No focal vascular lesions or edema detected.',
        hippocampalVol: '3.15 cm³ (Slightly Reduced, Borderline MCI)',
        cognitiveScore: '76 / 100 (Mild Cognitive Impairment)',
        reactionTime: '485 ms (Slight Delay in Executive Function)',
        memoryAccuracy: '78% Precision in Pattern Matching',
        aiRiskLevel: 'MODERATE (Requires Monitoring)',
        doctorNotes: 'Speech analysis via BrainTrace indicates occasional word-finding pauses. Patient remains active and communicative.',
        medications: ['Rivastigmine 3mg (Twice daily with meals)', 'Vitamin B-Complex & D3 Supplement'],
        recommendedActions: [
          'Enforce daily structured caretaker-assisted cognitive games',
          'Speech therapy exercises 2x weekly',
          'Follow-up tele-checkup in 4 weeks'
        ]
      }
    },
    { 
      id: '3', 
      patient: 'Ramesh Gupta', 
      age: 71, 
      time: '02:00 PM', 
      type: 'Follow-up', 
      status: 'Pending', 
      issue: 'Medication review for Donepezil & sleep tracker',
      report: {
        reportId: 'REP-2026-083',
        date: 'July 25, 2026',
        mriSummary: 'Stable post-ischemic gliosis in right parietal cortex. Ventricles slightly enlarged consistent with age.',
        hippocampalVol: '3.40 cm³ (Within Age Expected Parameters)',
        cognitiveScore: '82 / 100 (Stable Post-Treatment)',
        reactionTime: '410 ms (Good Coordination)',
        memoryAccuracy: '85% Precision in Object Recognition',
        aiRiskLevel: 'LOW-MODERATE (Stable)',
        doctorNotes: 'Patient reporting improved sleep quality with caretaker supervision. No adverse cholinergic side effects from Donepezil.',
        medications: ['Donepezil 10mg (1 tab at bedtime)', 'Melatonin 3mg for circadian sleep hygiene'],
        recommendedActions: [
          'Monitor blood pressure daily in morning logbook',
          'Maintain regular social engagement and family interaction',
          'Review routine lab work (B12, Thyroid) during next clinic visit'
        ]
      }
    }
  ]);

  // Modal State for Viewing Scheduled Consultation Report
  const [selectedReportApt, setSelectedReportApt] = useState<Appointment | null>(null);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);

  // AI Scan State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  useEffect(() => {
    appointmentApi.list().then((res) => {
      if (res.data && res.data.length > 0) {
        setAppointments(res.data);
      }
    }).catch(() => {});
  }, []);


  // Prescription Form
  const [prescPatient, setPrescPatient] = useState('Demo Patient (DX-4091)');
  const [prescDiagnosis, setPrescDiagnosis] = useState('Stable Cognitive Profile (Mild Vascular Risk)');
  const [prescMeds, setPrescMeds] = useState('1. Donepezil 5mg - 1 Tablet Daily After Breakfast\n2. Omega-3 Fatty Acids 1000mg - 1 Capsule Daily');
  const [prescNotes, setPrescNotes] = useState('Continue daily 15-min BrainTrace memory puzzles. Re-evaluate in 3 months.');
  const [prescSaved, setPrescSaved] = useState(false);

  const handleRunAiScan = () => {
    setIsAnalyzing(true);
    setScanResult(null);
    setTimeout(() => {
      setIsAnalyzing(false);
      setScanResult({
        scanType: 'T1-Weighted Brain MRI (Axial)',
        patientName: 'Demo Patient (DX-4091)',
        dateProcessed: 'July 25, 2026',
        hippocampalVolume: 'Normal Range (3.82 cm³)',
        whiteMatterHyperintensities: 'Low Severity (Fazekas Grade 1)',
        aiConfidence: '98.4%',
        riskLevel: 'LOW / STABLE',
        summary: 'No focal acute infarction or space-occupying lesion. Ventricular system normal for age. Minimal periventricular white matter changes. Mild cognitive changes well within manageable threshold.'
      });
    }, 2000);
  };

  const handleSavePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    setPrescSaved(true);
    setTimeout(() => {
      setPrescSaved(false);
    }, 3000);
  };

  const handlePrintDownloadReport = () => {
    setDownloadSuccessToast(true);
    setTimeout(() => {
      setDownloadSuccessToast(false);
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#09090b] font-sans antialiased flex flex-col justify-between">
      
      {/* HEADER */}
      <header className="bg-white border-b-2 border-[#09090b] sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-black transition-colors cursor-pointer bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Portal Home</span>
          </button>

          <div className="h-5 w-px bg-neutral-300 hidden sm:block" />

          <div className="flex items-center gap-2">
            <BrainTraceLogo className="w-6 h-6" />
            <span className="font-black text-base tracking-tight">BrainTrace</span>
            {/* <span className="px-2.5 py-0.5 rounded-full bg-blue-100 border border-blue-300 text-blue-900 text-[10px] font-extrabold uppercase tracking-wider">
              Doctor Console
            </span> */}
          </div>
        </div>

        {/* Doctor Info & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 border-r border-neutral-200 pr-3">
            <div className="w-8 h-8 rounded-full bg-black text-white font-black text-xs flex items-center justify-center shadow-xs">
              DR
            </div>
            <div className="text-left leading-tight">
              <p className="text-xs font-bold text-black">{userName}</p>
              <p className="text-[10px] text-neutral-500 font-semibold">MD Neurology • Apollo Hospitals</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl border border-neutral-200 hover:border-black bg-white text-neutral-600 hover:text-black transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        
        {/* WELCOME BANNER */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-black">Doctor Clinical Dashboard</h1>
              {/* <span className="text-xs font-bold bg-blue-50 text-blue-900 px-2.5 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" /> AI BrainTrace Engine Active
              </span> */}
            </div>
            <p className="text-xs sm:text-sm text-neutral-600">
              Welcome back, <span className="font-bold text-black">{userName}</span>. You have 3 patient consultations scheduled today.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ai-mri')}
              className="px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-2"
            >
              <Brain className="w-4 h-4 text-emerald-400" />
              <span>Analyze MRI Scan</span>
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 overflow-x-auto">
          {[
            { id: 'appointments', label: "Today's Schedule", icon: Calendar },
            { id: 'ai-mri', label: 'BrainTrace AI MRI Diagnostic', icon: Brain },
            { id: 'patients', label: 'Patient Roster & History', icon: Users },
            { id: 'prescription', label: 'E-Prescription & Care Plan', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: TODAY'S SCHEDULE */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            
            {/* STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-4 border-2 border-[#09090b] shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Today's Appointments</span>
                  <span className="text-xl font-black text-black">3 Patients</span>
                  <span className="text-[10px] text-blue-700 font-bold block">Next at 10:00 AM</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border-2 border-[#09090b] shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">MRI Scans Reviewed</span>
                  <span className="text-xl font-black text-black">14 Scans</span>
                  <span className="text-[10px] text-purple-700 font-bold block">All Scans AI-Annotated</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border-2 border-[#09090b] shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Avg Cognitive Score</span>
                  <span className="text-xl font-black text-black">86.4 / 100</span>
                  <span className="text-[10px] text-emerald-700 font-bold block">Stable across cohort</span>
                </div>
              </div>
            </div>

            {/* APPOINTMENTS LIST */}
            <div className="bg-white rounded-2xl p-6 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] space-y-4">
              <div className="border-b border-neutral-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-black flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Scheduled Consultations</span>
                  </h2>
                  <p className="text-xs text-neutral-500">July 25, 2026 • 3 Consultations Today</p>
                </div>

                <button
                  onClick={() => setSelectedReportApt(appointments[0])}
                  className="px-3.5 py-1.5 rounded-xl border-2 border-black bg-blue-50 hover:bg-blue-100 text-blue-950 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>View All Scheduled Reports ({appointments.length})</span>
                </button>
              </div>

              <div className="space-y-3">
                {appointments.map(apt => (
                  <div key={apt.id} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-black transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-black">{apt.patient}</span>
                        <span className="text-xs text-neutral-500">({apt.age} yrs)</span>
                        <span className="px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800 font-bold text-[10px]">
                          {apt.type}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Report Ready
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 font-medium">{apt.issue}</p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
                      <span className="text-xs font-mono font-bold text-black bg-white border border-neutral-300 px-3 py-1.5 rounded-lg">
                        {apt.time}
                      </span>

                      {/* View Report Button */}
                      <button
                        onClick={() => setSelectedReportApt(apt)}
                        className="px-3.5 py-1.5 rounded-xl border-2 border-neutral-800 hover:border-black bg-white hover:bg-neutral-100 text-black text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>View Report</span>
                      </button>

                      {/* Start Session Button */}
                      <button 
                        onClick={() => {
                          setPrescPatient(apt.patient);
                          setActiveTab('prescription');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>Start Session</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: AI BRAINTRACE MRI DIAGNOSTIC */}
        {activeTab === 'ai-mri' && (
          <div className="bg-white rounded-2xl p-6 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-black flex items-center gap-2">
                  <Brain className="w-5 h-5 text-black" />
                  <span>BrainTrace Deep Brain Scan Diagnostic AI</span>
                </h2>
                <p className="text-xs text-neutral-500">
                  Upload DICOM or NIfTI MRI scan file for automated volumetric & cognitive risk scoring
                </p>
              </div>
            </div>

            {/* Upload Box */}
            <div className="border-2 border-dashed border-neutral-300 hover:border-black rounded-2xl p-8 text-center space-y-3 bg-neutral-50/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-neutral-100 border border-neutral-300 flex items-center justify-center mx-auto text-black">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-black">Drag and drop MRI scan file (.dcm, .nii, .png)</p>
                <p className="text-[11px] text-neutral-500">Supported modalities: T1, T2, FLAIR, DWI</p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={handleRunAiScan}
                  disabled={isAnalyzing}
                  className="px-6 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Running BrainTrace Deep AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Load Sample Patient Scan (DX-4091)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI DIAGNOSTIC OUTPUT RESULTS */}
            {scanResult && (
              <div className="bg-neutral-50 border-2 border-black rounded-2xl p-6 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">Patient Analysis</span>
                    <h3 className="text-base font-black text-black">{scanResult.patientName}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs">
                    Risk Level: {scanResult.riskLevel}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-neutral-200 space-y-0.5">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">Hippocampal Volume</span>
                    <p className="font-bold text-black">{scanResult.hippocampalVolume}</p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-neutral-200 space-y-0.5">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">White Matter Changes</span>
                    <p className="font-bold text-black">{scanResult.whiteMatterHyperintensities}</p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-neutral-200 space-y-0.5">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">AI Model Confidence</span>
                    <p className="font-bold text-black">{scanResult.aiConfidence}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-1">
                  <h4 className="text-xs font-bold text-black uppercase tracking-wider">Radiological Impression</h4>
                  <p className="text-xs text-neutral-700 leading-relaxed">{scanResult.summary}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PATIENT ROSTER */}
        {activeTab === 'patients' && (
          <div className="bg-white rounded-2xl p-6 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] space-y-4">
            <h2 className="text-base font-bold text-black border-b border-neutral-100 pb-3">
              Registered Patients Directory
            </h2>

            <div className="space-y-3">
              {[
                { name: 'Demo Patient (DX-4091)', age: 65, id: 'DX-4091', lastVisit: 'July 10, 2026', score: '88/100', status: 'Stable' },
                { name: 'Priya Sharma', age: 62, id: 'PAT-8821', lastVisit: 'June 22, 2026', score: '76/100', status: 'Mild MCI' },
                { name: 'Ramesh Gupta', age: 71, id: 'PAT-7419', lastVisit: 'July 01, 2026', score: '82/100', status: 'Stable' }
              ].map(p => (
                <div key={p.id} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-black">{p.name} <span className="text-xs text-neutral-500 font-normal">({p.id})</span></h3>
                    <p className="text-xs text-neutral-600">Age: {p.age} • Last Consultation: {p.lastVisit}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-black block">Cognitive Score: {p.score}</span>
                    <span className="text-[10px] font-semibold text-emerald-700">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PRESCRIPTION */}
        {activeTab === 'prescription' && (
          <div className="bg-white rounded-2xl p-6 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-black">Generate E-Prescription & Clinical Care Plan</h2>
                <p className="text-xs text-neutral-500">Issue official treatment plan to patient and caretaker portals</p>
              </div>
            </div>

            {prescSaved && (
              <div className="p-3 bg-emerald-50 border-2 border-emerald-500 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>E-Prescription generated & transmitted to patient portal successfully!</span>
              </div>
            )}

            <form onSubmit={handleSavePrescription} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-black mb-1 block">Patient Name</label>
                <input
                  type="text"
                  value={prescPatient}
                  onChange={e => setPrescPatient(e.target.value)}
                  className="w-full p-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-black font-bold focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-black mb-1 block">Clinical Diagnosis</label>
                <input
                  type="text"
                  value={prescDiagnosis}
                  onChange={e => setPrescDiagnosis(e.target.value)}
                  className="w-full p-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-black mb-1 block">Prescribed Medication & Dosage</label>
                <textarea
                  value={prescMeds}
                  onChange={e => setPrescMeds(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-black focus:outline-none focus:border-black font-mono resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-black mb-1 block">Cognitive & Caretaker Advice</label>
                <textarea
                  value={prescNotes}
                  onChange={e => setPrescNotes(e.target.value)}
                  rows={2}
                  className="w-full p-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-black focus:outline-none focus:border-black resize-none"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Issue E-Prescription</span>
              </button>
            </form>
          </div>
        )}

      </main>

      {/* SCHEDULED CONSULTATION REPORT MODAL DIALOG */}
      {selectedReportApt && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="max-w-3xl w-full bg-white rounded-2xl border-2 border-[#09090b] shadow-[8px_8px_0px_0px_rgba(9,9,11,1)] my-auto overflow-hidden relative space-y-0 text-left">
            
            {/* MODAL HEADER WITH PATIENT SWITCHER */}
            <div className="bg-[#09090b] text-white p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainTraceLogo className="w-6 h-6" />
                  <div>
                    <h3 className="font-black text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                      <span>Clinical Consultation Report</span>
                      <span className="text-[10px] bg-blue-500 text-white font-mono px-2 py-0.5 rounded uppercase">
                        {selectedReportApt.report.reportId}
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-300">
                      Doctor Clinical Review & AI Brain Diagnostic • {selectedReportApt.report.date}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedReportApt(null)}
                  className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Close Report"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* PATIENT SWITCHER TABS */}
              <div className="pt-1 flex items-center gap-2 overflow-x-auto border-t border-neutral-800">
                <span className="text-[11px] text-neutral-400 font-bold uppercase shrink-0">Select Scheduled Patient:</span>
                {appointments.map(apt => {
                  const isSelected = selectedReportApt.id === apt.id;
                  return (
                    <button
                      key={apt.id}
                      onClick={() => setSelectedReportApt(apt)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-white text-black border-white shadow-xs'
                          : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      <User className="w-3 h-3" />
                      <span>{apt.patient}</span>
                      <span className="text-[10px] opacity-70">({apt.time})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DOWNLOAD TOAST ALERT */}
            {downloadSuccessToast && (
              <div className="bg-emerald-500 text-white text-xs font-bold p-3 text-center flex items-center justify-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Consultation report for {selectedReportApt.patient} exported to PDF / Print queue successfully!</span>
              </div>
            )}

            {/* MODAL BODY CONTENT */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              
              {/* PATIENT DEMOGRAPHICS & APPOINTMENT BANNER */}
              <div className="bg-neutral-50 border-2 border-neutral-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase block">Patient Name</span>
                  <span className="font-extrabold text-black text-sm">{selectedReportApt.patient}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase block">Age / Gender</span>
                  <span className="font-bold text-neutral-800">{selectedReportApt.age} Years • Male</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase block">Consultation Time</span>
                  <span className="font-mono font-bold text-black">{selectedReportApt.time} Today</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase block">Type</span>
                  <span className="font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                    {selectedReportApt.type}
                  </span>
                </div>
              </div>

              {/* 1. MRI & STRUCTURAL SCAN SUMMARY */}
              <div className="border border-neutral-200 rounded-xl p-4 bg-white space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-black flex items-center gap-1.5 border-b border-neutral-100 pb-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span>1. MRI Volumetric & Radiologic Findings</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-purple-50/50 border border-purple-200 p-2.5 rounded-lg space-y-0.5">
                    <span className="text-[10px] font-bold text-purple-900 uppercase">Hippocampal Volume</span>
                    <p className="font-extrabold text-purple-950">{selectedReportApt.report.hippocampalVol}</p>
                  </div>
                  <div className="bg-blue-50/50 border border-blue-200 p-2.5 rounded-lg space-y-0.5">
                    <span className="text-[10px] font-bold text-blue-900 uppercase">White Matter Status</span>
                    <p className="font-bold text-blue-950">Fazekas Grade 1 (Minimal Lesion Burden)</p>
                  </div>
                </div>
                <p className="text-xs text-neutral-700 leading-relaxed pt-1">
                  <strong className="text-black">Structural Impression:</strong> {selectedReportApt.report.mriSummary}
                </p>
              </div>

              {/* 2. COGNITIVE TEST PERFORMANCE */}
              <div className="border border-neutral-200 rounded-xl p-4 bg-white space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-black flex items-center gap-1.5 border-b border-neutral-100 pb-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>2. BrainTrace Cognitive Benchmark Scores</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase block">Overall Cognitive Index</span>
                    <span className="text-lg font-black text-emerald-950">{selectedReportApt.report.cognitiveScore}</span>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-lg text-center">
                    <span className="text-[10px] text-neutral-600 font-bold uppercase block">Motor Reaction Speed</span>
                    <span className="text-sm font-bold text-black">{selectedReportApt.report.reactionTime}</span>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-lg text-center">
                    <span className="text-[10px] text-neutral-600 font-bold uppercase block">Delayed Word Recall</span>
                    <span className="text-sm font-bold text-black">{selectedReportApt.report.memoryAccuracy}</span>
                  </div>
                </div>
              </div>

              {/* 3. AI RISK & NEUROLOGIST CLINICAL NOTES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1 border border-neutral-200 rounded-xl p-4 bg-neutral-50 space-y-2">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase block">AI Risk Assessment</span>
                  <div className="bg-white border-2 border-black p-3 rounded-xl text-center space-y-1">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto" />
                    <span className="font-black text-xs block text-black">{selectedReportApt.report.aiRiskLevel}</span>
                    <span className="text-[10px] text-neutral-500 block font-medium">98% AI Confidence Score</span>
                  </div>
                </div>

                <div className="sm:col-span-2 border border-neutral-200 rounded-xl p-4 bg-white space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-black flex items-center gap-1.5 border-b border-neutral-100 pb-1.5">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    <span>Neurologist Clinical Notes</span>
                  </h4>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    {selectedReportApt.report.doctorNotes}
                  </p>
                </div>
              </div>

              {/* 4. MEDICATIONS & CARE PLAN */}
              <div className="border border-neutral-200 rounded-xl p-4 bg-white space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-black flex items-center gap-1.5 border-b border-neutral-100 pb-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>4. Prescribed Regimen & Care Plan Instructions</span>
                </h4>
                
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-black block mb-1">Active Prescriptions:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-neutral-700 font-medium">
                      {selectedReportApt.report.medications.map((med, i) => (
                        <li key={i}>{med}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-1">
                    <span className="font-bold text-black block mb-1">Recommended Follow-up Actions:</span>
                    <div className="space-y-1">
                      {selectedReportApt.report.recommendedActions.map((act, i) => (
                        <div key={i} className="flex items-center gap-2 bg-neutral-50 p-2 rounded-lg border border-neutral-200 text-neutral-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* MODAL FOOTER ACTIONS */}
            <div className="bg-neutral-100 border-t border-neutral-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handlePrintDownloadReport}
                  className="w-full sm:w-auto px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Export PDF</span>
                </button>
                
                <button
                  onClick={() => {
                    setPrescPatient(selectedReportApt.patient);
                    setSelectedReportApt(null);
                    setActiveTab('prescription');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white border border-neutral-300 hover:border-black text-black text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Update E-Prescription</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedReportApt(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-neutral-200 hover:bg-neutral-300 text-black text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} BrainTrace Clinical Console. Encrypted & HIPAA Compliant.
      </footer>

    </div>
  );
};
