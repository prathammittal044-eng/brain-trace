import React, { useState, useEffect } from 'react';
import { profileApi, messageApi } from '../services/apiClient';
import { CaregiverCoordinationView } from './care_space/CaregiverCoordinationView';
import { CaretakerCareSpaceView } from './CaretakerCareSpaceView';

import { 
  Heart, 
  Shield, 
  Bell, 
  Calendar, 
  Clock, 
  User, 
  PhoneCall, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare, 
  Activity, 
  Pencil, 
  Plus, 
  LogOut, 
  Home, 
  Brain, 
  FileText, 
  Send,
  Check,
  ChevronRight,
  ShieldCheck,
  Zap,
  Info,
  Users
} from 'lucide-react';
import { BrainTraceLogo } from './BrainTraceLogo';

interface CaretakerDashboardProps {
  userName: string;
  onLogout: () => void;
  onBackToHome: () => void;
}

export const CaretakerDashboard: React.FC<CaretakerDashboardProps> = ({
  userName,
  onLogout,
  onBackToHome
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'meds' | 'notes' | 'doctor' | 'connected-care'>('overview');
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  // Caretaker notes
  const [notes, setNotes] = useState([
    { id: '1', date: 'Today, 09:30 AM', author: userName, text: 'Completed morning 15-min memory puzzle exercise. Score 92/100. Patient was energetic and relaxed.' },
    { id: '2', date: 'Yesterday, 08:00 PM', author: userName, text: 'Evening BP normal (120/80). Complained of mild fatigue after walk.' }
  ]);
  const [newNote, setNewNote] = useState('');

  // Medication checklist state
  const [meds, setMeds] = useState([
    { id: '1', name: 'Donepezil 5mg', time: '08:00 AM', status: 'taken', dosage: '1 Tablet after breakfast' },
    { id: '2', name: 'Multivitamin B-Complex', time: '01:00 PM', status: 'pending', dosage: '1 Capsule after lunch' },
    { id: '3', name: 'Memantine 10mg', time: '09:00 PM', status: 'pending', dosage: '1 Tablet before sleep' }
  ]);

  // Doctor message state
  const [doctorMsg, setDoctorMsg] = useState('');
  const [sentMsgs, setSentMsgs] = useState([
    { sender: 'doctor', text: 'Good morning! Alex\'s latest cognitive assessment results look very promising.', time: '08:45 AM' }
  ]);

  // Fetch persisted notes and medications on mount
  useEffect(() => {
    profileApi.getCaretakerNotes().then((res) => {
      if (res.data && res.data.length > 0) setNotes(res.data);
    }).catch(() => {});

    profileApi.getMedications().then((res) => {
      if (res.data && res.data.length > 0) setMeds(res.data);
    }).catch(() => {});
  }, []);

  const toggleMedStatus = (id: string) => {
    setMeds(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, status: m.status === 'taken' ? 'pending' : 'taken' };
      }
      return m;
    }));
    profileApi.toggleMedication(id).catch(() => {});
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const noteText = newNote.trim();
    setNotes([
      { id: Date.now().toString(), date: 'Just now', author: userName, text: noteText },
      ...notes
    ]);
    profileApi.addCaretakerNote(noteText, userName).catch(() => {});
    setNewNote('');
  };

  const handleSendDoctorMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorMsg.trim()) return;
    const msgText = doctorMsg.trim();
    setSentMsgs([...sentMsgs, { sender: 'caretaker', text: msgText, time: 'Just now' }]);
    messageApi.send({ contact_id: 'dr-rajesh', text: msgText }).catch(() => {});
    setDoctorMsg('');
  };

  const triggerSos = () => {
    setSosSent(true);
    setTimeout(() => {
      setSosSent(false);
      setIsSosModalOpen(false);
    }, 2500);
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
            {/* <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
              Caretaker Portal
            </span> */}
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSosModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer animate-pulse"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Emergency SOS</span>
          </button>

          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-neutral-200">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center border border-amber-600 shadow-xs">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left leading-tight">
              <p className="text-xs font-bold text-black">{userName}</p>
              <p className="text-[10px] text-neutral-500 font-medium">Primary Caregiver</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl border border-neutral-200 hover:border-black bg-white text-neutral-600 hover:text-black transition-colors cursor-pointer ml-1"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        
        {/* TOP WELCOME BANNER & MANAGED PATIENT SELECTOR */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-black">Caretaker Dashboard</h1>
              <span className="text-xs font-bold bg-neutral-100 text-neutral-700 px-2.5 py-0.5 rounded-md border border-neutral-300">
                Live Monitoring
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600">
              Welcome, <span className="font-bold text-black">{userName}</span>. You are monitoring care routine and health vitals.
            </p>
          </div>

          {/* Patient Card Indicator */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center border border-emerald-300 shrink-0">
              DP
            </div>
            <div className="text-left text-xs">
              <span className="text-[10px] text-neutral-500 font-bold block uppercase tracking-wider">Monitored Patient</span>
              <span className="font-bold text-black text-sm block">Demo Patient (DX-4091)</span>
              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Vitals Active • Cognitive Score 88/100
              </span>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Patient Overview', icon: Activity },
            { id: 'connected-care', label: 'Connected Care Hub', icon: Users },
            { id: 'meds', label: 'Medication & Care Plan', icon: Clock },
            { id: 'notes', label: 'Care Notes & Logs', icon: FileText },
            { id: 'doctor', label: 'Doctor Connect', icon: MessageSquare }
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

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'connected-care' && (
          <div className="space-y-8">
            <CaretakerCareSpaceView caretakerName={userName} />
            <CaregiverCoordinationView />
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* 4 STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white rounded-2xl p-4 border-2 border-[#09090b] shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Cognitive Score</span>
                  <span className="text-xl font-black text-black">88 / 100</span>
                  <span className="text-[10px] text-emerald-600 font-bold block">+3% this week</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border-2 border-[#09090b] shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Next Medication</span>
                  <span className="text-base font-black text-black">01:00 PM</span>
                  <span className="text-[10px] text-amber-700 font-bold block">Multivitamin B-Complex</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border-2 border-[#09090b] shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Heart Rate / BP</span>
                  <span className="text-base font-black text-black">72 bpm • 120/80</span>
                  <span className="text-[10px] text-blue-600 font-bold block">Vitals Stable</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border-2 border-[#09090b] shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Brain Check Streak</span>
                  <span className="text-xl font-black text-black">12 Days</span>
                  <span className="text-[10px] text-purple-600 font-bold block">Today Completed</span>
                </div>
              </div>

            </div>

            {/* TWO COLUMNS: DAILY ROUTINE STATUS & RECENT CARE LOGS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Routine Checklist (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <h3 className="text-base font-bold text-black flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Today's Care Plan Checklist</span>
                  </h3>
                  <span className="text-xs font-semibold text-neutral-500">
                    {meds.filter(m => m.status === 'taken').length} of {meds.length} Done
                  </span>
                </div>

                <div className="space-y-2.5">
                  {meds.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => toggleMedStatus(item.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        item.status === 'taken'
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-neutral-50 border-neutral-200 hover:border-black'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                          item.status === 'taken' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-neutral-400 bg-white'
                        }`}>
                          {item.status === 'taken' && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${item.status === 'taken' ? 'text-neutral-500 line-through' : 'text-black'}`}>
                            {item.name}
                          </p>
                          <p className="text-[11px] text-neutral-500">{item.dosage}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-neutral-600 bg-white border border-neutral-200 px-2.5 py-1 rounded-lg shrink-0">
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor Details & Direct Call (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] space-y-4">
                <h3 className="text-base font-bold text-black flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <User className="w-4 h-4 text-black" />
                  <span>Assigned Neurologist</span>
                </h3>

                <div className="flex items-center gap-3.5 bg-neutral-50 border border-neutral-200 p-3.5 rounded-xl">
                  <img 
                    src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200" 
                    alt="Doctor" 
                    className="w-14 h-14 rounded-xl object-cover border border-neutral-300 filter grayscale shrink-0" 
                  />
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-black">Dr. Rajesh Sharma</h4>
                    <p className="text-xs text-neutral-500">Neurology & Cognitive Care</p>
                    <p className="text-[11px] font-semibold text-emerald-700 pt-0.5">Apollo Hospitals • Available Today</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setActiveTab('doctor')}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                  <button 
                    onClick={() => alert('Initiating priority call to Dr. Rajesh Sharma...')}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-neutral-300 hover:border-black bg-white text-black text-xs font-bold transition-all cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-neutral-700" />
                    <span>Call Clinic</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: MEDICATION */}
        {activeTab === 'meds' && (
          <div className="bg-white rounded-2xl p-6 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-black">Medication Schedule & Care Instructions</h2>
                <p className="text-xs text-neutral-500">Track and confirm dosage compliance for Demo Patient (DX-4091)</p>
              </div>
            </div>

            <div className="space-y-3">
              {meds.map(med => (
                <div key={med.id} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-black">{med.name}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${med.status === 'taken' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {med.status === 'taken' ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600">{med.dosage}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-neutral-700 bg-white px-3 py-1.5 rounded-lg border border-neutral-200">
                      {med.time}
                    </span>
                    <button
                      onClick={() => toggleMedStatus(med.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        med.status === 'taken'
                          ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                          : 'bg-black text-white hover:bg-neutral-800'
                      }`}
                    >
                      {med.status === 'taken' ? 'Mark Pending' : 'Confirm Taken'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CARE NOTES */}
        {activeTab === 'notes' && (
          <div className="bg-white rounded-2xl p-6 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] space-y-6">
            <div>
              <h2 className="text-lg font-bold text-black">Daily Care Notes & Observations</h2>
              <p className="text-xs text-neutral-500">Record daily cognitive behavior, mood swings, or symptoms for the physician</p>
            </div>

            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Type your observations here (e.g., patient was cheerful, completed memory game effortlessly)..."
                className="w-full h-24 p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black resize-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Save Care Note</span>
              </button>
            </form>

            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Previous Notes Log</h3>
              {notes.map(note => (
                <div key={note.id} className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-black">
                    <span>{note.author}</span>
                    <span className="text-[11px] font-normal text-neutral-500">{note.date}</span>
                  </div>
                  <p className="text-xs text-neutral-700 leading-relaxed">{note.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DOCTOR CONNECT */}
        {activeTab === 'doctor' && (
          <div className="bg-white rounded-2xl p-6 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] space-y-6">
            <div>
              <h2 className="text-lg font-bold text-black">Direct Message to Dr. Rajesh Sharma</h2>
              <p className="text-xs text-neutral-500">Ask questions or share updates directly with the assigned physician</p>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 h-64 overflow-y-auto space-y-3">
              {sentMsgs.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex ${msg.sender === 'caretaker' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-md p-3 rounded-2xl text-xs ${
                    msg.sender === 'caretaker'
                      ? 'bg-black text-white rounded-br-none'
                      : 'bg-white border border-neutral-200 text-black rounded-bl-none shadow-xs'
                  }`}>
                    <p className="font-medium">{msg.text}</p>
                    <span className={`text-[10px] block mt-1 ${msg.sender === 'caretaker' ? 'text-neutral-400 text-right' : 'text-neutral-500'}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendDoctorMsg} className="flex gap-2">
              <input
                type="text"
                value={doctorMsg}
                onChange={e => setDoctorMsg(e.target.value)}
                placeholder="Type a message to Dr. Rajesh Sharma..."
                className="flex-1 p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-black focus:outline-none focus:border-black"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}

      </main>

      {/* EMERGENCY SOS MODAL */}
      {isSosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border-2 border-black p-6 max-w-md w-full space-y-5 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto border-2 border-red-500 animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>

            {sosSent ? (
              <div className="space-y-2 py-4">
                <h3 className="text-xl font-black text-red-600">SOS ALERT TRANSMITTED!</h3>
                <p className="text-xs text-neutral-600">
                  Apollo Emergency Services and Dr. Rajesh Sharma have been notified of your location.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-black">Trigger Emergency Assistance</h3>
                  <p className="text-xs text-neutral-600">
                    This will send an immediate high-priority alert to Apollo Hospitals emergency desk and Dr. Rajesh Sharma with patient location & recent vitals.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsSosModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-300 font-bold text-xs text-black hover:bg-neutral-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={triggerSos}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-md"
                  >
                    CONFIRM SOS
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} BrainTrace Caretaker Portal. Monitored for Demo Patient (DX-4091).
      </footer>

    </div>
  );
};
