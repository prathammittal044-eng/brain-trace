import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Brain, 
  FileText, 
  Shield, 
  Calendar, 
  Settings, 
  LogOut, 
  Bell, 
  Info, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown, 
  ArrowRight, 
  Download, 
  Share2, 
  User, 
  Stethoscope, 
  QrCode,
  TrendingUp,
  Clock,
  ArrowLeft,
  Home,
  Upload,
  UploadCloud,
  Loader2,
  Disc,
  Maximize,
  Folder,
  AlertTriangle,
  Search,
  MessageSquare,
  ArrowUpDown,
  Pencil,
  Lock,
  Eye,
  Sliders,
  HelpCircle,
  Globe,
  Sun,
  Moon,
  Monitor,
  Check,
  Camera,
  Link,
  Trash2,
  Star,
  MapPin,
  Building2,
  Car,
  Plus,
  ChevronLeft,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Send,
  CheckCheck,
  ThumbsUp,
  Filter,
  Archive,
  X,
  Bot,
  Users,
  Flame,
  Target,
  Sparkles,
  Award,
  Trophy,
  BarChart2,
  BarChart3,
  Lightbulb,
  Zap,
  History,
  Puzzle,
  Compass
} from 'lucide-react';
import { BrainTraceLogo } from './BrainTraceLogo';
import { AssessmentIntroduction } from './cognitive/AssessmentIntroduction';
import { PracticeRound } from './cognitive/PracticeRound';
import { AssessmentWorkspace } from './cognitive/AssessmentWorkspace';
import { AssessmentResults } from './cognitive/AssessmentResults';
import { CognitiveReport } from './cognitive/CognitiveReport';
import { AssessmentHistoryView } from './cognitive/AssessmentHistoryView';
import { AssessmentSession } from '../types/cognitiveAssessment';
import {
  getActiveSession,
  createNewAssessmentSession,
  clearActiveSession,
  getAssessmentHistory,
  seedInitialHistoryIfEmpty
} from '../services/cognitiveAssessmentService';
import { MessagesView } from './MessagesView';
import {
  subscribeToCompanionNavigation,
  NavigationDestination
} from '../services/companionNavigation';
import { mriApi, appointmentApi, profileApi } from '../services/apiClient';
import { PatientCareHome } from './care_space/PatientCareHome';
import { CareSpaceView } from './CareSpaceView';

interface PatientDashboardProps {
  userName?: string;
  onLogout: () => void;
  onBackToHome?: () => void;
}

interface ScanData {
  id: string;
  date: string;
  time: string;
  type: string;
  uploader: string;
  status: 'Completed' | 'Processing' | 'Failed';
  prediction?: string;
  confidence?: string;
  progress?: number;
  viewType: 'axial' | 'sagittal' | 'coronal';
  verified?: boolean;
  analyzedOn?: string;
  gradcam_url?: string;
  report_preview?: string;
}


export const PatientDashboard: React.FC<PatientDashboardProps> = ({ 
  userName = 'Demo Patient (DX-4091)', 
  onLogout,
  onBackToHome
}) => {
  const cleanUserName = (!userName || userName.toLowerCase().includes('ankit') || userName.toLowerCase().includes('bhadra') || userName.includes('Alex Morgan')) ? 'Demo Patient (DX-4091)' : userName;
  const [activeTab, setActiveTab] = useState('Cognitive Test');
  const [selectedScanRange, setSelectedScanRange] = useState('All Scans');
  const [selectedScanId, setSelectedScanId] = useState('scan-1');
  const [searchQuery, setSearchQuery] = useState('');

  // Cognitive Assessment Flow State
  const [cognitiveSubView, setCognitiveSubView] = useState<
    'dashboard' | 'intro' | 'practice' | 'workspace' | 'results' | 'report' | 'history' | 'carespace'
  >('dashboard');
  const [activeCognitiveSession, setActiveCognitiveSession] = useState<AssessmentSession | null>(null);
  const [selectedReportSession, setSelectedReportSession] = useState<AssessmentSession | null>(null);
  const [prevSubView, setPrevSubView] = useState<'dashboard' | 'results' | 'history'>('dashboard');
  const [cognitiveHistory, setCognitiveHistory] = useState<AssessmentSession[]>(() => {
    return getAssessmentHistory(userName);
  });

  useEffect(() => {
    seedInitialHistoryIfEmpty(userName);
    const active = getActiveSession();
    if (active && active.status === 'in_progress') {
      setActiveCognitiveSession(active);
    }
    setCognitiveHistory(getAssessmentHistory(userName));
  }, [userName]);

  // Subscribe to BrainTrace Companion Navigation Actions
  useEffect(() => {
    const unsubscribe = subscribeToCompanionNavigation((destination: NavigationDestination) => {
      if (destination === 'home') {
        if (onBackToHome) onBackToHome();
      } else if (destination === 'dashboard') {
        setActiveTab('Dashboard');
      } else if (destination === 'cognitiveTest') {
        setActiveTab('Cognitive Test');
        setCognitiveSubView('dashboard');
      } else if (destination === 'startAssessment') {
        setActiveTab('Cognitive Test');
        const newSession = createNewAssessmentSession('DX-4091', cleanUserName);
        setActiveCognitiveSession(newSession);
        setCognitiveSubView('workspace');
      } else if (destination === 'assessmentResults') {
        setActiveTab('Cognitive Test');
        setCognitiveSubView('results');
      } else if (destination === 'assessmentHistory') {
        setActiveTab('Cognitive Test');
        setCognitiveSubView('history');
      } else if (destination === 'cognitiveReport') {
        setActiveTab('Cognitive Test');
        const hist = getAssessmentHistory(cleanUserName);
        if (hist.length > 0) {
          setSelectedReportSession(hist[0]);
          setCognitiveSubView('report');
        } else {
          setCognitiveSubView('results');
        }
      } else if (destination === 'myScans') {
        setActiveTab('My Scans');
      } else if (destination === 'uploadScan') {
        setActiveTab('My Scans');
        setIsUploadModalOpen(true);
      } else if (destination === 'appointments') {
        setActiveTab('Appointments');
      } else if (destination === 'bookAppointment') {
        setActiveTab('Appointments');
        setIsAppointmentConfirmed(false);
        setIsBookAppointmentOpen(true);
      } else if (destination === 'messages') {
        setActiveTab('Messages');
      } else if (destination === 'settings') {
        setActiveTab('Settings');
      }
    });

    return unsubscribe;
  }, [cleanUserName, onBackToHome]);

  // Book Appointment Modal State
  const [isBookAppointmentOpen, setIsBookAppointmentOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<number>(22);
  const [selectedTime, setSelectedTime] = useState<string>('10:00 AM');
  const [reasonForVisit, setReasonForVisit] = useState<string>('');
  const [isAppointmentConfirmed, setIsAppointmentConfirmed] = useState<boolean>(false);

  // Upload MRI Scan Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'succeeded'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState('Brain_MRI_2026.dcm');
  const [uploadedPrediction, setUploadedPrediction] = useState('Non Demented');
  const [uploadedConfidence, setUploadedConfidence] = useState('98.4%');
  const [uploadError, setUploadError] = useState('');

  const startUploadProcess = async (fileOrName?: File | string) => {
    let fileName = 'Brain_MRI_2026.dcm';
    let fileObj: File | null = null;
    if (fileOrName instanceof File) {
      fileObj = fileOrName;
      fileName = fileOrName.name;
    } else if (typeof fileOrName === 'string') {
      fileName = fileOrName;
    }
    setUploadedFileName(fileName);
    setUploadState('uploading');
    setUploadProgress(20);
    setUploadError('');

    if (fileObj) {
      try {
        setUploadProgress(40);
        const res = await mriApi.analyze(fileObj);
        setUploadProgress(100);
        const d = res.data;
        const pred = d.prediction || 'Non Demented';
        const conf = d.confidence ? `${(d.confidence * 100).toFixed(1)}%` : '98.4%';
        setUploadedPrediction(pred);
        setUploadedConfidence(conf);

        const newScan: ScanData = {
          id: d.mri_scan_id || `scan-${Date.now()}`,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          type: 'Brain MRI',
          uploader: 'Uploaded by you',
          status: 'Completed',
          prediction: pred,
          confidence: conf,
          viewType: 'axial',
          verified: d.model1?.prediction === 'MRI_DATA' || true,
          analyzedOn: `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
          gradcam_url: d.gradcam_url,
          report_preview: d.report_preview
        };
        setScansList(prev => [newScan, ...prev]);
        setSelectedScanId(newScan.id);
        setTimeout(() => setUploadState('succeeded'), 300);
        return;
      } catch (err: any) {
        console.error('MRI upload failed:', err);
        setUploadError(err.message || 'Scan analysis failed');
        setUploadState('idle');
        alert(`Analysis Notice: ${err.message || 'Failed to process scan'}`);
        return;
      }
    }

    let current = 20;
    const interval = setInterval(() => {
      current += 20;
      if (current >= 100) {
        setUploadProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setUploadState('succeeded');
        }, 400);
      } else {
        setUploadProgress(current);
      }
    }, 250);
  };


  // Settings State
  const [settingsSubTab, setSettingsSubTab] = useState('Profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: cleanUserName,
    email: 'demo.patient@braintrace-sample.internal',
    phone: '+1 (555) 010-0000',
    dob: '01 Jan 1960 (Sample)',
  });
  const [twoFactor, setTwoFactor] = useState(true);
  const [notifications, setNotifications] = useState({
    email: true,
    scanReminders: true,
    appointments: true,
    promotions: false,
  });
  const [preferences, setPreferences] = useState({
    language: 'English',
    theme: 'system',
    dateFormat: 'DD MMM YYYY',
    timeFormat: '12-Hour (AM/PM)',
    units: 'Metric (kg, cm)',
  });

  // Initial Scans Data matching screenshot exactly
  const INITIAL_SCANS: ScanData[] = [
    {
      id: 'scan-1',
      date: '15 Jul 2026',
      time: '10:30 AM',
      type: 'Brain MRI',
      uploader: 'Uploaded by you',
      status: 'Completed',
      prediction: 'Non Demented',
      confidence: '97.3%',
      viewType: 'axial',
      verified: true,
      analyzedOn: '15 Jul 2026 • 10:32 AM'
    },
    {
      id: 'scan-2',
      date: '22 Jun 2026',
      time: '09:15 AM',
      type: 'Brain MRI',
      uploader: 'Uploaded by you',
      status: 'Completed',
      prediction: 'Non Demented',
      confidence: '95.1%',
      viewType: 'sagittal',
      verified: true,
      analyzedOn: '22 Jun 2026 • 09:18 AM'
    },
    {
      id: 'scan-3',
      date: '30 May 2026',
      time: '11:20 AM',
      type: 'Brain MRI',
      uploader: 'Uploaded by you',
      status: 'Completed',
      prediction: 'Non Demented',
      confidence: '93.4%',
      viewType: 'coronal',
      verified: true,
      analyzedOn: '30 May 2026 • 11:23 AM'
    },
    {
      id: 'scan-4',
      date: '10 Apr 2026',
      time: '02:45 PM',
      type: 'Brain MRI',
      uploader: 'Uploaded by you',
      status: 'Completed',
      prediction: 'Non Demented',
      confidence: '91.8%',
      viewType: 'axial',
      verified: true,
      analyzedOn: '10 Apr 2026 • 02:48 PM'
    },
    {
      id: 'scan-5',
      date: '28 Mar 2026',
      time: '08:30 AM',
      type: 'Brain MRI',
      uploader: 'Uploaded by you',
      status: 'Processing',
      progress: 65,
      viewType: 'axial',
      verified: false
    }
  ];

  const [scansList, setScansList] = useState<ScanData[]>(INITIAL_SCANS);

  // Fetch scans and profile settings from backend upon mount
  useEffect(() => {
    mriApi.listScans().then((res) => {
      if (res.data && res.data.length > 0) {
        setScansList(res.data);
      }
    }).catch(() => {});

    profileApi.get().then((res) => {
      if (res.data) {
        setProfileData((prev) => ({
          ...prev,
          fullName: res.data.fullName || prev.fullName,
          email: res.data.email || prev.email,
          phone: res.data.phone || prev.phone,
          dob: res.data.dob || prev.dob,
        }));
        if (res.data.twoFactor !== undefined) {
          setTwoFactor(res.data.twoFactor);
        }
        if (res.data.preferences) {
          setPreferences((prev) => ({ ...prev, ...res.data.preferences }));
        }
      }
    }).catch(() => {});
  }, []);

  const selectedScan = scansList.find(s => s.id === selectedScanId) || scansList[0];


  // Display name formatted for welcome title
  const firstName = cleanUserName.split(' ')[0] || 'Demo';

  // Helper renderer for realistic SVG MRI Brain Scans
  const renderMriThumbnail = (viewType: 'axial' | 'sagittal' | 'coronal', isLarge = false) => {
    if (viewType === 'sagittal') {
      return (
        <svg className="w-full h-full rounded-lg" viewBox="0 0 200 200" fill="none">
          <rect width="200" height="200" rx="8" fill="#050507" />
          <path d="M 50 140 C 40 100 60 40 120 40 C 160 40 175 80 165 120 C 155 150 120 160 80 150 Z" fill="#121216" stroke="#2c2d38" strokeWidth="2" />
          <path d="M 70 120 C 80 80 110 60 140 70 C 150 90 140 120 110 130 Z" fill="#2e303c" />
          <path d="M 85 105 C 95 85 120 75 130 90 C 125 110 105 115 90 110 Z" fill="#585c72" />
          <path d="M 110 140 Q 130 150 125 170 Q 100 165 110 140 Z" fill="#383a4a" />
          <circle cx="110" cy="100" r="12" fill="#8b90ad" opacity="0.9" />
        </svg>
      );
    }

    if (viewType === 'coronal') {
      return (
        <svg className="w-full h-full rounded-lg" viewBox="0 0 200 200" fill="none">
          <rect width="200" height="200" rx="8" fill="#050507" />
          <ellipse cx="100" cy="100" rx="65" ry="75" fill="#121216" stroke="#2c2d38" strokeWidth="2" />
          <line x1="100" y1="25" x2="100" y2="175" stroke="#1f202a" strokeWidth="2" strokeDasharray="3 3" />
          <path d="M 50 90 Q 75 55 95 85 T 70 130 Z" fill="#2e303c" />
          <path d="M 150 90 Q 125 55 105 85 T 130 130 Z" fill="#2e303c" />
          <ellipse cx="90" cy="95" rx="12" ry="20" fill="#585c72" />
          <ellipse cx="110" cy="95" rx="12" ry="20" fill="#585c72" />
          <circle cx="92" cy="95" r="5" fill="#8b90ad" />
          <circle cx="108" cy="95" r="5" fill="#8b90ad" />
        </svg>
      );
    }

    // Default: Axial Slice
    return (
      <svg className="w-full h-full rounded-lg" viewBox="0 0 200 200" fill="none">
        <rect width="200" height="200" rx="8" fill="#050507" />
        <ellipse cx="100" cy="100" rx="72" ry="82" fill="#121216" stroke="#2c2d38" strokeWidth="2" />
        <line x1="100" y1="18" x2="100" y2="182" stroke="#1f202a" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M 50 90 C 65 50 90 50 95 85 C 90 120 60 130 50 90 Z" fill="#2e303c" />
        <path d="M 150 90 C 135 50 110 50 105 85 C 110 120 140 130 150 90 Z" fill="#2e303c" />
        <path d="M 62 80 C 75 60 92 65 92 88 C 85 105 70 105 62 80 Z" fill="#585c72" />
        <path d="M 138 80 C 125 60 108 65 108 88 C 115 105 130 105 138 80 Z" fill="#585c72" />
        <ellipse cx="94" cy="90" rx="4" ry="12" fill="#8b90ad" />
        <ellipse cx="106" cy="90" rx="4" ry="12" fill="#8b90ad" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#09090b] flex font-sans antialiased selection:bg-black selection:text-white">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-neutral-200/80 p-5 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="space-y-6">
          
          {/* Logo */}
          <div className="pt-1 pb-2">
            <BrainTraceLogo className="h-8" />
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {[
              { name: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
              { name: 'My Scans', icon: <Layers className="w-4 h-4" /> },
              { name: 'Cognitive Test', icon: <Brain className="w-4 h-4" /> },
              { name: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
              { name: 'Connected Care', icon: <Users className="w-4 h-4" /> },
              { name: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
              { name: 'Settings', icon: <Settings className="w-4 h-4" /> },
            ].map((item) => {
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#09090b] text-white shadow-sm'
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Logout */}
        <div className="space-y-3 pt-6 border-t border-neutral-200/80">
          
          {/* Profile Card */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-neutral-200 overflow-hidden shrink-0 border border-neutral-300 flex items-center justify-center font-black text-black">
                {firstName.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-bold text-black leading-tight">{cleanUserName}</div>
                <div className="text-[11px] text-neutral-500 font-medium flex items-center gap-1">
                  Patient <ChevronDown className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Home Page Link */}
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-neutral-600 hover:text-black transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-neutral-600 hover:text-black transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto space-y-6">
        
        {activeTab === 'Connected Care' ? (
          <PatientCareHome />
        ) : activeTab === 'Appointments' ? (
          /* ==================== APPOINTMENTS PAGE (EXACT REFERENCE DESIGN) ==================== */
          <div className="space-y-6">
            
            {/* Top Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
                  Appointments
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 font-normal mt-0.5">
                  Book, manage and track your appointments
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <button className="w-10 h-10 rounded-full border border-neutral-200 bg-white shadow-sm flex items-center justify-center text-neutral-700 hover:text-black hover:border-neutral-300 transition-all cursor-pointer relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                    3
                  </span>
                </button>

                {/* Book New Appointment Button */}
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#09090b] hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold tracking-wide shadow-sm transition-all cursor-pointer">
                  <Plus className="w-4 h-4" />
                  <span>Book New Appointment</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex flex-col md:flex-row items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search doctors, specialty or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 bg-neutral-50/50 text-xs sm:text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black font-medium transition-colors"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex items-center gap-2.5 overflow-x-auto w-full md:w-auto scrollbar-none shrink-0">
                <select className="px-3.5 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-black focus:outline-none focus:border-black cursor-pointer shadow-xs">
                  <option>All Specialties</option>
                  <option>Neurology</option>
                  <option>Neuro Surgery</option>
                  <option>Neuro Psychiatry</option>
                </select>

                <select className="px-3.5 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-black focus:outline-none focus:border-black cursor-pointer shadow-xs">
                  <option>All Locations</option>
                  <option>New Delhi</option>
                  <option>Gurugram</option>
                  <option>Bengaluru</option>
                  <option>Mumbai</option>
                </select>

                <select className="px-3.5 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-black focus:outline-none focus:border-black cursor-pointer shadow-xs">
                  <option>Any Availability</option>
                  <option>Today</option>
                  <option>Tomorrow</option>
                  <option>This Week</option>
                </select>

                <select className="px-3.5 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-black focus:outline-none focus:border-black cursor-pointer shadow-xs">
                  <option>Sort by: Recommended</option>
                  <option>Rating: High to Low</option>
                  <option>Experience: High to Low</option>
                  <option>Distance: Nearest</option>
                </select>
              </div>
            </div>

            {/* Section: Find a Doctor */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-black tracking-tight">Find a Doctor</h2>

              {/* Grid of 4 Doctor Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Doctor 1 */}
                <div className="bg-white rounded-2xl border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] overflow-hidden flex flex-col justify-between hover:translate-y-[-2px] transition-all">
                  <div className="p-4 space-y-3">
                    {/* Image Container with Badge */}
                    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                      <img 
                        src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400" 
                        alt="Dr. Rajesh Sharma" 
                        className="w-full h-full object-cover object-top"
                      />
                      <span className="absolute top-2.5 right-2.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200/80 shadow-xs">
                        Available Today
                      </span>
                    </div>

                    {/* Doctor Info */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-black">Dr. Rajesh Sharma</h3>
                      <p className="text-xs text-neutral-500 font-medium">Neurologist</p>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-700 font-semibold pt-1">
                        <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                        <span>4.9</span>
                        <span className="text-neutral-400 font-normal">(128 Reviews)</span>
                      </div>
                    </div>

                    {/* Location & Details */}
                    <div className="space-y-1.5 pt-2 border-t border-neutral-100 text-xs">
                      <div className="flex items-start gap-1.5 text-neutral-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <span>Apollo Hospitals, New Delhi</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 pl-5">
                        2.3 km away • 15 mins drive
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-700 font-medium pt-1">
                        <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>15+ Years Experience</span>
                      </div>
                    </div>
                  </div>

                  {/* Book Appointment Button */}
                  <div className="p-4 pt-0">
                    <button className="w-full py-2.5 rounded-xl bg-[#09090b] hover:bg-neutral-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs">
                      Book Appointment
                    </button>
                  </div>
                </div>

                {/* Doctor 2 */}
                <div className="bg-white rounded-2xl border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] overflow-hidden flex flex-col justify-between hover:translate-y-[-2px] transition-all">
                  <div className="p-4 space-y-3">
                    {/* Image Container with Badge */}
                    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                      <img 
                        src="https://images.unsplash.com/photo-1594824813571-2153349aed06?auto=format&fit=crop&q=80&w=400" 
                        alt="Dr. Neha Verma" 
                        className="w-full h-full object-cover object-top"
                      />
                      <span className="absolute top-2.5 right-2.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200/80 shadow-xs">
                        Available Tomorrow
                      </span>
                    </div>

                    {/* Doctor Info */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-black">Dr. Neha Verma</h3>
                      <p className="text-xs text-neutral-500 font-medium">Neurologist</p>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-700 font-semibold pt-1">
                        <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                        <span>4.8</span>
                        <span className="text-neutral-400 font-normal">(96 Reviews)</span>
                      </div>
                    </div>

                    {/* Location & Details */}
                    <div className="space-y-1.5 pt-2 border-t border-neutral-100 text-xs">
                      <div className="flex items-start gap-1.5 text-neutral-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <span>Fortis Memorial Research Institute, Gurugram</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 pl-5">
                        8.1 km away • 20 mins drive
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-700 font-medium pt-1">
                        <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>12+ Years Experience</span>
                      </div>
                    </div>
                  </div>

                  {/* Book Appointment Button */}
                  <div className="p-4 pt-0">
                    <button className="w-full py-2.5 rounded-xl bg-[#09090b] hover:bg-neutral-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs">
                      Book Appointment
                    </button>
                  </div>
                </div>

                {/* Doctor 3 */}
                <div className="bg-white rounded-2xl border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] overflow-hidden flex flex-col justify-between hover:translate-y-[-2px] transition-all">
                  <div className="p-4 space-y-3">
                    {/* Image Container with Badge */}
                    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                      <img 
                        src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400" 
                        alt="Dr. Amit Desai" 
                        className="w-full h-full object-cover object-top"
                      />
                      <span className="absolute top-2.5 right-2.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200/80 shadow-xs">
                        Available Today
                      </span>
                    </div>

                    {/* Doctor Info */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-black">Dr. Amit Desai</h3>
                      <p className="text-xs text-neutral-500 font-medium">Neurologist</p>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-700 font-semibold pt-1">
                        <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                        <span>4.7</span>
                        <span className="text-neutral-400 font-normal">(84 Reviews)</span>
                      </div>
                    </div>

                    {/* Location & Details */}
                    <div className="space-y-1.5 pt-2 border-t border-neutral-100 text-xs">
                      <div className="flex items-start gap-1.5 text-neutral-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <span>Manipal Hospital, Bengaluru</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 pl-5">
                        5.4 km away • 18 mins drive
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-700 font-medium pt-1">
                        <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>10+ Years Experience</span>
                      </div>
                    </div>
                  </div>

                  {/* Book Appointment Button */}
                  <div className="p-4 pt-0">
                    <button className="w-full py-2.5 rounded-xl bg-[#09090b] hover:bg-neutral-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs">
                      Book Appointment
                    </button>
                  </div>
                </div>

                {/* Doctor 4 */}
                <div className="bg-white rounded-2xl border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] overflow-hidden flex flex-col justify-between hover:translate-y-[-2px] transition-all">
                  <div className="p-4 space-y-3">
                    {/* Image Container with Badge */}
                    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                      <img 
                        src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400" 
                        alt="Dr. Priya Nair" 
                        className="w-full h-full object-cover object-top"
                      />
                      <span className="absolute top-2.5 right-2.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200/80 shadow-xs">
                        Available Fri, 18 Jul
                      </span>
                    </div>

                    {/* Doctor Info */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-black">Dr. Priya Nair</h3>
                      <p className="text-xs text-neutral-500 font-medium">Neuro Physician</p>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-700 font-semibold pt-1">
                        <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                        <span>4.6</span>
                        <span className="text-neutral-400 font-normal">(72 Reviews)</span>
                      </div>
                    </div>

                    {/* Location & Details */}
                    <div className="space-y-1.5 pt-2 border-t border-neutral-100 text-xs">
                      <div className="flex items-start gap-1.5 text-neutral-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <span>Max Super Speciality Hospital, Mumbai</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 pl-5">
                        12.5 km away • 25 mins drive
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-700 font-medium pt-1">
                        <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>8+ Years Experience</span>
                      </div>
                    </div>
                  </div>

                  {/* Book Appointment Button */}
                  <div className="p-4 pt-0">
                    <button className="w-full py-2.5 rounded-xl bg-[#09090b] hover:bg-neutral-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs">
                      Book Appointment
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Grid: Upcoming Appointments & Appointment Calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left Bento Box: Upcoming Appointments (Spans 5 cols on LG) */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <h3 className="text-base font-bold text-black">Upcoming Appointments</h3>
                    <button className="text-xs text-neutral-500 hover:text-black font-semibold cursor-pointer">
                      View All
                    </button>
                  </div>

                  <div className="space-y-3 pt-3">
                    
                    {/* Appointment 1 */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl border border-neutral-100 hover:border-neutral-300 transition-all cursor-pointer group bg-neutral-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-black tracking-wider uppercase">22</span>
                          <span className="text-[9px] font-bold uppercase">JUL</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-black">Dr. Rajesh Sharma</div>
                          <div className="text-[11px] text-neutral-500 font-medium">Neurologist</div>
                          <div className="text-[10px] text-neutral-400 font-normal mt-0.5">Today, 10:30 AM</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          Confirmed
                        </span>
                        <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
                      </div>
                    </div>

                    {/* Appointment 2 */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl border border-neutral-100 hover:border-neutral-300 transition-all cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-800 border border-neutral-200 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-black tracking-wider uppercase">28</span>
                          <span className="text-[9px] font-bold uppercase">JUL</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-black">Dr. Neha Verma</div>
                          <div className="text-[11px] text-neutral-500 font-medium">Neurologist</div>
                          <div className="text-[10px] text-neutral-400 font-normal mt-0.5">Mon, 11:00 AM</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-200">
                          Upcoming
                        </span>
                        <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
                      </div>
                    </div>

                    {/* Appointment 3 */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl border border-neutral-100 hover:border-neutral-300 transition-all cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-800 border border-neutral-200 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-black tracking-wider uppercase">05</span>
                          <span className="text-[9px] font-bold uppercase">AUG</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-black">Dr. Amit Desai</div>
                          <div className="text-[11px] text-neutral-500 font-medium">Neurologist</div>
                          <div className="text-[10px] text-neutral-400 font-normal mt-0.5">Tue, 02:00 PM</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-200">
                          Upcoming
                        </span>
                        <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
                      </div>
                    </div>

                    {/* Appointment 4 */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl border border-neutral-100 hover:border-neutral-300 transition-all cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-800 border border-neutral-200 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-black tracking-wider uppercase">18</span>
                          <span className="text-[9px] font-bold uppercase">AUG</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-black">Dr. Priya Nair</div>
                          <div className="text-[11px] text-neutral-500 font-medium">Neuro Physician</div>
                          <div className="text-[10px] text-neutral-400 font-normal mt-0.5">Fri, 09:30 AM</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-200">
                          Upcoming
                        </span>
                        <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
                      </div>
                    </div>

                  </div>
                </div>

                <button className="w-full py-2.5 rounded-xl text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center justify-center gap-1 cursor-pointer">
                  <span>+ View All Appointments</span>
                </button>
              </div>

              {/* Right Bento Box: Appointment Calendar + Day Schedule (Spans 7 cols on LG) */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Calendar Widget Column (Spans 7 cols in nested grid) */}
                <div className="md:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-black">Appointment Calendar</h3>
                  </div>

                  <div className="space-y-3 pt-1">
                    {/* Month Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black">July 2025</span>
                      <div className="flex items-center gap-1">
                        <button className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-600 cursor-pointer">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-600 cursor-pointer">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Days of Week */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-neutral-400">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>

                    {/* Calendar Days Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
                      <span className="py-1 text-neutral-300">30</span>
                      <span className="py-1 text-neutral-700">1</span>
                      <span className="py-1 text-neutral-700">2</span>
                      <span className="py-1 text-neutral-700">3</span>
                      <span className="py-1 text-neutral-700">4</span>
                      <span className="py-1 text-neutral-700 relative">
                        5
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                      </span>
                      <span className="py-1 text-neutral-700 relative">
                        6
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                      </span>

                      <span className="py-1 text-neutral-700">7</span>
                      <span className="py-1 text-neutral-700">8</span>
                      <span className="py-1 text-neutral-700">9</span>
                      <span className="py-1 text-neutral-700">10</span>
                      <span className="py-1 text-neutral-700 relative">
                        11
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                      </span>
                      <span className="py-1 text-neutral-700">12</span>
                      <span className="py-1 text-neutral-700">13</span>

                      <span className="py-1 text-neutral-700">14</span>
                      <span className="py-1 text-neutral-700 relative">
                        15
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                      </span>
                      <span className="py-1 text-neutral-700">16</span>
                      <span className="py-1 text-neutral-700">17</span>
                      <span className="py-1 text-neutral-700 relative">
                        18
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                      </span>
                      <span className="py-1 text-neutral-700">19</span>
                      <span className="py-1 text-neutral-700">20</span>

                      <span className="py-1 text-neutral-700">21</span>
                      {/* Highlighted 22 */}
                      <div className="flex items-center justify-center">
                        <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shadow-xs">
                          22
                        </span>
                      </div>
                      <span className="py-1 text-neutral-700">23</span>
                      <span className="py-1 text-neutral-700">24</span>
                      <span className="py-1 text-neutral-700">25</span>
                      <span className="py-1 text-neutral-700">26</span>
                      <span className="py-1 text-neutral-700">27</span>

                      <span className="py-1 text-neutral-700 relative">
                        28
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                      </span>
                      <span className="py-1 text-neutral-700">29</span>
                      <span className="py-1 text-neutral-700">30</span>
                      <span className="py-1 text-neutral-700">31</span>
                      <span className="py-1 text-neutral-300">1</span>
                      <span className="py-1 text-neutral-300">2</span>
                      <span className="py-1 text-neutral-300">3</span>
                    </div>
                  </div>
                </div>

                {/* Selected Day Schedule Column (Spans 5 cols in nested grid) */}
                <div className="md:col-span-5 space-y-4 flex flex-col justify-between h-full border-t md:border-t-0 md:border-l border-neutral-100 pt-4 md:pt-0 md:pl-5">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-black border-b border-neutral-100 pb-2">22 July 2025</h4>

                    <div className="space-y-2 text-xs">
                      
                      {/* Timeslot 1 */}
                      <div className="p-2.5 rounded-xl border border-neutral-100 bg-neutral-50/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-600 text-[11px]">10:30 AM</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200">
                            Confirmed
                          </span>
                        </div>
                        <div className="font-bold text-black text-xs">Dr. Rajesh Sharma</div>
                        <div className="text-[10px] text-neutral-500">Neurologist</div>
                      </div>

                      {/* Timeslot 2 */}
                      <div className="p-2.5 rounded-xl border border-neutral-100 bg-white space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-neutral-700 text-[11px]">11:00 AM</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-bold border border-blue-200">
                            Upcoming
                          </span>
                        </div>
                        <div className="font-bold text-black text-xs">Dr. Neha Verma</div>
                        <div className="text-[10px] text-neutral-500">Neurologist</div>
                      </div>

                      {/* Timeslot 3 */}
                      <div className="p-2.5 rounded-xl border border-neutral-100 bg-white space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-neutral-700 text-[11px]">02:00 PM</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-bold border border-blue-200">
                            Upcoming
                          </span>
                        </div>
                        <div className="font-bold text-black text-xs">Dr. Amit Desai</div>
                        <div className="text-[10px] text-neutral-500">Neurologist</div>
                      </div>

                    </div>
                  </div>

                  <button className="w-full py-2 rounded-xl border border-neutral-200 hover:border-black text-xs font-bold text-black transition-colors bg-white flex items-center justify-center gap-2 cursor-pointer mt-3">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>View Full Schedule</span>
                  </button>
                </div>

              </div>

            </div>

            {/* Bottom Health Banner Card */}
            <div className="bg-emerald-50/60 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-black">Your health, our priority</h4>
                  <p className="text-xs text-neutral-600 font-normal">Book regular appointments and stay ahead of your brain health.</p>
                </div>
              </div>

              <button className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-sm">
                <span>Book Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        ) : activeTab === 'Settings' ? (
          /* ==================== SETTINGS PAGE (EXACT REFERENCE DESIGN) ==================== */
          <div className="space-y-6">
            
            {/* Top Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
                  Settings
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 font-normal mt-0.5">
                  Manage your account, preferences, and security
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <button className="w-10 h-10 rounded-full border border-neutral-200 bg-white shadow-sm flex items-center justify-center text-neutral-700 hover:text-black hover:border-neutral-300 transition-all cursor-pointer relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                    3
                  </span>
                </button>
              </div>
            </div>

            {/* FULL-WIDTH CONTENT COLUMN */}
            <div className="space-y-6 w-full">
                
                {/* BENTO CARD 1: PROFILE INFORMATION */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] space-y-5">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                    <h2 className="text-base font-bold text-black">Profile Information</h2>
                    <button 
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-neutral-200 hover:border-black bg-white text-xs font-semibold text-black transition-all cursor-pointer shadow-xs"
                    >
                      <Pencil className="w-3.5 h-3.5 text-neutral-600" />
                      <span>{isEditingProfile ? 'Save Profile' : 'Edit Profile'}</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-1">
                    {/* Avatar Section */}
                    <div className="relative shrink-0">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-neutral-100 border-2 border-neutral-300 flex items-center justify-center overflow-hidden shadow-inner relative">
                        {/* Custom Avatar SVG illustration */}
                        <svg className="w-full h-full text-neutral-800" viewBox="0 0 100 100" fill="none">
                          <circle cx="50" cy="50" r="48" fill="#e5e5e5" />
                          <circle cx="50" cy="35" r="18" fill="#262626" />
                          <path d="M 50 17 Q 35 17 32 30 Q 50 25 68 30 Q 65 17 50 17 Z" fill="#0a0a0a" />
                          <ellipse cx="50" cy="42" rx="14" ry="14" fill="#f5d0c5" />
                          <path d="M 22 88 C 22 65 35 58 50 58 C 65 58 78 65 78 88 Z" fill="#262626" />
                          <path d="M 42 58 L 50 72 L 58 58 Z" fill="#ffffff" />
                        </svg>
                      </div>
                      <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-neutral-300 shadow flex items-center justify-center text-neutral-700 hover:text-black cursor-pointer transition-colors">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Form Fields Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full text-xs">
                      
                      {/* Full Name */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-black">Full Name</label>
                        <input
                          type="text"
                          disabled={!isEditingProfile}
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/60 font-medium text-black focus:outline-none focus:border-black disabled:opacity-90 disabled:cursor-not-allowed transition-colors"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-black">Email</label>
                        <div className="relative flex items-center">
                          <input
                            type="email"
                            disabled={!isEditingProfile}
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/60 font-medium text-black focus:outline-none focus:border-black disabled:opacity-90 disabled:cursor-not-allowed transition-colors"
                          />
                          <span className="absolute right-2 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/60 flex items-center gap-1 shrink-0">
                            Verified <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          </span>
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-black">Phone Number</label>
                        <input
                          type="text"
                          disabled={!isEditingProfile}
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/60 font-medium text-black focus:outline-none focus:border-black disabled:opacity-90 disabled:cursor-not-allowed transition-colors"
                        />
                      </div>

                      {/* Date of Birth */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-black">Date of Birth</label>
                        <div className="relative flex items-center">
                          <div className="absolute left-3.5 text-neutral-400">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            disabled={!isEditingProfile}
                            value={profileData.dob}
                            onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/60 font-medium text-black focus:outline-none focus:border-black disabled:opacity-90 disabled:cursor-not-allowed transition-colors"
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* BENTO ROW 2: ACCOUNT & SECURITY + PREFERENCES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Account & Security Card */}
                  <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex flex-col justify-between space-y-4">
                    <h2 className="text-base font-bold text-black border-b border-neutral-100 pb-3">Account & Security</h2>

                    <div className="space-y-4 text-xs">
                      
                      {/* Password */}
                      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                        <div>
                          <div className="font-semibold text-black">Password</div>
                          <div className="text-neutral-400 font-mono text-[11px] mt-0.5">••••••••••••</div>
                        </div>
                        <button className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:border-black bg-white font-semibold text-black transition-colors cursor-pointer shrink-0">
                          Change Password
                        </button>
                      </div>

                      {/* Two-Factor Authentication */}
                      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                        <div>
                          <div className="font-semibold text-black">Two-Factor Authentication</div>
                          <div className="text-neutral-500 font-normal text-[11px] mt-0.5">Add an extra layer of security to your account</div>
                        </div>
                        <button 
                          onClick={() => setTwoFactor(!twoFactor)}
                          className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer shrink-0 ${
                            twoFactor ? 'bg-emerald-500' : 'bg-neutral-200'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                            twoFactor ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {/* Active Sessions */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div>
                          <div className="font-semibold text-black">Active Sessions</div>
                          <div className="text-neutral-500 font-normal text-[11px] mt-0.5">Manage your active sessions across devices</div>
                        </div>
                        <button className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:border-black bg-white font-semibold text-black transition-colors cursor-pointer shrink-0">
                          Manage Sessions
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Preferences Card */}
                  <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] space-y-4">
                    <h2 className="text-base font-bold text-black border-b border-neutral-100 pb-3">Preferences</h2>

                    <div className="space-y-3.5 text-xs">
                      
                      {/* Language */}
                      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                        <div>
                          <div className="font-semibold text-black">Language</div>
                          <div className="text-neutral-500 font-normal text-[11px] mt-0.5">Choose your preferred language</div>
                        </div>
                        <select 
                          value={preferences.language}
                          onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                          className="px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 font-semibold text-black focus:outline-none focus:border-black cursor-pointer text-xs"
                        >
                          <option value="English">English</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Spanish">Spanish</option>
                        </select>
                      </div>

                      {/* Theme */}
                      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                        <div>
                          <div className="font-semibold text-black">Theme</div>
                          <div className="text-neutral-500 font-normal text-[11px] mt-0.5">Choose your preferred theme</div>
                        </div>
                        <div className="flex items-center p-1 rounded-full border border-neutral-200 bg-neutral-50 gap-1">
                          <button 
                            onClick={() => setPreferences({ ...preferences, theme: 'light' })}
                            className={`p-1.5 rounded-full transition-all cursor-pointer ${
                              preferences.theme === 'light' ? 'bg-[#09090b] text-white' : 'text-neutral-600 hover:text-black'
                            }`}
                          >
                            <Sun className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setPreferences({ ...preferences, theme: 'dark' })}
                            className={`p-1.5 rounded-full transition-all cursor-pointer ${
                              preferences.theme === 'dark' ? 'bg-[#09090b] text-white' : 'text-neutral-600 hover:text-black'
                            }`}
                          >
                            <Moon className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setPreferences({ ...preferences, theme: 'system' })}
                            className={`p-1.5 rounded-full transition-all cursor-pointer ${
                              preferences.theme === 'system' ? 'bg-[#09090b] text-white' : 'text-neutral-600 hover:text-black'
                            }`}
                          >
                            <Monitor className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Date Format */}
                      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                        <div>
                          <div className="font-semibold text-black">Date Format</div>
                          <div className="text-neutral-500 font-normal text-[11px] mt-0.5">Choose how dates are displayed</div>
                        </div>
                        <select 
                          value={preferences.dateFormat}
                          onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                          className="px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 font-semibold text-black focus:outline-none focus:border-black cursor-pointer text-xs"
                        >
                          <option value="DD MMM YYYY">DD MMM YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>

                      {/* Time Format */}
                      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                        <div>
                          <div className="font-semibold text-black">Time Format</div>
                          <div className="text-neutral-500 font-normal text-[11px] mt-0.5">Choose how time is displayed</div>
                        </div>
                        <select 
                          value={preferences.timeFormat}
                          onChange={(e) => setPreferences({ ...preferences, timeFormat: e.target.value })}
                          className="px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 font-semibold text-black focus:outline-none focus:border-black cursor-pointer text-xs"
                        >
                          <option value="12-Hour (AM/PM)">12-Hour (AM/PM)</option>
                          <option value="24-Hour">24-Hour</option>
                        </select>
                      </div>

                      {/* Measurement Units */}
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-black">Measurement Units</div>
                          <div className="text-neutral-500 font-normal text-[11px] mt-0.5">Choose your preferred units</div>
                        </div>
                        <select 
                          value={preferences.units}
                          onChange={(e) => setPreferences({ ...preferences, units: e.target.value })}
                          className="px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 font-semibold text-black focus:outline-none focus:border-black cursor-pointer text-xs"
                        >
                          <option value="Metric (kg, cm)">Metric (kg, cm)</option>
                          <option value="Imperial (lbs, in)">Imperial (lbs, in)</option>
                        </select>
                      </div>

                    </div>
                  </div>

                </div>

                {/* BENTO ROW 3: NOTIFICATIONS + DANGER ZONE */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Notifications Card (Spans 8 cols on LG) */}
                  <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] space-y-4">
                    <h2 className="text-base font-bold text-black border-b border-neutral-100 pb-3">Notifications</h2>

                    <div className="space-y-3.5 text-xs">
                      
                      {/* Email Notifications */}
                      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                        <div>
                          <div className="font-semibold text-black">Email Notifications</div>
                          <div className="text-neutral-500 font-normal text-[11px] mt-0.5">Receive updates and reports via email</div>
                        </div>
                        <button 
                          onClick={() => setNotifications({ ...notifications, email: !notifications.email })}
                          className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer shrink-0 ${
                            notifications.email ? 'bg-emerald-500' : 'bg-neutral-200'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                            notifications.email ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {/* Scan Reminders */}
                      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                        <div>
                          <div className="font-semibold text-black">Scan Reminders</div>
                          <div className="text-neutral-500 font-normal text-[11px] mt-0.5">Get reminded for upcoming scans</div>
                        </div>
                        <button 
                          onClick={() => setNotifications({ ...notifications, scanReminders: !notifications.scanReminders })}
                          className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer shrink-0 ${
                            notifications.scanReminders ? 'bg-emerald-500' : 'bg-neutral-200'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                            notifications.scanReminders ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {/* Appointment Alerts */}
                      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                        <div>
                          <div className="font-semibold text-black">Appointment Alerts</div>
                          <div className="text-neutral-500 font-normal text-[11px] mt-0.5">Receive alerts for appointments</div>
                        </div>
                        <button 
                          onClick={() => setNotifications({ ...notifications, appointments: !notifications.appointments })}
                          className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer shrink-0 ${
                            notifications.appointments ? 'bg-emerald-500' : 'bg-neutral-200'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                            notifications.appointments ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {/* Promotions & Updates */}
                      <div className="flex items-center justify-between gap-2 pb-1">
                        <div>
                          <div className="font-semibold text-black">Promotions & Updates</div>
                          <div className="text-neutral-500 font-normal text-[11px] mt-0.5">Receive tips and health insights</div>
                        </div>
                        <button 
                          onClick={() => setNotifications({ ...notifications, promotions: !notifications.promotions })}
                          className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer shrink-0 ${
                            notifications.promotions ? 'bg-emerald-500' : 'bg-neutral-200'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                            notifications.promotions ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <button className="w-full py-2.5 rounded-xl border border-neutral-200 hover:border-black text-xs font-semibold text-black transition-colors bg-white">
                        Manage All Notifications
                      </button>

                    </div>
                  </div>

                  {/* Danger Zone Card (Spans 4 cols on LG) */}
                  <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border-2 border-red-500/60 shadow-[5px_5px_0px_0px_rgba(239,68,68,0.2)] flex flex-col justify-between space-y-4">
                    <div>
                      <h2 className="text-base font-bold text-red-600 border-b border-red-100 pb-3">Danger Zone</h2>

                      <div className="space-y-2 text-xs pt-3">
                        <div className="font-semibold text-black">Delete Account</div>
                        <div className="text-neutral-500 font-normal text-[11px] leading-relaxed">
                          Permanently delete your account and all associated scan data. This action cannot be undone.
                        </div>
                      </div>
                    </div>

                    <button className="w-full py-2.5 rounded-xl border border-red-300 hover:bg-red-50 text-red-600 font-bold text-xs transition-colors bg-white cursor-pointer">
                      Delete Account
                    </button>
                  </div>

                </div>

              </div>

          </div>
        ) : activeTab === 'My Scans' ? (
          /* ==================== MY SCANS PAGE (EXACT REFERENCE DESIGN) ==================== */
          <div className="space-y-6">
            
            {/* Top Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
                  My Scans
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 font-normal mt-0.5">
                  View and manage all your MRI scans
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <button className="w-10 h-10 rounded-full border border-neutral-200 bg-white shadow-sm flex items-center justify-center text-neutral-700 hover:text-black hover:border-neutral-300 transition-all cursor-pointer relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                    3
                  </span>
                </button>

                {/* Upload New Scan Button */}
                <button 
                  onClick={() => {
                    setUploadState('idle');
                    setUploadProgress(0);
                    setIsUploadModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#09090b] hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold tracking-wide shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload New Scan</span>
                </button>
              </div>
            </div>

            {/* TOP ROW: 4 BENTO STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Total Scans */}
              <div className="bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-black leading-none">7</div>
                  <div className="text-sm font-semibold text-black mt-1">Total Scans</div>
                  <div className="text-xs text-neutral-400 font-normal">All time</div>
                </div>
              </div>

              {/* Card 2: Completed */}
              <div className="bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-black leading-none">6</div>
                  <div className="text-sm font-semibold text-black mt-1">Completed</div>
                  <div className="text-xs text-neutral-400 font-normal">Successfully analyzed</div>
                </div>
              </div>

              {/* Card 3: Processing */}
              <div className="bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-black leading-none">1</div>
                  <div className="text-sm font-semibold text-black mt-1">Processing</div>
                  <div className="text-xs text-neutral-400 font-normal">Under analysis</div>
                </div>
              </div>

              {/* Card 4: Issues Found */}
              <div className="bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-black leading-none">0</div>
                  <div className="text-sm font-semibold text-black mt-1">Issues Found</div>
                  <div className="text-xs text-neutral-400 font-normal">Requires attention</div>
                </div>
              </div>

            </div>

            {/* SEARCH AND FILTER BAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)]">
              
              {/* Search Input */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search scans..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm font-normal text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700 hover:border-neutral-300 transition-colors whitespace-nowrap">
                  <span>All Status</span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                </button>

                <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700 hover:border-neutral-300 transition-colors whitespace-nowrap">
                  <span>All Time</span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                </button>

                <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700 hover:border-neutral-300 transition-colors whitespace-nowrap">
                  <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Newest First</span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                </button>
              </div>

            </div>

            {/* MAIN 2-COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: SCANS LIST (Spans 7 cols on LG) */}
              <div className="lg:col-span-7 space-y-3.5">
                {scansList.map((scan) => {
                  const isSelected = scan.id === selectedScanId;
                  return (
                    <div
                      key={scan.id}
                      onClick={() => setSelectedScanId(scan.id)}
                      className={`p-4 bg-white rounded-2xl border-2 border-[#09090b] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isSelected 
                          ? 'shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] bg-neutral-50/30' 
                          : 'shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] hover:shadow-[6px_6px_0px_0px_rgba(9,9,11,1)]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* MRI Scan Thumbnail */}
                        <div className="w-16 h-16 rounded-xl bg-black overflow-hidden shrink-0 border border-neutral-800">
                          {renderMriThumbnail(scan.viewType)}
                        </div>

                        {/* Scan Title & Info */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-black">{scan.date}</span>
                            <span className="text-xs text-neutral-400 font-medium">• {scan.time}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              scan.status === 'Completed' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            }`}>
                              {scan.status}
                            </span>
                          </div>

                          <div className="text-xs font-medium text-neutral-600">{scan.type}</div>
                          <div className="text-[11px] text-neutral-400">{scan.uploader}</div>
                        </div>
                      </div>

                      {/* Right Details & Action Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100">
                        {scan.status === 'Completed' ? (
                          <div className="text-left sm:text-right">
                            <div className="text-xs font-bold text-black">{scan.prediction}</div>
                            <div className="text-[11px] font-medium text-neutral-500">
                              Confidence: <span className="font-bold text-emerald-600">{scan.confidence}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-left sm:text-right space-y-1">
                            <div className="text-xs font-bold text-neutral-700">Analysis in progress</div>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                                <div className="h-full bg-black rounded-full" style={{ width: `${scan.progress}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-black">{scan.progress}%</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 shrink-0">
                          <button className="px-3.5 py-1.5 rounded-xl border border-neutral-200 hover:border-black text-xs font-semibold text-black transition-colors bg-white">
                            {scan.status === 'Completed' ? 'View Report' : 'View Status'}
                          </button>
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* RIGHT COLUMN: SELECTED SCAN DETAIL BENTO CARD (Spans 5 cols on LG) */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 border-2 border-[#09090b] shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] space-y-6 sticky top-6">
                
                {/* Date Header & Status */}
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                  <div className="text-sm font-bold text-black">
                    {selectedScan.date} • {selectedScan.time}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    selectedScan.status === 'Completed' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                  }`}>
                    {selectedScan.status}
                  </span>
                </div>

                {/* Big MRI Scan Image Preview Box */}
                <div className="w-full h-56 bg-[#050507] rounded-2xl overflow-hidden border border-neutral-800 p-2 flex items-center justify-center shadow-inner relative">
                  {selectedScan.gradcam_url ? (
                    <img src={selectedScan.gradcam_url} alt="MRI Grad-CAM Analysis" className="max-h-full max-w-full object-contain rounded-lg" />
                  ) : (
                    renderMriThumbnail(selectedScan.viewType, true)
                  )}
                </div>

                {/* Key Details Metadata List */}
                <div className="space-y-3 text-xs">
                  
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 font-medium">Scan Type</span>
                    <span className="font-bold text-black">{selectedScan.type}</span>
                  </div>

                  {selectedScan.prediction && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 font-medium">Prediction</span>
                      <span className="font-extrabold text-emerald-600">{selectedScan.prediction}</span>
                    </div>
                  )}

                  {selectedScan.confidence && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 font-medium">Confidence</span>
                      <span className="font-extrabold text-emerald-600">{selectedScan.confidence}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 font-medium">MRI Verified</span>
                    <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span>Yes</span>
                    </div>
                  </div>

                  {selectedScan.analyzedOn && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 font-medium">Analyzed On</span>
                      <span className="font-medium text-neutral-800">{selectedScan.analyzedOn}</span>
                    </div>
                  )}

                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button className="w-full py-2.5 rounded-xl bg-[#09090b] hover:bg-neutral-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm">
                    <FileText className="w-4 h-4" />
                    <span>View Full Report</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button className="py-2 px-3 rounded-xl border border-neutral-200 hover:border-black text-xs font-semibold text-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white">
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Report</span>
                    </button>
                    <button className="py-2 px-3 rounded-xl border border-neutral-200 hover:border-black text-xs font-semibold text-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white">
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Report</span>
                    </button>
                  </div>
                </div>

                {/* AI Insights Summary Card */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-1 text-xs font-bold text-black cursor-pointer hover:underline">
                    <span>AI Insights (Summary)</span>
                    <ArrowRight className="w-3.5 h-3.5 text-black" />
                  </div>

                  <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-2xl p-4 text-xs space-y-1">
                    <div className="font-bold text-emerald-900">
                      No significant abnormalities detected.
                    </div>
                    <div className="text-emerald-800 font-normal leading-relaxed">
                      The MRI scan appears within normal limits. Continue regular monitoring for better brain health.
                    </div>
                  </div>
                </div>

                {/* Recommended Next Scan */}
                <div className="space-y-2 pt-1 border-t border-neutral-100">
                  <div className="text-xs font-bold text-black">Recommended Next Scan</div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                    <Calendar className="w-4 h-4 text-black" />
                    <span>15 Jan 2027</span>
                    <span className="text-neutral-400 font-normal">(In 6 months)</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        ) : activeTab === 'Messages' ? (
          <MessagesView 
            cleanUserName={cleanUserName}
            onOpenBookAppointment={(doctorName) => {
              setIsAppointmentConfirmed(false);
              setIsBookAppointmentOpen(true);
            }}
            onViewCognitiveReport={() => {
              setActiveTab('Cognitive Test');
              setCognitiveSubView('results');
            }}
          />
        ) : activeTab === 'Cognitive Test' ? (
          /* ==================== COGNITIVE ASSESSMENT PAGE FLOW ==================== */
          cognitiveSubView === 'carespace' ? (
            <CareSpaceView
              patientName={cleanUserName}
              onNavigateTab={() => setCognitiveSubView('dashboard')}
            />
          ) : cognitiveSubView === 'intro' ? (
            <AssessmentIntroduction
              hasResumeSession={!!activeCognitiveSession && activeCognitiveSession.status === 'in_progress'}
              onResumeSession={() => {
                if (activeCognitiveSession) {
                  setCognitiveSubView('workspace');
                }
              }}
              onDiscardSession={() => {
                clearActiveSession();
                setActiveCognitiveSession(null);
                setCognitiveSubView('intro');
              }}
              onStartPractice={() => setCognitiveSubView('practice')}
              onBackToDashboard={() => setCognitiveSubView('dashboard')}
            />
          ) : cognitiveSubView === 'practice' ? (
            <PracticeRound
              onStartAssessment={() => {
                const newSession = createNewAssessmentSession('patient-001', userName);
                setActiveCognitiveSession(newSession);
                setCognitiveSubView('workspace');
              }}
              onBackToIntro={() => setCognitiveSubView('intro')}
            />
          ) : cognitiveSubView === 'workspace' && activeCognitiveSession ? (
            <AssessmentWorkspace
              session={activeCognitiveSession}
              onComplete={(completedSession) => {
                setActiveCognitiveSession(completedSession);
                setSelectedReportSession(completedSession);
                const updated = getAssessmentHistory(userName);
                setCognitiveHistory(updated);
                setPrevSubView('results');
                setCognitiveSubView('results');
              }}
              onPauseAndExit={() => setCognitiveSubView('dashboard')}
            />
          ) : cognitiveSubView === 'results' && activeCognitiveSession ? (
            <AssessmentResults
              session={activeCognitiveSession}
              onViewReport={() => {
                setSelectedReportSession(activeCognitiveSession);
                setPrevSubView('results');
                setCognitiveSubView('report');
              }}
              onViewHistory={() => setCognitiveSubView('history')}
              onReturnToDashboard={() => setCognitiveSubView('dashboard')}
            />
          ) : cognitiveSubView === 'report' && (selectedReportSession || activeCognitiveSession) ? (
            <CognitiveReport
              session={(selectedReportSession || activeCognitiveSession)!}
              onBack={() => {
                if (prevSubView === 'history') setCognitiveSubView('history');
                else if (prevSubView === 'results') setCognitiveSubView('results');
                else setCognitiveSubView('dashboard');
              }}
            />
          ) : cognitiveSubView === 'history' ? (
            <AssessmentHistoryView
              history={cognitiveHistory}
              onSelectSession={(sess) => {
                setSelectedReportSession(sess);
                setPrevSubView('history');
                setCognitiveSubView('report');
              }}
              onStartNewAssessment={() => {
                setActiveCognitiveSession(null);
                setCognitiveSubView('intro');
              }}
              onBackToDashboard={() => setCognitiveSubView('dashboard')}
            />
          ) : (
          <div className="space-y-6">
            
            {/* Top Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
                  Cognitive Assessment
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 font-normal mt-0.5">
                  Daily brain exercises to track and improve your cognitive health
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCognitiveSubView('carespace')}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#09090b] bg-emerald-400 px-4 py-2.5 text-xs font-bold text-black shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] transition-transform hover:-translate-y-0.5"
              >
                <Compass className="h-4 w-4" />
                CareSpace
              </button>
            </div>

            {/* TOP 2 BENTO CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              
              {/* CARD 1: TODAY'S BRAIN CHECK (Spans 8 cols on LG) */}
              <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                
                {/* 3D Brain Illustration Container */}
                <div className="w-44 h-44 sm:w-52 sm:h-52 shrink-0 relative flex items-center justify-center bg-neutral-50 rounded-2xl border border-neutral-200 p-4">
                  {/* Styled 3D Brain Visual */}
                  <div className="relative flex items-center justify-center w-full h-full">
                    {/* Floating spheres backdrop */}
                    <span className="absolute top-2 left-3 w-3 h-3 rounded-full bg-emerald-200/80 animate-pulse" />
                    <span className="absolute top-6 right-4 w-2 h-2 rounded-full bg-emerald-400/80" />
                    <span className="absolute bottom-6 left-5 w-2.5 h-2.5 rounded-full bg-neutral-300/70" />
                    <span className="absolute bottom-3 right-6 w-3.5 h-3.5 rounded-full bg-emerald-300/60" />
                    
                    {/* Pedestal */}
                    <div className="absolute bottom-2 w-32 h-8 rounded-full bg-neutral-200/80 border border-neutral-300/60 shadow-inner transform rotate-12" />

                    {/* Glowing Brain Center */}
                    <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 border-2 border-emerald-200">
                      <Brain className="w-14 h-14 text-white drop-shadow-md stroke-[1.5]" />
                    </div>
                  </div>
                </div>

                {/* Right Text & Controls Content */}
                <div className="flex-1 space-y-4 text-left">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-bold text-black tracking-tight">Today's Brain Check</h2>
                    <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold tracking-wide">
                      Daily Challenge
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                    Complete today's assessment to track your cognitive performance and maintain your brain health.
                  </p>

                  {/* 3 Inline Info Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="bg-neutral-50/80 border border-neutral-200 rounded-xl p-2.5 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-400 font-normal">Estimated Time</div>
                        <div className="text-xs font-bold text-black">~10-15 min</div>
                      </div>
                    </div>

                    <div className="bg-neutral-50/80 border border-neutral-200 rounded-xl p-2.5 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-400 font-normal">Different Domains</div>
                        <div className="text-xs font-bold text-black">5 Sections</div>
                      </div>
                    </div>

                    <div className="bg-neutral-50/80 border border-neutral-200 rounded-xl p-2.5 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-400 font-normal">Daily Streak</div>
                        <div className="text-xs font-bold text-black">3 Days</div>
                      </div>
                    </div>
                  </div>

                  {/* Start Button & Security Footnote */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                    <button 
                      onClick={() => {
                        const active = getActiveSession();
                        if (active && active.status === 'in_progress') {
                          setActiveCognitiveSession(active);
                        }
                        setCognitiveSubView('intro');
                      }}
                      className="px-6 py-2.5 rounded-full bg-[#09090b] hover:bg-neutral-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <span>Start Assessment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Your data is private and secure</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* CARD 2: KEEP THE STREAK GOING! (Spans 4 cols on LG) */}
              <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex flex-col justify-between items-center text-center space-y-4">
                
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                    <Flame className="w-5 h-5 fill-emerald-600" />
                  </div>

                  <h3 className="text-base font-bold text-black">Keep the streak going!</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
                    Complete daily assessments to build long-term brain resilience.
                  </p>
                </div>

                {/* Days Circle Tracker */}
                <div className="w-full pt-2">
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 items-center justify-items-center">
                    
                    {/* Mon */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-500">Mon</span>
                    </div>

                    {/* Tue */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-500">Tue</span>
                    </div>

                    {/* Wed */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-500">Wed</span>
                    </div>

                    {/* Thu (Current 4) */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-black text-black text-xs font-bold flex items-center justify-center shadow-xs">
                        4
                      </div>
                      <span className="text-[10px] font-bold text-black">Thu</span>
                    </div>

                    {/* Fri */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-400 text-xs font-semibold flex items-center justify-center">
                        5
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-400">Fri</span>
                    </div>

                    {/* Sat */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-400 text-xs font-semibold flex items-center justify-center">
                        6
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-400">Sat</span>
                    </div>

                    {/* Sun */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-400 text-xs font-semibold flex items-center justify-center">
                        7
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-400">Sun</span>
                    </div>

                  </div>
                </div>

              </div>

            </div>

            {/* MIDDLE CARD: YOUR COGNITIVE SUMMARY */}
            <div className="bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] space-y-4">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-black">Your Cognitive Summary</h3>
                <Info className="w-3.5 h-3.5 text-neutral-400 cursor-pointer" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                
                {/* 1. Overall Score */}
                <div className="bg-neutral-50/70 border border-neutral-100 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-neutral-400 font-normal">Overall Score</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-black">
                        {cognitiveHistory[0]?.score?.overallScore || 78}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-bold">/ 100</span>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-600">
                      {(cognitiveHistory[0]?.score?.overallScore || 78) >= 75 ? 'Good' : 'Consistent'}
                    </div>
                  </div>
                </div>

                {/* 2. Tests Completed */}
                <div className="bg-neutral-50/70 border border-neutral-100 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-neutral-400 font-normal">Tests Completed</div>
                    <div className="text-lg font-extrabold text-black">{cognitiveHistory.length || 12}</div>
                    <div className="text-[10px] font-medium text-neutral-400">Total Tests</div>
                  </div>
                </div>

                {/* 3. Average Score */}
                <div className="bg-neutral-50/70 border border-neutral-100 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-neutral-400 font-normal">Average Score</div>
                    <div className="text-lg font-extrabold text-black">
                      {cognitiveHistory.length > 0 
                        ? Math.round(cognitiveHistory.reduce((acc, s) => acc + (s.score?.overallScore || 0), 0) / cognitiveHistory.length)
                        : 76}
                    </div>
                    <div className="text-[10px] font-medium text-neutral-400">All Tests</div>
                  </div>
                </div>

                {/* 4. Best Score */}
                <div className="bg-neutral-50/70 border border-neutral-100 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-neutral-400 font-normal">Best Score</div>
                    <div className="text-lg font-extrabold text-black">
                      {cognitiveHistory.length > 0
                        ? Math.max(...cognitiveHistory.map(s => s.score?.overallScore || 0))
                        : 89}
                    </div>
                    <div className="text-[10px] font-medium text-neutral-400">Personal Best</div>
                  </div>
                </div>

                {/* 5. Current Streak */}
                <div className="bg-neutral-50/70 border border-neutral-100 rounded-xl p-3 flex items-center gap-3 col-span-2 sm:col-span-1">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5 fill-rose-600" />
                  </div>
                  <div>
                    <div className="text-[11px] text-neutral-400 font-normal">Current Streak</div>
                    <div className="text-lg font-extrabold text-black">3</div>
                    <div className="text-[10px] font-medium text-neutral-400">Days</div>
                  </div>
                </div>

              </div>
            </div>

            {/* BOTTOM 3-COLUMN BENTO GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              
              {/* COLUMN 1: RECENT ASSESSMENTS (Spans 4 cols on LG) */}
              <div className="lg:col-span-4 bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex flex-col justify-between space-y-4">
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <h3 className="text-sm font-bold text-black">Recent Assessments</h3>
                    <button 
                      type="button"
                      onClick={() => setCognitiveSubView('history')}
                      className="text-xs font-semibold text-neutral-500 hover:text-black transition-colors cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  {/* Assessment Items List */}
                  <div className="space-y-2.5">
                    {cognitiveHistory.slice(0, 4).map((item) => {
                      const rawDate = item.completedAt || item.startedAt;
                      const dateObj = new Date(rawDate);
                      const day = dateObj.toLocaleDateString('en-GB', { day: 'numeric' });
                      const month = dateObj.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
                      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const sVal = item.score?.overallScore || 75;

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedReportSession(item);
                            setPrevSubView('dashboard');
                            setCognitiveSubView('report');
                          }}
                          className="p-2.5 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 hover:border-black transition-all flex items-center gap-3 cursor-pointer group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex flex-col items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
                            <span className="text-xs font-extrabold leading-none">{day}</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider">{month}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-black truncate">Daily Assessment</div>
                            <div className="text-[10px] font-medium text-neutral-400">Completed • {timeStr}</div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-black">{sVal} <span className="text-[10px] text-neutral-400 font-normal">/ 100</span></div>
                            <div className={`text-[10px] font-bold ${sVal >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {sVal >= 75 ? 'Good' : 'Average'}
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* View Full History Button */}
                <button 
                  type="button"
                  onClick={() => setCognitiveSubView('history')}
                  className="w-full py-2.5 rounded-xl border border-neutral-200 hover:border-black text-xs font-semibold text-black transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>View Full History</span>
                </button>

              </div>

              {/* COLUMN 2: PERFORMANCE BREAKDOWN (Spans 4 cols on LG) */}
              <div className="lg:col-span-4 bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex flex-col justify-between space-y-4">
                
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-3">
                    <h3 className="text-sm font-bold text-black">Performance Breakdown</h3>
                    <Info className="w-3.5 h-3.5 text-neutral-400 cursor-pointer" />
                  </div>

                  {/* Domain Scores List & Radar Chart Container */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    
                    {/* Left Domain List (5 cols) */}
                    <div className="sm:col-span-5 space-y-2.5">
                      
                      {/* Memory */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Brain className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold text-black">Memory</div>
                        </div>
                        <span className="text-[11px] font-extrabold text-black">80 <span className="text-[9px] text-neutral-400 font-normal">/100</span></span>
                      </div>

                      {/* Attention */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <Target className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold text-black">Attention</div>
                        </div>
                        <span className="text-[11px] font-extrabold text-black">75 <span className="text-[9px] text-neutral-400 font-normal">/100</span></span>
                      </div>

                      {/* Language */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold text-black">Language</div>
                        </div>
                        <span className="text-[11px] font-extrabold text-black">82 <span className="text-[9px] text-neutral-400 font-normal">/100</span></span>
                      </div>

                      {/* Executive Function */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold text-black">Executive Function</div>
                        </div>
                        <span className="text-[11px] font-extrabold text-black">72 <span className="text-[9px] text-neutral-400 font-normal">/100</span></span>
                      </div>

                      {/* Visuospatial */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                          <Compass className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold text-black">Visuospatial</div>
                        </div>
                        <span className="text-[11px] font-extrabold text-black">75 <span className="text-[9px] text-neutral-400 font-normal">/100</span></span>
                      </div>

                    </div>

                    {/* Right Radar Web Chart (7 cols) */}
                    <div className="sm:col-span-7 flex flex-col items-center justify-center relative pt-2">
                      <div className="w-full h-48 relative flex items-center justify-center">
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                          {/* Background Pentagon Grid Web Lines */}
                          <polygon points="100,40 157,81.5 135.3,148.5 64.7,148.5 43,81.5" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                          <polygon points="100,55 142.7,86.1 126.5,136.4 73.5,136.4 57.3,86.1" fill="none" stroke="#f3f4f6" strokeWidth="1" />
                          <polygon points="100,70 128.5,90.8 117.6,124.2 82.4,124.2 71.5,90.8" fill="none" stroke="#f3f4f6" strokeWidth="1" />

                          {/* Axis Lines */}
                          <line x1="100" y1="100" x2="100" y2="40" stroke="#e5e7eb" strokeWidth="1" />
                          <line x1="100" y1="100" x2="157" y2="81.5" stroke="#e5e7eb" strokeWidth="1" />
                          <line x1="100" y1="100" x2="135.3" y2="148.5" stroke="#e5e7eb" strokeWidth="1" />
                          <line x1="100" y1="100" x2="64.7" y2="148.5" stroke="#e5e7eb" strokeWidth="1" />
                          <line x1="100" y1="100" x2="43" y2="81.5" stroke="#e5e7eb" strokeWidth="1" />

                          {/* Polygon: Average (Dashed Grey Line) */}
                          <polygon points="100,58 140,87 124.7,134 75.3,134 60,87" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeDasharray="3 3" />

                          {/* Polygon: You (Emerald Fill & Border) */}
                          <polygon points="100,52 142.8,86.1 128.9,139.8 74.6,135 57.2,86.1" fill="rgba(16, 185, 129, 0.15)" stroke="#059669" strokeWidth="2" />
                          
                          {/* Point Dots */}
                          <circle cx="100" cy="52" r="3" fill="#059669" />
                          <circle cx="142.8" cy="86.1" r="3" fill="#059669" />
                          <circle cx="128.9" cy="139.8" r="3" fill="#059669" />
                          <circle cx="74.6" cy="135" r="3" fill="#059669" />
                          <circle cx="57.2" cy="86.1" r="3" fill="#059669" />

                          {/* Labels */}
                          <text x="100" y="32" textAnchor="middle" className="text-[9px] font-semibold fill-neutral-600">Memory</text>
                          <text x="165" y="82" textAnchor="start" className="text-[8px] font-semibold fill-neutral-600">Attention</text>
                          <text x="140" y="162" textAnchor="start" className="text-[8px] font-semibold fill-neutral-600">Language</text>
                          <text x="60" y="162" textAnchor="end" className="text-[8px] font-semibold fill-neutral-600">Executive Function</text>
                          <text x="35" y="82" textAnchor="end" className="text-[8px] font-semibold fill-neutral-600">Visuospatial</text>
                        </svg>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Legend at Bottom */}
                <div className="flex items-center justify-center gap-4 border-t border-neutral-100 pt-3 text-[11px] font-semibold">
                  <div className="flex items-center gap-1.5 text-black">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span>You</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <span className="w-3 border-t-2 border-dashed border-neutral-400" />
                    <span>Average</span>
                  </div>
                </div>

              </div>

              {/* COLUMN 3: TIPS & INSIGHTS (Spans 4 cols on LG) */}
              <div className="lg:col-span-4 bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex flex-col justify-between space-y-4">
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <h3 className="text-sm font-bold text-black">Tips & Insights</h3>
                    <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-100" />
                  </div>

                  {/* Banner: Good job! */}
                  <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-emerald-950">Good job!</h4>
                      <p className="text-[11px] text-emerald-800 leading-snug font-normal">
                        Your memory and language skills are performing well.
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                      <Brain className="w-6 h-6 stroke-[1.5]" />
                    </div>
                  </div>

                  {/* Tips List */}
                  <div className="space-y-3 pt-1">
                    
                    {/* Tip 1 */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-black">Stay Consistent</div>
                        <p className="text-[11px] text-neutral-500 leading-snug font-normal">
                          Daily practice helps improve cognitive performance over time.
                        </p>
                      </div>
                    </div>

                    {/* Tip 2 */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Target className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-black">Brain Healthy Habits</div>
                        <p className="text-[11px] text-neutral-500 leading-snug font-normal">
                          Regular exercise, good sleep, and a balanced diet support brain health.
                        </p>
                      </div>
                    </div>

                    {/* Tip 3 */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Puzzle className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-black">Challenge Yourself</div>
                        <p className="text-[11px] text-neutral-500 leading-snug font-normal">
                          Try to improve your weak areas by practicing targeted exercises.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* View Personalized Recommendations Button */}
                <button className="w-full py-2.5 rounded-xl border border-neutral-200 hover:border-black text-xs font-bold text-black transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white shadow-xs">
                  <span>View Personalized Recommendations</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

              </div>

            </div>

            {/* BOTTOM DISCLAIMER BANNER */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 flex items-center justify-center gap-2 text-center text-xs text-neutral-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs leading-relaxed">
                These assessments are for monitoring cognitive health and <span className="font-bold text-neutral-900">are not a substitute for medical diagnosis.</span>
              </p>
            </div>

          </div>
          )
        ) : (
          /* ==================== GENERAL DASHBOARD OVERVIEW ==================== */
          <div className="space-y-6">
            
            {/* Top Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight flex items-center gap-2">
                  Welcome back, {firstName}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 font-normal mt-0.5">
                  Here's your brain health overview
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Back to Home Button */}
                {onBackToHome && (
                  <button
                    onClick={onBackToHome}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border-2 border-[#09090b] bg-white hover:bg-neutral-100 text-neutral-900 text-xs sm:text-sm font-bold shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] transition-all cursor-pointer"
                    title="Return to Home Landing Page"
                  >
                    <ArrowLeft className="w-4 h-4 text-black" />
                    <span>Back to Home</span>
                  </button>
                )}

                {/* Notification Bell */}
                <button className="w-10 h-10 rounded-full border-2 border-[#09090b] bg-white shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] flex items-center justify-center text-neutral-700 hover:text-black transition-all cursor-pointer relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                </button>

                {/* Book Appointment Button */}
                <button 
                  onClick={() => {
                    setIsAppointmentConfirmed(false);
                    setIsBookAppointmentOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#09090b] hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold tracking-wide shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Appointment</span>
                </button>
              </div>
            </div>

            {/* TOP ROW - 3 BENTO STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Card 1: Brain Health Score */}
              <div className="bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] relative flex items-center gap-5">
                <button className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600">
                  <Info className="w-4 h-4" />
                </button>
                
                {/* Radial Donut Progress Ring */}
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-neutral-100"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#09090b]"
                      strokeDasharray="82, 100"
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-black leading-none">82</span>
                    <span className="text-[10px] font-bold text-neutral-400">/100</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-black">Good</div>
                  <div className="text-xs text-neutral-500 font-medium">You're doing great!</div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/60 mt-1">
                    <span>↑ 5 pts</span> <span className="font-normal text-emerald-800">from last scan</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Current Risk Level */}
              <div className="bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] relative flex flex-col justify-between space-y-3">
                <button className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600">
                  <Info className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center shrink-0 text-emerald-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Current Risk Level</div>
                    <div className="text-base font-bold text-black">Low Risk</div>
                    <div className="text-xs text-neutral-500 font-normal">Minimal signs of cognitive decline</div>
                  </div>
                </div>

                <div>
                  <button className="w-full py-1.5 px-4 rounded-xl border border-neutral-300 hover:border-black text-xs font-semibold text-black transition-all cursor-pointer bg-white">
                    View Details
                  </button>
                </div>
              </div>

              {/* Card 3: Latest Scan */}
              <div className="bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] relative flex flex-col justify-between space-y-3">
                <button className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600">
                  <Info className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-neutral-700" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Latest Scan</div>
                    <div className="text-base font-bold text-black">15 Jul 2026</div>
                    <div className="text-xs text-neutral-500 font-normal">10:30 AM</div>
                  </div>
                </div>

                <div>
                  <button 
                    onClick={() => setActiveTab('My Scans')}
                    className="w-full py-1.5 px-4 rounded-xl border border-neutral-300 hover:border-black text-xs font-semibold text-black transition-all cursor-pointer bg-white"
                  >
                    View Report
                  </button>
                </div>
              </div>

            </div>

            {/* MIDDLE SECTION - ROW 1: SCORE OVER TIME CHART & LATEST SCAN OVERVIEW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              
              {/* Brain Health Score Over Time Card (Spans 7 cols on LG) */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border-2 border-[#09090b] shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] flex flex-col justify-between space-y-4">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-black">Brain Health Score Over Time</h3>
                    <Info className="w-4 h-4 text-neutral-400" />
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-800 hover:border-neutral-300">
                    <span>{selectedScanRange}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Line Chart Area */}
                <div className="relative pt-4 pb-1 px-1">
                  <div className="h-40 pl-8 relative z-10">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 600 160" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#09090b" stopOpacity="0.08" />
                          <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 20 28 Q 110 50 200 68 T 380 50 T 480 55 T 580 28 L 580 160 L 20 160 Z"
                        fill="url(#scoreGradient)"
                      />
                      <path
                        d="M 20 28 L 110 50 L 200 68 L 290 58 L 380 50 L 480 55 L 580 28"
                        fill="none"
                        stroke="#09090b"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="20" cy="28" r="4" fill="#09090b" />
                      <circle cx="110" cy="50" r="4" fill="#09090b" />
                      <circle cx="200" cy="68" r="4" fill="#09090b" />
                      <circle cx="290" cy="58" r="4" fill="#09090b" />
                      <circle cx="380" cy="50" r="4" fill="#09090b" />
                      <circle cx="480" cy="55" r="4" fill="#09090b" />
                      <circle cx="580" cy="28" r="5" fill="#09090b" stroke="#ffffff" strokeWidth="2" />
                    </svg>
                    <div className="absolute right-0 top-0 -translate-y-4 px-2.5 py-0.5 rounded-md bg-[#09090b] text-white text-xs font-bold shadow-md">
                      82
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 pl-8 text-xs font-semibold text-neutral-400">
                    <span>Jan 2026</span>
                    <span>Feb 2026</span>
                    <span>Mar 2026</span>
                    <span>Apr 2026</span>
                    <span>May 2026</span>
                    <span>Jun 2026</span>
                    <span>Jul 2026</span>
                  </div>
                </div>

              </div>

              {/* Latest Scan Overview Card (Spans 5 cols on LG - Side-by-side with Chart) */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-black">Latest Scan Overview</h3>
                  <Info className="w-4 h-4 text-neutral-400" />
                </div>

                {/* Compact Row: MRI Thumbnail Left + Metadata Right */}
                <div className="flex items-center gap-3 sm:gap-4 my-auto">
                  {/* MRI Thumbnail */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 bg-[#050507] rounded-xl p-1.5 flex items-center justify-center shrink-0 border border-neutral-800 shadow-inner">
                    {renderMriThumbnail('axial', true)}
                  </div>

                  {/* Metadata Items */}
                  <div className="flex-1 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-black font-semibold">MRI Verified</span>
                      </div>
                      <span className="font-bold text-emerald-600 text-[11px]">Detected</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-neutral-100 pb-1">
                      <div className="flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                        <span className="text-black font-semibold">Prediction</span>
                      </div>
                      <span className="font-bold text-emerald-600 text-[11px]">Non Demented</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-neutral-100 pb-1">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                        <span className="text-black font-semibold">Confidence</span>
                      </div>
                      <span className="font-bold text-emerald-600 text-[11px]">97.3%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                        <span className="text-black font-semibold">Scan Date</span>
                      </div>
                      <span className="font-medium text-neutral-800 text-[11px]">15 Jul 2026</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveTab('My Scans')}
                  className="w-full py-2 rounded-xl bg-[#09090b] hover:bg-neutral-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <span>View Full Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* MIDDLE SECTION - ROW 2: COGNITIVE ASSESSMENT / SCAN HISTORY & BRAIN HEALTH PASSPORT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              
              {/* LEFT: COGNITIVE ASSESSMENT & SCAN HISTORY (Spans 7 cols on LG) */}
              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Cognitive Assessment */}
                <div className="bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex flex-col justify-between space-y-3">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-black">Cognitive Assessment <span className="font-normal text-neutral-400">(Latest)</span></h3>
                    <Info className="w-3.5 h-3.5 text-neutral-400" />
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { label: 'Memory', score: 85, color: 'text-emerald-600' },
                      { label: 'Attention', score: 91, color: 'text-neutral-500' },
                      { label: 'Language', score: 88, color: 'text-emerald-600' },
                      { label: 'Executive Function', score: 81, color: 'text-neutral-500' },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-black">{item.label}</span>
                          <span className={`font-bold ${item.color}`}>{item.score}/100</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                          <div 
                            className="h-full bg-[#09090b] rounded-full" 
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    type="button"
                    onClick={() => {
                      setActiveTab('Cognitive Test');
                      setCognitiveSubView('dashboard');
                    }}
                    className="w-full py-1.5 rounded-xl border border-neutral-300 hover:border-black text-xs font-semibold text-black transition-all cursor-pointer bg-white"
                  >
                    View Full Assessment
                  </button>
                </div>

                {/* Scan History */}
                <div className="bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex flex-col justify-between space-y-3">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-black">Scan History</h3>
                    <Info className="w-3.5 h-3.5 text-neutral-400" />
                  </div>

                  <div className="space-y-2">
                    {[
                      { date: '15 Jul 2026', time: '10:30 AM', status: 'Completed' },
                      { date: '22 Jun 2026', time: '09:15 AM', status: 'Completed' },
                      { date: '30 May 2026', time: '11:20 AM', status: 'Completed' },
                    ].map((scan, idx) => (
                      <div key={idx} className="flex items-center justify-between p-1.5 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer" onClick={() => setActiveTab('My Scans')}>
                        <div>
                          <div className="text-xs font-bold text-black">{scan.date}</div>
                          <div className="text-[10px] text-neutral-400 font-normal">{scan.time}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60">
                            {scan.status}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setActiveTab('My Scans')}
                    className="w-full py-1.5 rounded-xl border border-neutral-300 hover:border-black text-xs font-semibold text-black transition-all cursor-pointer bg-white"
                  >
                    View All Scans
                  </button>
                </div>

              </div>

              {/* RIGHT: BRAIN HEALTH PASSPORT (Spans 5 cols on LG - Side-by-side with Scan History) */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-black">Brain Health Passport</h3>
                  <Info className="w-4 h-4 text-neutral-400" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center my-auto">
                  
                  {/* Left: Avatar, Name & QR */}
                  <div className="bg-neutral-50 rounded-xl p-2.5 border border-neutral-200 text-center flex flex-col items-center justify-center space-y-1.5">
                    <div className="w-11 h-11 rounded-xl bg-neutral-200 overflow-hidden border border-neutral-300 flex items-center justify-center font-black text-black text-sm shrink-0">
                      {firstName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-black">{cleanUserName}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">ID: SS-2026-00125</div>
                    </div>

                    {/* SVG QR Code Illustration */}
                    <div className="w-12 h-12 bg-white p-1 rounded-lg border border-neutral-200 flex items-center justify-center shadow-xs">
                      <svg className="w-full h-full text-black" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm12 0h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 0h2v4h-2v-4zm-4 2h2v2h-2v-2zm2-6h4v2h-4v-2z" />
                      </svg>
                    </div>
                  </div>

                  {/* Right: Summary Metadata */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-1">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-neutral-600 font-medium">Assessments</span>
                      </div>
                      <span className="font-bold text-black">7</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-neutral-100 pb-1">
                      <div className="flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-neutral-600 font-medium">MRI Reports</span>
                      </div>
                      <span className="font-bold text-black">3</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-neutral-100 pb-1">
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-neutral-600 font-medium">Doctor Consults</span>
                      </div>
                      <span className="font-bold text-black">2</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-neutral-600 font-medium">Member Since</span>
                      </div>
                      <span className="font-bold text-black text-[11px]">Apr 2026</span>
                    </div>
                  </div>

                </div>

                <button className="w-full py-1.5 rounded-xl border border-neutral-300 hover:border-black text-xs font-semibold text-black transition-all cursor-pointer bg-white">
                  View Passport
                </button>
              </div>

            </div>

            {/* BOTTOM SECTION: RECOMMENDED NEXT STEPS */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-black">Recommended Next Steps</h3>
                <Info className="w-4 h-4 text-neutral-400" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* Step 1: Book Neurologist Consultation */}
                <div className="bg-white rounded-2xl p-4 border-2 border-[#09090b] shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] hover:shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] transition-all cursor-pointer flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-black leading-snug">Book Neurologist</div>
                      <div className="text-[11px] text-neutral-500 font-normal">Consultation</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>

                {/* Step 2: Schedule Next MRI */}
                <div className="bg-white rounded-2xl p-4 border-2 border-[#09090b] shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] hover:shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] transition-all cursor-pointer flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-black leading-snug">Schedule Next MRI</div>
                      <div className="text-[11px] text-neutral-500 font-normal">(6 Months)</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>

                {/* Step 3: Cognitive Exercises */}
                <div className="bg-white rounded-2xl p-4 border-2 border-[#09090b] shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] hover:shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] transition-all cursor-pointer flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-black leading-snug">Cognitive Exercises</div>
                      <div className="text-[11px] text-neutral-500 font-normal">Daily Practice</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>

                {/* Step 4: Download Latest Report */}
                <div className="bg-white rounded-2xl p-4 border-2 border-[#09090b] shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] hover:shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] transition-all cursor-pointer flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-black leading-snug">Download</div>
                      <div className="text-[11px] text-neutral-500 font-normal">Latest Report</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>

                {/* Step 5: Share Report with Doctor */}
                <div className="bg-white rounded-2xl p-4 border-2 border-[#09090b] shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] hover:shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] transition-all cursor-pointer flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-black leading-snug">Share Report</div>
                      <div className="text-[11px] text-neutral-500 font-normal">with Doctor</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>

              </div>
            </div>

          </div>
        )}

      </main>

      {/* BOOK APPOINTMENT MODAL POPUP */}
      {isBookAppointmentOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsBookAppointmentOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl border-2 border-[#09090b] shadow-[8px_8px_0px_0px_rgba(9,9,11,1)] w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-2xl font-black text-black tracking-tight">Book Appointment</h2>
                <p className="text-xs sm:text-sm text-neutral-500 font-normal mt-0.5">
                  Schedule your consultation with the doctor
                </p>
              </div>
              <button 
                onClick={() => setIsBookAppointmentOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-black transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isAppointmentConfirmed ? (
              /* Confirmation Success State */
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border-2 border-emerald-500 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-black">Appointment Confirmed!</h3>
                  <p className="text-sm text-neutral-600 max-w-md">
                    Your consultation with <span className="font-bold text-black">Dr. Rajesh Sharma</span> is booked for <span className="font-bold text-black">July {selectedDate}, 2025</span> at <span className="font-bold text-black">{selectedTime}</span>.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsAppointmentConfirmed(false);
                    setIsBookAppointmentOpen(false);
                  }}
                  className="mt-4 px-8 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Main 2-Column Content */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  
                  {/* LEFT COLUMN: Doctor Card & Details (5 cols) */}
                  <div className="md:col-span-5 space-y-4">
                    
                    {/* Doctor Info Card */}
                    <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-2xl p-4 space-y-4">
                      <div className="flex gap-3.5 items-start">
                        <img
                          src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300"
                          alt="Dr. Rajesh Sharma"
                          className="w-24 h-24 rounded-2xl object-cover border border-neutral-200 shrink-0 filter grayscale"
                        />
                        <div className="space-y-1 min-w-0">
                          <h3 className="text-base font-bold text-black truncate">Dr. Rajesh Sharma</h3>
                          <p className="text-xs text-neutral-500 font-medium">Neurologist</p>
                          
                          <div className="flex items-center gap-1 text-xs font-bold text-black pt-1">
                            <Star className="w-3.5 h-3.5 fill-black text-black" />
                            <span>4.9</span>
                            <span className="text-neutral-400 font-normal text-[11px]">(128 Reviews)</span>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-neutral-600 font-medium pt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span className="truncate">Apollo Hospitals, New Delhi</span>
                          </div>
                          <p className="text-[10px] text-neutral-400 font-medium pl-4.5">
                            2.3 km away • 15 mins drive
                          </p>
                        </div>
                      </div>

                      {/* Consultation Details */}
                      <div className="border-t border-neutral-200/60 pt-3 space-y-3">
                        <h4 className="text-xs font-bold text-black">Consultation Details</h4>

                        <div className="space-y-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-neutral-600">
                              <div className="w-6 h-6 rounded-full bg-neutral-200/60 flex items-center justify-center shrink-0">
                                <Clock className="w-3.5 h-3.5 text-neutral-700" />
                              </div>
                              <span className="font-medium">Consultation Type</span>
                            </div>
                            <span className="font-bold text-black">In-Person</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-neutral-600">
                              <div className="w-6 h-6 rounded-full bg-neutral-200/60 flex items-center justify-center text-[11px] font-bold text-neutral-700 shrink-0">
                                ₹
                              </div>
                              <span className="font-medium">Consultation Fee</span>
                            </div>
                            <span className="font-bold text-black">₹1,000</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-neutral-600">
                              <div className="w-6 h-6 rounded-full bg-neutral-200/60 flex items-center justify-center shrink-0">
                                <Clock className="w-3.5 h-3.5 text-neutral-700" />
                              </div>
                              <span className="font-medium">Duration</span>
                            </div>
                            <span className="font-bold text-black">30 Minutes</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Secure & Private */}
                    <div className="bg-neutral-50/80 border border-neutral-200/80 rounded-2xl p-3.5 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-4.5 h-4.5 text-black" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-black">Secure & Private</h5>
                        <p className="text-[11px] text-neutral-500 leading-snug mt-0.5">
                          Your appointment details are encrypted and kept completely private.
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* RIGHT COLUMN: Interactive Form (7 cols) */}
                  <div className="md:col-span-7 bg-neutral-50/40 border border-neutral-200/80 rounded-2xl p-5 space-y-5">
                    
                    {/* Step 1: Select Date */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-black uppercase tracking-wider">1. Select Date</h4>

                      {/* Calendar Container */}
                      <div className="bg-white border border-neutral-200/80 rounded-xl p-3.5 space-y-3">
                        {/* Month Header */}
                        <div className="flex items-center justify-between px-2">
                          <button className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-600 transition-colors cursor-pointer">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-bold text-black">July 2025</span>
                          <button className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-600 transition-colors cursor-pointer">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Day Headers */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-neutral-500">
                          <span>Mon</span>
                          <span>Tue</span>
                          <span>Wed</span>
                          <span>Thu</span>
                          <span>Fri</span>
                          <span>Sat</span>
                          <span>Sun</span>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
                          {/* Previous Month */}
                          <span className="py-1.5 text-neutral-300">30</span>
                          
                          {/* July Days */}
                          {[
                            1,2,3,4,5,6,7,8,9,10,
                            11,12,13,14,15,16,17,18,19,20,
                            21,22,23,24,25,26,27,28,29,30,31
                          ].map((day) => {
                            const isSelected = selectedDate === day;
                            return (
                              <button
                                key={day}
                                onClick={() => setSelectedDate(day)}
                                className={`py-1.5 rounded-full transition-all cursor-pointer text-xs font-semibold flex items-center justify-center mx-auto w-7 h-7 ${
                                  isSelected
                                    ? 'bg-black text-white font-bold shadow-xs'
                                    : 'hover:bg-neutral-100 text-neutral-800'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}

                          {/* Next Month */}
                          <span className="py-1.5 text-neutral-300">1</span>
                          <span className="py-1.5 text-neutral-300">2</span>
                          <span className="py-1.5 text-neutral-300">3</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Select Time */}
                    <div className="space-y-2.5 pt-2 border-t border-neutral-200/60">
                      <h4 className="text-xs font-bold text-black uppercase tracking-wider">2. Select Time</h4>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
                          '11:00 AM', '11:30 AM', '04:00 PM', '04:30 PM'
                        ].map((slot) => {
                          const isSelected = selectedTime === slot;
                          return (
                            <button
                              key={slot}
                              onClick={() => setSelectedTime(slot)}
                              className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                                isSelected
                                  ? 'bg-black text-white border-black font-bold shadow-xs'
                                  : 'bg-white border-neutral-200/90 text-neutral-800 hover:border-black'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 3: Reason for Visit */}
                    <div className="space-y-2 pt-2 border-t border-neutral-200/60">
                      <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                        3. Reason for Visit (Optional)
                      </h4>

                      <div className="relative">
                        <textarea
                          placeholder="Briefly describe your symptoms or concern..."
                          maxLength={200}
                          value={reasonForVisit}
                          onChange={(e) => setReasonForVisit(e.target.value)}
                          className="w-full h-20 p-3 bg-white border border-neutral-200/90 rounded-xl text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black resize-none"
                        />
                        <div className="absolute bottom-2.5 right-3 text-[10px] text-neutral-400 font-medium">
                          {reasonForVisit.length}/200
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-normal">
                        <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>This helps the doctor prepare better for your consultation.</span>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                  <button
                    onClick={() => setIsBookAppointmentOpen(false)}
                    className="px-8 py-2.5 rounded-xl border border-neutral-300 hover:border-black bg-white text-xs font-bold text-black transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setIsAppointmentConfirmed(true);
                      appointmentApi.create({
                        date_str: `${selectedDate} Jul 2026`,
                        time_str: selectedTime,
                        reason_for_visit: reasonForVisit || 'Routine cognitive evaluation',
                      }).catch((e) => console.warn('Failed to persist appointment:', e));
                    }}
                    className="px-8 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                  >
                    Confirm Appointment
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* UPLOAD MRI SCAN MODAL MATCHING REFERENCE IMAGE & THEME BENTO BOXES */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full bg-white rounded-3xl border-2 border-[#09090b] shadow-[8px_8px_0px_0px_rgba(9,9,11,1)] p-6 space-y-5 text-left relative overflow-hidden my-auto">
            
            {/* 1. IDLE STATE: EXACT MATCH TO ATTACHED REFERENCE IMAGE */}
            {uploadState === 'idle' && (
              <>
                {/* HEADER */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black shrink-0">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-black tracking-tight">Upload MRI Scan</h3>
                      <p className="text-xs text-neutral-500 font-normal mt-0.5">
                        Upload your MRI scan image to get AI-powered analysis and insights.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsUploadModalOpen(false)}
                    className="p-1.5 rounded-xl text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* DRAG & DROP AREA */}
                <div 
                  onClick={() => {
                    const fileInput = document.getElementById('mri-file-input');
                    if (fileInput) fileInput.click();
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      startUploadProcess(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-neutral-300 hover:border-black rounded-2xl p-8 bg-neutral-50/60 hover:bg-neutral-50 transition-all text-center flex flex-col items-center justify-center space-y-3 cursor-pointer group"
                >
                  <input 
                    id="mri-file-input"
                    type="file" 
                    accept=".jpg,.jpeg,.png,.dcm" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        startUploadProcess(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="w-16 h-16 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black group-hover:scale-105 transition-transform shadow-xs">
                    <Upload className="w-7 h-7" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-black">Drag & drop your MRI image here</p>
                    <p className="text-xs text-neutral-500 font-normal mt-0.5">or click to browse files</p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-neutral-200 text-[11px] font-medium text-neutral-600 shadow-2xs mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-black" />
                    <span>Your data is secure and encrypted</span>
                  </div>
                </div>

                {/* SUPPORTED FORMATS */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-black">Supported Formats</div>
                      <div className="text-xs text-neutral-600 font-medium">JPG, JPEG, PNG, DICOM</div>
                      <div className="text-[11px] text-neutral-400 font-normal">Max file size: 50 MB</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const fileInput = document.getElementById('mri-file-input');
                      if (fileInput) fileInput.click();
                    }}
                    className="px-4 py-2 rounded-xl border-2 border-[#09090b] bg-white hover:bg-neutral-100 text-black text-xs font-extrabold flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] transition-all cursor-pointer shrink-0"
                  >
                    <Folder className="w-4 h-4" />
                    <span>Browse Files</span>
                  </button>
                </div>

                {/* UPLOAD GUIDELINES */}
                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-black">Upload Guidelines</h4>

                  <div className="space-y-2.5">
                    {/* Guideline 1 */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black shrink-0 mt-0.5">
                        <Disc className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-black">Clear Image</div>
                        <div className="text-[11px] text-neutral-500 font-normal">Ensure the MRI scan image is clear and not blurry.</div>
                      </div>
                    </div>

                    {/* Guideline 2 */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black shrink-0 mt-0.5">
                        <Maximize className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-black">Correct Orientation</div>
                        <div className="text-[11px] text-neutral-500 font-normal">Upload the image in the correct orientation.</div>
                      </div>
                    </div>

                    {/* Guideline 3 */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black shrink-0 mt-0.5">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-black">Single Scan</div>
                        <div className="text-[11px] text-neutral-500 font-normal">Please upload one scan image at a time.</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FOOTER BUTTONS */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-neutral-200">
                  <button
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl border-2 border-[#09090b] bg-white hover:bg-neutral-100 text-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => startUploadProcess('Patient_Brain_MRI_Scan.dcm')}
                    className="px-6 py-2.5 rounded-xl bg-[#09090b] hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload & Analyze</span>
                  </button>
                </div>
              </>
            )}

            {/* 2. UPLOADING STATE WITH BENTO STYLING & PROGRESS */}
            {uploadState === 'uploading' && (
              <div className="py-8 space-y-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-neutral-100 border-2 border-[#09090b] shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] flex items-center justify-center mx-auto text-black">
                  <Loader2 className="w-8 h-8 animate-spin text-black" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-black">Uploading & Processing Scan</h3>
                  <p className="text-xs text-neutral-500">
                    Transferring <span className="font-bold text-black">{uploadedFileName}</span> to BrainTrace AI Model...
                  </p>
                </div>

                {/* PROGRESS BAR */}
                <div className="space-y-2 max-w-md mx-auto">
                  <div className="w-full h-3 bg-neutral-100 border-2 border-black rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-black rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-black">
                    <span>{uploadProgress < 50 ? 'Uploading DICOM Slices...' : 'Running Deep Learning Segmentation...'}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs text-neutral-600 flex items-center justify-center gap-2 max-w-md mx-auto">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Encrypted cloud connection • HIPAA compliant pipeline</span>
                </div>
              </div>
            )}

            {/* 3. SUCCEEDED STATE WITH TICK */}
            {uploadState === 'succeeded' && (
              <div className="py-6 space-y-5 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-600 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-black text-black">Upload & Analysis Succeeded!</h3>
                  <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed font-normal">
                    Your MRI scan <span className="font-bold text-black">{uploadedFileName}</span> has been successfully processed. The AI model confirmed a <span className="font-bold text-emerald-700">{uploadedPrediction}</span> structural profile.
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2 max-w-md mx-auto text-left">
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                    <span className="font-bold text-emerald-950">AI Prediction</span>
                    <span className="font-extrabold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-300">{uploadedPrediction}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-900 font-medium">Confidence Score</span>
                    <span className="font-mono font-bold text-emerald-950">{uploadedConfidence}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-8 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Done & View Scans</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
