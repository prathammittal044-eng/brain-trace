import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  Users,
  Bot,
  Star,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Send,
  CheckCheck,
  Check,
  ThumbsUp,
  Heart,
  Smile,
  ShieldCheck,
  Calendar,
  User,
  Share2,
  ArrowRight,
  Plus,
  Bell,
  Archive,
  X,
  MapPin,
  Clock,
  Sparkles,
  Brain,
  Layers,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Download,
  Trash2,
  Volume2,
  VolumeX,
  FileText,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { messageApi } from '../services/apiClient';


export interface ChatMessage {
  id: string;
  sender: 'patient' | 'contact';
  text: string;
  timestamp: string;
  reactions?: { emoji: string; count: number; reactedByMe?: boolean }[];
  attachment?: {
    type: 'cognitive_report' | 'mri_scan' | 'file';
    title: string;
    score?: number;
    details?: string;
    date?: string;
  };
}

export interface ContactChat {
  id: string;
  name: string;
  role: string;
  category: 'Doctors' | 'Care Team';
  avatarUrl?: string;
  isBot?: boolean;
  isTeam?: boolean;
  hospital: string;
  rating: number;
  reviewCount: number;
  isOnline: boolean;
  lastSeen?: string;
  unreadCount: number;
  isStarred?: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
  bio: string;
  credentials: string[];
  languages: string[];
  messages: ChatMessage[];
}

interface MessagesViewProps {
  cleanUserName?: string;
  onOpenBookAppointment?: (doctorName?: string) => void;
  onViewCognitiveReport?: () => void;
}

const INITIAL_CONTACTS: ContactChat[] = [
  {
    id: 'dr-rajesh',
    name: 'Dr. Rajesh Sharma',
    role: 'Senior Neurologist',
    category: 'Doctors',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
    hospital: 'Apollo Hospitals, New Delhi',
    rating: 4.9,
    reviewCount: 128,
    isOnline: true,
    unreadCount: 2,
    isStarred: true,
    bio: 'Dr. Rajesh Sharma is a clinical neurologist with 18+ years of expertise in cognitive neurology, memory disorders, and neurodegenerative disease tracking.',
    credentials: ['MBBS, MD (Medicine), DM (Neurology)', 'Fellow, Indian Academy of Neurology', 'Member, World Federation of Neurology'],
    languages: ['English', 'Hindi'],
    messages: [
      {
        id: 'm1',
        sender: 'contact',
        text: "Hello, I've reviewed your latest MRI brain scan and recent cognitive assessments.",
        timestamp: '10:28 AM'
      },
      {
        id: 'm2',
        sender: 'patient',
        text: 'Hello Doctor, thank you. How is my condition and overall trend?',
        timestamp: '10:29 AM'
      },
      {
        id: 'm3',
        sender: 'contact',
        text: "Your MRI report looks stable compared to the previous scan. Hippocampal volume index is preserved with no significant focal changes. Let's maintain regular daily cognitive tasks and monitor steadily.",
        timestamp: '10:30 AM',
        reactions: [{ emoji: '👍', count: 1, reactedByMe: true }]
      },
      {
        id: 'm4',
        sender: 'patient',
        text: "That's very reassuring to hear. Thank you so much, Doctor!",
        timestamp: '10:31 AM'
      }
    ]
  },
  {
    id: 'dr-neha',
    name: 'Dr. Neha Verma',
    role: 'Clinical Neuropsychologist',
    category: 'Doctors',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813571-2153349aed06?auto=format&fit=crop&q=80&w=200',
    hospital: 'Fortis Healthcare, Mumbai',
    rating: 4.8,
    reviewCount: 94,
    isOnline: true,
    unreadCount: 1,
    isStarred: false,
    bio: 'Specialist in computerized cognitive assessments, memory rehabilitation protocols, and executive function training.',
    credentials: ['M.Phil, Ph.D. in Clinical Neuropsychology', 'Certified Cognitive Behavioral Therapist'],
    languages: ['English', 'Hindi', 'Marathi'],
    messages: [
      {
        id: 'm-neha-1',
        sender: 'contact',
        text: 'Good morning! Please share your latest BrainTrace Cognitive Test results so we can review your working memory and pattern recognition performance.',
        timestamp: 'Yesterday 04:15 PM'
      },
      {
        id: 'm-neha-2',
        sender: 'patient',
        text: 'I completed the 5-domain assessment this morning with an 88/100 score.',
        timestamp: 'Yesterday 04:30 PM'
      },
      {
        id: 'm-neha-3',
        sender: 'contact',
        text: 'Excellent work! Consistent engagement creates neurological resilience. Keep practicing the visual-spatial trials.',
        timestamp: 'Yesterday 04:35 PM',
        reactions: [{ emoji: '❤️', count: 1, reactedByMe: false }]
      }
    ]
  },
  {
    id: 'dr-amit',
    name: 'Dr. Amit Desai',
    role: 'Diagnostic Neuroradiologist',
    category: 'Doctors',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
    hospital: 'Max Healthcare, Gurugram',
    rating: 4.9,
    reviewCount: 110,
    isOnline: false,
    lastSeen: '2 hours ago',
    unreadCount: 0,
    isStarred: false,
    bio: 'Lead neuroradiologist focused on advanced high-field brain MRI, Fazekas white matter hyperintensity quantification, and volumetric voxel analytics.',
    credentials: ['MBBS, MD (Radiodiagnosis), DNB', 'Fellowship in Advanced Neuroimaging'],
    languages: ['English', 'Hindi', 'Gujarati'],
    messages: [
      {
        id: 'm-amit-1',
        sender: 'contact',
        text: 'The automated segmentation for your axial T1 MRI slice is complete. Minimal Fazekas Grade 1 periventricular changes observed, consistent with healthy aging.',
        timestamp: '20 Jul 11:15 AM'
      },
      {
        id: 'm-amit-2',
        sender: 'patient',
        text: 'Thank you Dr. Desai. We will discuss this in the next clinic consultation.',
        timestamp: '20 Jul 11:45 AM'
      }
    ]
  },
  {
    id: 'care-team',
    name: 'BrainTrace Care Team',
    role: 'Care Coordination & Concierge',
    category: 'Care Team',
    isTeam: true,
    hospital: 'BrainTrace 24/7 Patient Concierge',
    rating: 5.0,
    reviewCount: 260,
    isOnline: true,
    unreadCount: 0,
    bio: 'Your dedicated patient care coordinators assisting with clinic appointments, specialist follow-ups, and daily wellness schedules.',
    credentials: ['Certified Care Navigators', 'Health Support Team'],
    languages: ['English', 'Hindi', 'Spanish'],
    messages: [
      {
        id: 'm-care-1',
        sender: 'contact',
        text: 'Hello! Your upcoming appointment with Dr. Rajesh Sharma is confirmed for 28 Oct at 11:00 AM. Would you like a ride arrangement or pre-visit checklist?',
        timestamp: '18 Jul 09:00 AM'
      },
      {
        id: 'm-care-2',
        sender: 'patient',
        text: 'The pre-visit checklist would be very helpful, thank you!',
        timestamp: '18 Jul 09:12 AM'
      },
      {
        id: 'm-care-3',
        sender: 'contact',
        text: "We've attached your checklist to your patient portal. Please ensure you take your regular morning medications as prescribed.",
        timestamp: '18 Jul 09:15 AM',
        reactions: [{ emoji: '👏', count: 1, reactedByMe: true }]
      }
    ]
  },
  {
    id: 'health-assistant',
    name: 'BrainTrace AI Health Assistant',
    role: 'Automated Care Guidance',
    category: 'Care Team',
    isBot: true,
    hospital: 'BrainTrace Autonomous Clinical Engine',
    rating: 4.9,
    reviewCount: 340,
    isOnline: true,
    unreadCount: 0,
    bio: 'AI-assisted health guide ready 24/7 to answer questions regarding your cognitive exercises, MRI terminology, and hydration reminders.',
    credentials: ['Medical AI Guardrails Compliant', 'HIPAA Standard Architecture'],
    languages: ['English', 'Multi-Language Support'],
    messages: [
      {
        id: 'm-bot-1',
        sender: 'contact',
        text: 'Reminder: Daily cognitive activity check is ready. Today includes 10 quick memory and visual-spatial exercises.',
        timestamp: '15 Jul 08:30 AM'
      },
      {
        id: 'm-bot-2',
        sender: 'patient',
        text: 'I just finished the test!',
        timestamp: '15 Jul 08:50 AM'
      },
      {
        id: 'm-bot-3',
        sender: 'contact',
        text: 'Well done! Your score of 88/100 has been logged to your longitudinal history. Your neurologist has access to the updated report.',
        timestamp: '15 Jul 08:51 AM'
      }
    ]
  },
  {
    id: 'dr-priya',
    name: 'Dr. Priya Nair',
    role: 'Cognitive Rehabilitation Specialist',
    category: 'Doctors',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
    hospital: 'Medanta - The Medicity, Delhi NCR',
    rating: 4.9,
    reviewCount: 82,
    isOnline: true,
    unreadCount: 0,
    bio: 'Dedicated to non-pharmacological neuroplasticity interventions, dual-task physical-cognitive training, and daily executive functioning routines.',
    credentials: ['MBBS, MD (Physical Medicine & Rehab)', 'Fellow in Neuro-Rehabilitation'],
    languages: ['English', 'Malayalam', 'Hindi'],
    messages: [
      {
        id: 'm-priya-1',
        sender: 'contact',
        text: 'Great improvement on the reverse-span digit recall task! Continue doing 15 minutes of cross-table puzzles every morning.',
        timestamp: '12 Jul 03:20 PM',
        reactions: [{ emoji: '👏', count: 2, reactedByMe: true }]
      }
    ]
  }
];

export const MessagesView: React.FC<MessagesViewProps> = ({
  cleanUserName = 'Demo Patient (DX-4091)',
  onOpenBookAppointment,
  onViewCognitiveReport
}) => {
  const [contacts, setContacts] = useState<ContactChat[]>(INITIAL_CONTACTS);
  const [selectedChatId, setSelectedChatId] = useState<string>('dr-rajesh');
  const [messagesSubTab, setMessagesSubTab] = useState<'All' | 'Doctors' | 'Care Team'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'starred'>('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [chatInputText, setChatInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

  // Modals
  const [isAudioCallOpen, setIsAudioCallOpen] = useState(false);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [newMsgRecipientId, setNewMsgRecipientId] = useState('dr-rajesh');
  const [newMsgSubject, setNewMsgSubject] = useState('General Consultation');
  const [newMsgContent, setNewMsgContent] = useState('');

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'Dr. Rajesh Sharma updated notes', desc: 'Added longitudinal cognitive observation', time: '10m ago', read: false },
    { id: 'n2', title: 'Upcoming consultation in 4 days', desc: 'Scheduled for 28 Oct at 11:00 AM', time: '1h ago', read: false },
    { id: 'n3', title: 'Care team message received', desc: 'Pre-visit checklist is ready', time: 'Yesterday', read: false }
  ]);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPatientProfileModalOpen, setIsPatientProfileModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const selectedContact = contacts.find((c) => c.id === selectedChatId) || contacts[0];

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedContact?.messages, isTyping]);

  // Fetch persistent messages from backend upon mount
  useEffect(() => {
    messageApi.getContacts().then((res) => {
      if (res.data && res.data.length > 0) {
        setContacts((prev) =>
          prev.map((c) => {
            const match = res.data.find((rc: any) => rc.id === c.id);
            if (match && match.messages && match.messages.length > 0) {
              return { ...c, messages: match.messages };
            }
            return c;
          })
        );
      }
    }).catch(() => {});
  }, []);

  // Clear unread count when opening a chat
  useEffect(() => {
    setContacts((prev) =>
      prev.map((c) => (c.id === selectedChatId ? { ...c, unreadCount: 0 } : c))
    );
  }, [selectedChatId]);

  // Call timer effect
  useEffect(() => {
    let timer: any;
    if (isAudioCallOpen || isVideoCallOpen) {
      timer = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isAudioCallOpen, isVideoCallOpen]);

  // Filter contacts
  const filteredContacts = contacts.filter((c) => {
    // Archived check
    if (showArchived) {
      if (!c.isArchived) return false;
    } else {
      if (c.isArchived) return false;
    }

    // Sub-tab check
    if (messagesSubTab !== 'All' && c.category !== messagesSubTab) {
      return false;
    }

    // Filter dropdown check
    if (filterMode === 'unread' && c.unreadCount === 0) return false;
    if (filterMode === 'starred' && !c.isStarred) return false;

    // Search query check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchRole = c.role.toLowerCase().includes(q);
      const matchHospital = c.hospital.toLowerCase().includes(q);
      const matchMessages = c.messages.some((m) => m.text.toLowerCase().includes(q));
      return matchName || matchRole || matchHospital || matchMessages;
    }

    return true;
  });

  // Toggle favorite/star
  const handleToggleStar = (contactId: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, isStarred: !c.isStarred } : c))
    );
    showToast(selectedContact.isStarred ? 'Removed from starred' : 'Starred contact');
  };

  // Toggle mute
  const handleToggleMute = (contactId: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, isMuted: !c.isMuted } : c))
    );
    showToast(selectedContact.isMuted ? 'Notifications unmuted' : 'Conversation muted');
    setMoreMenuOpen(false);
  };

  // Archive / unarchive conversation
  const handleToggleArchive = (contactId: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, isArchived: !c.isArchived } : c))
    );
    showToast(selectedContact.isArchived ? 'Restored conversation' : 'Conversation archived');
    setMoreMenuOpen(false);
  };

  // Clear chat
  const handleClearChat = (contactId: string) => {
    if (window.confirm('Are you sure you want to clear this conversation history?')) {
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, messages: [] } : c))
      );
      showToast('Chat history cleared');
      setMoreMenuOpen(false);
    }
  };

  // Export transcript
  const handleExportTranscript = () => {
    if (!selectedContact) return;
    const lines = [
      `BrainTrace Telehealth - Secure Conversation Transcript`,
      `Participant: ${selectedContact.name} (${selectedContact.role})`,
      `Patient: ${cleanUserName}`,
      `Exported: ${new Date().toLocaleString()}`,
      `----------------------------------------------------`,
      ...selectedContact.messages.map(
        (m) =>
          `[${m.timestamp}] ${m.sender === 'patient' ? cleanUserName : selectedContact.name}: ${m.text}`
      )
    ];
    const blob = new Blob([lines.join('\n\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedContact.name.replace(/\s+/g, '_')}_Transcript_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Transcript downloaded');
    setMoreMenuOpen(false);
  };

  // Send message
  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || chatInputText).trim();
    if (!text || !selectedContact) return;

    const newMsg: ChatMessage = {
      id: `m-patient-${Date.now()}`,
      sender: 'patient',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setContacts((prev) =>
      prev.map((c) =>
        c.id === selectedContact.id
          ? { ...c, messages: [...c.messages, newMsg] }
          : c
      )
    );
    setChatInputText('');

    // Persist message to backend
    messageApi.send({ contact_id: selectedContact.id, text }).catch(() => {});

    // Trigger realistic doctor reply simulation
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let replyText = '';
      if (selectedContact.id === 'dr-rajesh') {
        replyText =
          "Thank you for sharing this. Everything indicates stability. Remember to maintain consistent hydration, take prescribed supplements on schedule, and don't hesitate to reach out if any cognitive fatigue occurs.";
      } else if (selectedContact.id === 'dr-neha') {
        replyText =
          "Noted! Your reaction times and pattern recognition trials show steady cognitive endurance. I recommend trying the auditory recall exercises twice this week.";
      } else if (selectedContact.id === 'dr-amit') {
        replyText =
          "Thanks for the update. The volumetric markers from your MRI are archived and remain consistent with standard baseline benchmarks.";
      } else if (selectedContact.id === 'care-team') {
        replyText =
          "We've logged your request! A care team coordinator has noted your preferences and will confirm any schedule modifications right away.";
      } else if (selectedContact.id === 'health-assistant') {
        replyText =
          "Got it! I have recorded this note in your BrainTrace longitudinal tracker. Keep up the great engagement with your daily activities!";
      } else {
        replyText =
          "Thank you for reaching out. Let's review this together during our next scheduled consultation. Stay well!";
      }

      const replyMsg: ChatMessage = {
        id: `m-reply-${Date.now()}`,
        sender: 'contact',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: [{ emoji: '👍', count: 1, reactedByMe: false }]
      };

      setContacts((prev) =>
        prev.map((c) =>
          c.id === selectedContact.id
            ? { ...c, messages: [...c.messages, replyMsg] }
            : c
        )
      );
    }, 1400);
  };

  // Attach Cognitive Report
  const handleAttachCognitiveReport = () => {
    if (!selectedContact) return;
    const reportMsg: ChatMessage = {
      id: `m-rep-${Date.now()}`,
      sender: 'patient',
      text: 'I have attached my latest Cognitive Assessment Report for your clinical review.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: {
        type: 'cognitive_report',
        title: 'Daily Cognitive Activity Report',
        score: 88,
        details: 'All 5 Domains Scored (Memory, Attention, Working Memory, Pattern, Visual-Spatial)',
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
      }
    };

    setContacts((prev) =>
      prev.map((c) =>
        c.id === selectedContact.id
          ? { ...c, messages: [...c.messages, reportMsg] }
          : c
      )
    );
    setIsAttachmentMenuOpen(false);
    showToast('Cognitive report attached to conversation');

    // Simulate provider acknowledgment
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const ackMsg: ChatMessage = {
        id: `m-ack-${Date.now()}`,
        sender: 'contact',
        text: "Received your cognitive report (Score 88/100). The scores show strong attention and working memory stability. I will log this into your medical file.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: [{ emoji: '👏', count: 1, reactedByMe: false }]
      };
      setContacts((prev) =>
        prev.map((c) =>
          c.id === selectedContact.id
            ? { ...c, messages: [...c.messages, ackMsg] }
            : c
        )
      );
    }, 1200);
  };

  // Attach MRI Scan
  const handleAttachMriScan = () => {
    if (!selectedContact) return;
    const scanMsg: ChatMessage = {
      id: `m-scan-${Date.now()}`,
      sender: 'patient',
      text: 'Attached recent Brain MRI (T1-Weighted Axial slice) for reference.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: {
        type: 'mri_scan',
        title: 'Brain MRI Axial Slice (T1/T2)',
        details: 'Hippocampal Index: Normal (3.82 cm³) • Fazekas Grade 1',
        date: '22 Jul 2026'
      }
    };

    setContacts((prev) =>
      prev.map((c) =>
        c.id === selectedContact.id
          ? { ...c, messages: [...c.messages, scanMsg] }
          : c
      )
    );
    setIsAttachmentMenuOpen(false);
    showToast('MRI Scan attached to conversation');
  };

  // Toggle reaction on a message
  const handleToggleReaction = (msgId: string, emoji: string) => {
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id !== selectedContact.id) return c;
        const updatedMsgs = c.messages.map((m) => {
          if (m.id !== msgId) return m;
          const currentReactions = m.reactions || [];
          const existing = currentReactions.find((r) => r.emoji === emoji);
          let newReactions;
          if (existing) {
            if (existing.reactedByMe) {
              newReactions = currentReactions
                .map((r) =>
                  r.emoji === emoji ? { ...r, count: r.count - 1, reactedByMe: false } : r
                )
                .filter((r) => r.count > 0);
            } else {
              newReactions = currentReactions.map((r) =>
                r.emoji === emoji ? { ...r, count: r.count + 1, reactedByMe: true } : r
              );
            }
          } else {
            newReactions = [...currentReactions, { emoji, count: 1, reactedByMe: true }];
          }
          return { ...m, reactions: newReactions };
        });
        return { ...c, messages: updatedMsgs };
      })
    );
  };

  // Create new conversation modal submit
  const handleStartNewMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgContent.trim()) return;

    setSelectedChatId(newMsgRecipientId);
    setIsNewMessageModalOpen(false);

    // Send the message into that recipient's thread
    const newMsg: ChatMessage = {
      id: `m-new-${Date.now()}`,
      sender: 'patient',
      text: `[Topic: ${newMsgSubject}] ${newMsgContent.trim()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setContacts((prev) =>
      prev.map((c) =>
        c.id === newMsgRecipientId
          ? { ...c, messages: [...c.messages, newMsg] }
          : c
      )
    );
    setNewMsgContent('');
    showToast('New message delivered');
  };

  const formatCallTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const unreadTotal = contacts.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#09090b] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
              Messages
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60">
              Telehealth Connected
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 font-normal mt-0.5">
            Connect securely with your doctors and multidisciplinary care team
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="w-10 h-10 rounded-full border border-neutral-200 bg-white shadow-xs flex items-center justify-center text-neutral-700 hover:text-black hover:border-neutral-300 transition-all cursor-pointer relative"
              title="View Care Notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.some((n) => !n.read) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border-2 border-black p-4 z-40 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-black">
                    <Bell className="w-3.5 h-3.5" />
                    <span>Care Alerts & Updates</span>
                  </div>
                  <button
                    onClick={() => {
                      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                      showToast('All notifications marked as read');
                    }}
                    className="text-[10px] font-semibold text-neutral-500 hover:text-black cursor-pointer"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl border text-xs space-y-0.5 transition-colors ${
                        n.read ? 'bg-neutral-50 border-neutral-200 text-neutral-500' : 'bg-emerald-50/70 border-emerald-200 text-neutral-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{n.title}</span>
                        <span className="text-[10px] text-neutral-400">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-neutral-600">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* New Message Button */}
          <button
            onClick={() => setIsNewMessageModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#09090b] hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold tracking-wide shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Message</span>
          </button>
        </div>
      </div>

      {/* MAIN 3-COLUMN BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT COLUMN: CONVERSATIONS LIST (Spans 4 cols on LG / 3 cols on XL) */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl p-4 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex flex-col justify-between space-y-3">
          
          <div className="space-y-3">
            {/* Search Bar with Filter Icon */}
            <div className="flex items-center gap-2 relative">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search doctors, care team..." 
                  className="w-full pl-9 pr-7 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Filter Dropdown Button */}
              <div className="relative">
                <button 
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                    filterMode !== 'all'
                      ? 'bg-black text-white border-black'
                      : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
                  }`}
                  title="Filter messages"
                >
                  <Filter className="w-3.5 h-3.5" />
                </button>

                {isFilterMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-neutral-200 py-1.5 z-30 text-xs">
                    <button
                      onClick={() => { setFilterMode('all'); setIsFilterMenuOpen(false); }}
                      className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-neutral-50 ${filterMode === 'all' ? 'font-bold text-black' : 'text-neutral-600'}`}
                    >
                      <span>All Contacts</span>
                      {filterMode === 'all' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => { setFilterMode('unread'); setIsFilterMenuOpen(false); }}
                      className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-neutral-50 ${filterMode === 'unread' ? 'font-bold text-black' : 'text-neutral-600'}`}
                    >
                      <span>Unread Only</span>
                      {filterMode === 'unread' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => { setFilterMode('starred'); setIsFilterMenuOpen(false); }}
                      className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-neutral-50 ${filterMode === 'starred' ? 'font-bold text-black' : 'text-neutral-600'}`}
                    >
                      <span>Starred Only</span>
                      {filterMode === 'starred' && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sub-Tabs: All / Doctors / Care Team */}
            <div className="flex items-center gap-4 text-xs font-semibold text-neutral-500 border-b border-neutral-100 pb-2 pt-1">
              {(['All', 'Doctors', 'Care Team'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMessagesSubTab(tab)}
                  className={`pb-1 transition-all cursor-pointer relative ${
                    messagesSubTab === tab ? 'text-black font-bold' : 'hover:text-black'
                  }`}
                >
                  {tab}
                  {messagesSubTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Chat List */}
            <div className="space-y-1.5 overflow-y-auto max-h-[480px] pr-1 scrollbar-none">
              {filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400 space-y-1">
                  <p>No conversations found</p>
                  <button
                    onClick={() => { setSearchQuery(''); setFilterMode('all'); setMessagesSubTab('All'); setShowArchived(false); }}
                    className="text-neutral-800 font-bold hover:underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = selectedChatId === contact.id;
                  const lastMessage = contact.messages[contact.messages.length - 1];
                  return (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedChatId(contact.id)}
                      className={`p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 border ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-200/80 shadow-xs'
                          : 'border-transparent hover:bg-neutral-50'
                      }`}
                    >
                      <div className="relative shrink-0">
                        {contact.avatarUrl ? (
                          <img
                            src={contact.avatarUrl}
                            alt={contact.name}
                            className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                          />
                        ) : contact.isTeam ? (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                            <Users className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                            <Bot className="w-5 h-5" />
                          </div>
                        )}
                        {contact.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-black truncate flex items-center gap-1">
                            {contact.name}
                            {contact.isStarred && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-600 shrink-0">
                            {lastMessage?.timestamp || 'Active'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-600 truncate mt-0.5 font-normal">
                          {lastMessage?.text || contact.role}
                        </p>
                      </div>

                      {contact.unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 self-center">
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom View Archived Button */}
          <button 
            onClick={() => {
              setShowArchived(!showArchived);
              showToast(showArchived ? 'Showing active conversations' : 'Showing archived conversations');
            }}
            className={`w-full py-2 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2 shadow-xs ${
              showArchived
                ? 'bg-black text-white border-black'
                : 'border-neutral-200 hover:border-black bg-white text-black'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? 'Back to Active Chats' : 'View Archived'}</span>
          </button>
        </div>

        {/* MIDDLE COLUMN: CHAT CANVAS WORKSPACE (Spans 5 cols on LG / 6 cols on XL) */}
        <div className="lg:col-span-5 xl:col-span-6 bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] flex flex-col justify-between h-[660px]">
          
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                {selectedContact.avatarUrl ? (
                  <img 
                    src={selectedContact.avatarUrl} 
                    alt={selectedContact.name} 
                    className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                  />
                ) : selectedContact.isTeam ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <Users className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border border-blue-200">
                    <Bot className="w-5 h-5" />
                  </div>
                )}
                {selectedContact.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-black">{selectedContact.name}</h3>
                  <button 
                    onClick={() => handleToggleStar(selectedContact.id)}
                    title={selectedContact.isStarred ? 'Unstar contact' : 'Star contact'}
                    className="cursor-pointer"
                  >
                    <Star className={`w-3.5 h-3.5 transition-colors ${
                      selectedContact.isStarred ? 'text-amber-500 fill-amber-500' : 'text-neutral-400 hover:text-amber-400'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedContact.isOnline ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                  <span>{selectedContact.isOnline ? 'Online' : selectedContact.lastSeen || 'Away'}</span>
                  <span className="text-neutral-300">•</span>
                  <span className="text-neutral-500 text-[10px]">{selectedContact.role}</span>
                </div>
              </div>
            </div>

            {/* Chat Action Buttons */}
            <div className="flex items-center gap-1 relative">
              <button 
                onClick={() => setIsAudioCallOpen(true)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-600 hover:text-black transition-colors cursor-pointer"
                title="Start Audio Consultation"
              >
                <Phone className="w-4 h-4" />
              </button>

              <button 
                onClick={() => setIsVideoCallOpen(true)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-600 hover:text-black transition-colors cursor-pointer"
                title="Start Video Consultation"
              >
                <Video className="w-4 h-4" />
              </button>

              <div className="relative">
                <button 
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-600 hover:text-black transition-colors cursor-pointer"
                  title="More Chat Options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {moreMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-neutral-200 py-1.5 z-40 text-xs">
                    <button
                      onClick={handleAttachCognitiveReport}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-neutral-50 text-neutral-800 cursor-pointer"
                    >
                      <Brain className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Share Cognitive Report</span>
                    </button>
                    <button
                      onClick={handleAttachMriScan}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-neutral-50 text-neutral-800 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Share Brain MRI Scan</span>
                    </button>
                    <button
                      onClick={handleExportTranscript}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-neutral-50 text-neutral-800 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Export Transcript (.txt)</span>
                    </button>
                    <div className="border-t border-neutral-100 my-1" />
                    <button
                      onClick={() => handleToggleMute(selectedContact.id)}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-neutral-50 text-neutral-800 cursor-pointer"
                    >
                      {selectedContact.isMuted ? <Volume2 className="w-3.5 h-3.5 text-neutral-600" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-600" />}
                      <span>{selectedContact.isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                    </button>
                    <button
                      onClick={() => handleToggleArchive(selectedContact.id)}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-neutral-50 text-neutral-800 cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5 text-neutral-600" />
                      <span>{selectedContact.isArchived ? 'Unarchive Chat' : 'Archive Chat'}</span>
                    </button>
                    <button
                      onClick={() => handleClearChat(selectedContact.id)}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-red-50 text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Clear Chat History</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-none">
            
            {/* Security Banner */}
            <div className="bg-neutral-100/80 border border-neutral-200/70 rounded-xl p-3 flex items-center gap-3 text-xs text-neutral-600">
              <div className="w-7 h-7 rounded-lg bg-neutral-200/80 flex items-center justify-center shrink-0 text-neutral-700">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-[11px] leading-snug">
                Your conversations are end-to-end encrypted.<br />We prioritize medical confidentiality and data protection.
              </p>
            </div>

            {/* Date Divider Pill */}
            <div className="flex items-center justify-center">
              <span className="px-3 py-1 rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-500">
                Today, {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Rendered Messages */}
            {selectedContact.messages.map((message) => {
              const isPatient = message.sender === 'patient';
              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${isPatient ? 'items-end ml-auto' : 'items-start mr-auto'} max-w-[88%] space-y-1 group`}
                >
                  <div className="flex items-start gap-2">
                    {!isPatient && (
                      <div className="shrink-0 mt-0.5">
                        {selectedContact.avatarUrl ? (
                          <img
                            src={selectedContact.avatarUrl}
                            alt={selectedContact.name}
                            className="w-7 h-7 rounded-full object-cover border border-neutral-200"
                          />
                        ) : selectedContact.isTeam ? (
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      {/* Message Bubble */}
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed font-normal shadow-2xs ${
                          isPatient
                            ? 'bg-emerald-50 text-emerald-950 border border-emerald-200/60 rounded-tr-xs'
                            : 'bg-neutral-100 text-black rounded-tl-xs'
                        }`}
                      >
                        <p>{message.text}</p>

                        {/* Attached Card if present */}
                        {message.attachment && (
                          <div className="mt-2.5 p-3 rounded-xl bg-white border border-neutral-200 shadow-2xs space-y-2 text-neutral-900">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-bold text-xs">
                                {message.attachment.type === 'cognitive_report' ? (
                                  <Brain className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Layers className="w-4 h-4 text-blue-600" />
                                )}
                                <span>{message.attachment.title}</span>
                              </div>
                              {message.attachment.score !== undefined && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  {message.attachment.score}/100
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-500">{message.attachment.details}</p>
                            <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-[10px] text-neutral-400">
                              <span>Logged: {message.attachment.date}</span>
                              {onViewCognitiveReport && message.attachment.type === 'cognitive_report' && (
                                <button
                                  type="button"
                                  onClick={onViewCognitiveReport}
                                  className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Open Report</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer: Timestamp, Reactions, Checkmarks */}
                      <div className={`flex items-center gap-2 text-[10px] text-neutral-400 font-medium ${isPatient ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
                        {/* Reaction Pills */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex items-center gap-1">
                            {message.reactions.map((r, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleToggleReaction(message.id, r.emoji)}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] cursor-pointer transition-all ${
                                  r.reactedByMe
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                    : 'bg-white border-neutral-200 text-neutral-600'
                                }`}
                              >
                                <span>{r.emoji}</span>
                                <span>{r.count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Quick Reaction Adder (visible on hover) */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          {['👍', '❤️', '👏'].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(message.id, emoji)}
                              className="hover:scale-125 transition-transform text-xs cursor-pointer"
                              title={`React with ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>

                        <span>{message.timestamp}</span>
                        {isPatient && <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Doctor Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-neutral-500 pl-2 animate-pulse">
                <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-[10px]">
                  Dr
                </div>
                <div className="bg-neutral-100 px-3 py-2 rounded-2xl rounded-tl-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Quick Chips */}
          <div className="pt-2 pb-1 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
            {[
              "How are my MRI scan results looking?",
              "Can you review my cognitive test?",
              "Confirm my next consultation",
              "Any daily memory exercise tips?"
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-medium whitespace-nowrap transition-colors cursor-pointer border border-neutral-200/60"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Bottom Input Field */}
          <div className="pt-2 border-t border-neutral-100 flex items-center gap-2 relative">
            
            {/* Attachment Button & Popover */}
            <div className="relative">
              <button 
                onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isAttachmentMenuOpen ? 'border-black bg-black text-white' : 'border-neutral-200 hover:border-black bg-neutral-50 text-neutral-600'
                }`}
                title="Attach Document or Medical Data"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {isAttachmentMenuOpen && (
                <div className="absolute bottom-12 left-0 w-60 bg-white rounded-2xl shadow-xl border-2 border-black p-2 z-40 space-y-1 animate-in fade-in">
                  <button
                    onClick={handleAttachCognitiveReport}
                    className="w-full p-2.5 rounded-xl hover:bg-neutral-50 text-left text-xs font-semibold text-black flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Brain className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div>Attach Cognitive Report</div>
                      <div className="text-[10px] text-neutral-400 font-normal">Score: 88/100 (Latest)</div>
                    </div>
                  </button>

                  <button
                    onClick={handleAttachMriScan}
                    className="w-full p-2.5 rounded-xl hover:bg-neutral-50 text-left text-xs font-semibold text-black flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-blue-600" />
                    <div>
                      <div>Attach Brain MRI Scan</div>
                      <div className="text-[10px] text-neutral-400 font-normal">Axial T1/T2 preview</div>
                    </div>
                  </button>

                  <label className="w-full p-2.5 rounded-xl hover:bg-neutral-50 text-left text-xs font-semibold text-black flex items-center gap-2.5 transition-colors cursor-pointer">
                    <FileText className="w-4 h-4 text-neutral-600" />
                    <div>
                      <div>Upload PDF / Document</div>
                      <div className="text-[10px] text-neutral-400 font-normal">From local files</div>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleSendMessage(`Uploaded medical document: ${file.name}`);
                          setIsAttachmentMenuOpen(false);
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            <input 
              type="text" 
              placeholder="Type your message to care provider..."
              value={chatInputText}
              onChange={(e) => setChatInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black font-medium transition-colors"
            />

            <button 
              onClick={() => handleSendMessage()}
              disabled={!chatInputText.trim()}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs ${
                chatInputText.trim()
                  ? 'bg-[#09090b] hover:bg-neutral-800 text-white'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
              title="Send Message"
            >
              <Send className="w-4 h-4 -translate-x-0.5" />
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: DOCTOR DETAILS & DUMMY PATIENT QUICK INFO (Spans 3 cols on LG / XL) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] space-y-5 flex flex-col justify-between">
          
          <div className="space-y-5">
            {/* Contact Overview Card */}
            <div className="flex flex-col items-center text-center space-y-2 pt-1">
              <div className="relative">
                {selectedContact.avatarUrl ? (
                  <img 
                    src={selectedContact.avatarUrl} 
                    alt={selectedContact.name} 
                    className="w-20 h-20 rounded-full object-cover border-2 border-neutral-200 shadow-xs"
                  />
                ) : selectedContact.isTeam ? (
                  <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center border-2 border-emerald-200 shadow-xs">
                    <Users className="w-9 h-9" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center border-2 border-blue-200 shadow-xs">
                    <Bot className="w-9 h-9" />
                  </div>
                )}
                {selectedContact.isOnline && (
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center justify-center gap-1 text-base font-bold text-black">
                  <span>{selectedContact.name}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                </div>
                <p className="text-xs text-neutral-500 font-medium">{selectedContact.role}</p>
              </div>

              {/* Rating & Location */}
              <div className="space-y-1 text-xs pt-1">
                <div className="flex items-center justify-center gap-1 font-semibold text-black">
                  <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                  <span>{selectedContact.rating}</span>
                  <span className="text-neutral-400 font-normal">({selectedContact.reviewCount} Reviews)</span>
                </div>

                <div className="flex items-center justify-center gap-1 text-[11px] text-neutral-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">{selectedContact.hospital}</span>
                </div>
              </div>

              {/* 3 Action Icon Buttons */}
              <div className="grid grid-cols-3 gap-2 w-full pt-3">
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl border border-neutral-200 hover:border-black bg-neutral-50/60 hover:bg-white text-[10px] font-bold text-neutral-700 transition-all cursor-pointer"
                  title="View Specialist Profile"
                >
                  <User className="w-4 h-4 text-neutral-600" />
                  <span>Profile</span>
                </button>

                <button 
                  onClick={() => {
                    if (onOpenBookAppointment) {
                      onOpenBookAppointment(selectedContact.name);
                    } else {
                      showToast(`Opening booking for ${selectedContact.name}`);
                    }
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl border border-neutral-200 hover:border-black bg-neutral-50/60 hover:bg-white text-[10px] font-bold text-neutral-700 transition-all cursor-pointer"
                  title="Schedule Consultation"
                >
                  <Calendar className="w-4 h-4 text-neutral-600" />
                  <span>Book Visit</span>
                </button>

                <button 
                  onClick={handleAttachCognitiveReport}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl border border-neutral-200 hover:border-black bg-neutral-50/60 hover:bg-white text-[10px] font-bold text-neutral-700 transition-all cursor-pointer"
                  title="Share Cognitive Report to Chat"
                >
                  <Share2 className="w-4 h-4 text-neutral-600" />
                  <span>Share Report</span>
                </button>
              </div>
            </div>

            {/* Patient Quick Info Card (DUMMY DETAILS AS REQUESTED) */}
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-black">Patient Quick Info</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-mono font-semibold">
                  Sample Data
                </span>
              </div>

              <div className="bg-neutral-50/80 rounded-xl p-3.5 space-y-2.5 text-xs border border-neutral-100">
                <div className="flex items-center gap-2.5 text-neutral-700 font-medium">
                  <User className="w-4 h-4 text-neutral-400 shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-neutral-400 font-normal leading-tight">Patient Identifier</div>
                    <div className="font-bold text-black text-xs">{cleanUserName}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-neutral-700 font-medium">
                  <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-neutral-400 font-normal leading-tight">Age (Sample)</div>
                    <div className="font-bold text-black text-xs">65 Years (Demo)</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-neutral-700 font-medium">
                  <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-neutral-400 font-normal leading-tight">Date of Birth (Sample)</div>
                    <div className="font-bold text-black text-xs">01 Jan 1960 (Sample)</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-neutral-700 font-medium">
                  <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-neutral-400 font-normal leading-tight">Last Consultation</div>
                    <div className="font-bold text-black text-xs">14 Oct 2026</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-neutral-700 font-medium">
                  <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-neutral-400 font-normal leading-tight">Next Scheduled Visit</div>
                    <div className="font-bold text-black text-xs">28 Oct 2026, 11:00 AM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom View Full Profile Button */}
          <button 
            onClick={() => setIsPatientProfileModalOpen(true)}
            className="w-full py-2.5 rounded-xl border border-neutral-200 hover:border-black text-xs font-bold text-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-white shadow-xs"
          >
            <span>View Demo Patient Record</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>

      {/* ==================== AUDIO CONSULTATION MODAL ==================== */}
      {isAudioCallOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-black shadow-2xl w-full max-w-md p-6 space-y-6 text-center animate-in zoom-in-95">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                Telehealth Audio Call • Connected
              </span>
              <h2 className="text-xl font-bold text-black">{selectedContact.name}</h2>
              <p className="text-xs text-neutral-500">{selectedContact.role} • {selectedContact.hospital}</p>
            </div>

            <div className="py-6 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                {selectedContact.avatarUrl ? (
                  <img
                    src={selectedContact.avatarUrl}
                    alt={selectedContact.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-emerald-400 shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center border-4 border-emerald-400">
                    <User className="w-12 h-12" />
                  </div>
                )}
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-mono">
                  {formatCallTime(callDuration)}
                </span>
              </div>

              {/* Animated Audio Waveform */}
              <div className="flex items-center gap-1.5 h-8">
                {[12, 24, 18, 30, 14, 28, 20, 16, 26, 14].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}px` }}
                    className="w-1 bg-emerald-500 rounded-full animate-pulse"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  showToast(isMuted ? 'Microphone unmuted' : 'Microphone muted');
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
                  isMuted ? 'bg-red-100 text-red-600 border-red-300' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-neutral-300'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={() => {
                  setIsSpeakerOn(!isSpeakerOn);
                  showToast(isSpeakerOn ? 'Speaker disabled' : 'Speaker enabled');
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
                  !isSpeakerOn ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-neutral-300'
                }`}
                title={isSpeakerOn ? 'Disable Speaker' : 'Enable Speaker'}
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              <button
                onClick={() => {
                  setIsAudioCallOpen(false);
                  showToast('Call ended');
                }}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer"
                title="End Consultation"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== VIDEO CONSULTATION MODAL ==================== */}
      {isVideoCallOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#09090b] rounded-3xl border-2 border-white/20 shadow-2xl w-full max-w-2xl p-4 sm:p-6 space-y-4 text-white animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold">Telehealth Video Session</span>
                <span className="text-neutral-400 text-xs">• {formatCallTime(callDuration)}</span>
              </div>
              <span className="text-xs text-neutral-300">{selectedContact.name}</span>
            </div>

            {/* Video Canvas Container */}
            <div className="relative w-full h-80 bg-neutral-900 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
              {/* Doctor Video Simulation */}
              <div className="text-center space-y-3">
                {selectedContact.avatarUrl ? (
                  <img
                    src={selectedContact.avatarUrl}
                    alt={selectedContact.name}
                    className="w-28 h-28 rounded-full object-cover border-4 border-emerald-500 shadow-xl mx-auto"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-emerald-800 text-white flex items-center justify-center border-4 border-emerald-500 mx-auto">
                    <User className="w-14 h-14" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-white text-base">{selectedContact.name}</h3>
                  <p className="text-xs text-neutral-400">Doctor feed active • 1080p HD</p>
                </div>
              </div>

              {/* Patient Self Video Pip */}
              <div className="absolute bottom-3 right-3 w-32 h-24 rounded-xl bg-neutral-800 border-2 border-white/30 overflow-hidden shadow-lg flex items-center justify-center text-center p-2">
                {isVideoMuted ? (
                  <div className="text-[10px] text-neutral-400 space-y-1">
                    <VideoOff className="w-4 h-4 mx-auto text-red-400" />
                    <span>Camera Off</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-white space-y-1">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 font-bold mx-auto flex items-center justify-center text-xs">
                      DP
                    </div>
                    <span>Demo Patient</span>
                  </div>
                )}
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  showToast(isMuted ? 'Microphone unmuted' : 'Microphone muted');
                }}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
                  isMuted ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
                }`}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={() => {
                  setIsVideoMuted(!isVideoMuted);
                  showToast(isVideoMuted ? 'Camera turned on' : 'Camera turned off');
                }}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
                  isVideoMuted ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
                }`}
                title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              <button
                onClick={() => {
                  setIsVideoCallOpen(false);
                  showToast('Video consultation ended');
                }}
                className="w-13 h-13 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer"
                title="End Consultation"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== START NEW MESSAGE MODAL ==================== */}
      {isNewMessageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-black shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-black" />
                <h3 className="text-lg font-bold text-black">Compose New Message</h3>
              </div>
              <button
                onClick={() => setIsNewMessageModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStartNewMessageSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-black">Select Recipient</label>
                <select
                  value={newMsgRecipientId}
                  onChange={(e) => setNewMsgRecipientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold text-black focus:outline-none focus:border-black"
                >
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.role} ({c.hospital})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-black">Consultation Topic</label>
                <select
                  value={newMsgSubject}
                  onChange={(e) => setNewMsgSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-medium text-black focus:outline-none focus:border-black"
                >
                  <option value="General Consultation">General Consultation</option>
                  <option value="Review MRI Results">Review MRI Volumetric Results</option>
                  <option value="Cognitive Assessment Follow-up">Cognitive Assessment Follow-up</option>
                  <option value="Medication & Symptoms">Medication & Care Questions</option>
                  <option value="Appointment Rescheduling">Appointment Rescheduling</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-black">Message Details</label>
                <textarea
                  rows={4}
                  value={newMsgContent}
                  onChange={(e) => setNewMsgContent(e.target.value)}
                  placeholder="Describe your inquiry or question for your healthcare provider..."
                  className="w-full p-3 rounded-xl border border-neutral-200 bg-neutral-50 text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewMessageModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:text-black hover:border-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newMsgContent.trim()}
                  className="px-5 py-2 rounded-xl bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DOCTOR PROFILE MODAL ==================== */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-black shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-lg font-bold text-black">Provider Clinical Profile</h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {selectedContact.avatarUrl ? (
                <img
                  src={selectedContact.avatarUrl}
                  alt={selectedContact.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-neutral-200 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <User className="w-10 h-10" />
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-base text-black">
                  <span>{selectedContact.name}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                </div>
                <p className="text-xs text-neutral-500 font-medium">{selectedContact.role}</p>
                <p className="text-xs text-neutral-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  {selectedContact.hospital}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-black">Clinical Biography</h4>
              <p className="text-neutral-600 leading-relaxed bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                {selectedContact.bio}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-black">Credentials & Affiliations</h4>
              <ul className="space-y-1">
                {selectedContact.credentials.map((c, i) => (
                  <li key={i} className="flex items-center gap-2 text-neutral-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-black">Languages Spoken</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedContact.languages.map((l, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 font-medium">
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100">
              <button
                onClick={() => {
                  setIsProfileModalOpen(false);
                  if (onOpenBookAppointment) onOpenBookAppointment(selectedContact.name);
                }}
                className="w-full py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer"
              >
                Schedule Consultation with {selectedContact.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DEMO PATIENT PROFILE RECORD MODAL ==================== */}
      {isPatientProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-black shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-black">Patient Record Details</h3>
                <p className="text-xs text-neutral-500">Dummy / Demo information for evaluation</p>
              </div>
              <button
                onClick={() => setIsPatientProfileModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500">Patient Identifier</span>
                <span className="font-bold text-black">{cleanUserName}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500">Age (Demo Placeholder)</span>
                <span className="font-bold text-black">65 Years (Sample)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500">Date of Birth (Demo)</span>
                <span className="font-bold text-black">01 Jan 1960 (Sample)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500">Patient ID Code</span>
                <span className="font-mono font-bold text-black">DX-4091-SAMPLE</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-neutral-500">Medical Record Type</span>
                <span className="font-bold text-emerald-700">Prototype Health Record</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 italic text-center">
              Notice: All personal identifiers on this evaluation instance are dummy/sample data to protect user privacy.
            </p>

            <button
              onClick={() => setIsPatientProfileModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-black text-white text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
