import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle, Circle, Heart, ShieldAlert, Sparkles, RefreshCw, Coffee, Sun, Footprints, HeartPulse } from 'lucide-react';
import { careSpaceApi } from '../../services/apiClient';

interface RoutineItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  scheduled_time: string;
  is_completed: boolean;
  difficulty_level?: string;
  icon_hint?: string;
}

interface FamiliarPerson {
  id: string;
  name_or_title: string;
  relationship_or_context: string;
  description: string;
  phone?: string;
  avatar_or_photo_url?: string;
}

interface ComfortMemory {
  id: string;
  name_or_title: string;
  relationship_or_context?: string;
  description: string;
  avatar_or_photo_url?: string;
}

interface PatientHomeData {
  patient_name: string;
  greeting: string;
  date_display: string;
  today_routine: RoutineItem[];
  familiar_people: FamiliarPerson[];
  comfort_memories: ComfortMemory[];
  primary_caregiver_contact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  emergency_help?: {
    label: string;
    primary_contact_name: string;
    phone: string;
    home_address: string;
  };
}

export const PatientCareHome: React.FC = () => {
  const [data, setData] = useState<PatientHomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchView = async () => {
    try {
      setLoading(true);
      const resp = await careSpaceApi.getPatientView();
      if (resp.success && resp.data) {
        setData(resp.data);
      } else {
        setError(resp.message || 'Unable to load today’s routine.');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading care space.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchView();
  }, []);

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      const resp = await careSpaceApi.toggleRoutineItem(id);
      if (resp.success) {
        setData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            today_routine: prev.today_routine.map((item) =>
              item.id === id ? { ...item, is_completed: !item.is_completed } : item
            ),
          };
        });
      }
    } catch (err) {
      console.error('Failed to toggle routine:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const getIcon = (hint?: string) => {
    switch (hint) {
      case 'cup':
        return <Coffee className="w-5 h-5 text-amber-600" />;
      case 'sun':
        return <Sun className="w-5 h-5 text-yellow-600" />;
      case 'walk':
        return <Footprints className="w-5 h-5 text-emerald-600" />;
      default:
        return <Heart className="w-5 h-5 text-rose-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-neutral-600">
        <RefreshCw className="w-8 h-8 animate-spin mb-3 text-blue-600" />
        <p className="text-base font-medium">Setting up your day...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-center max-w-lg mx-auto">
        <p className="font-semibold mb-2">{error || 'Something went wrong.'}</p>
        <button
          onClick={fetchView}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const completedCount = data.today_routine.filter((r) => r.is_completed).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* 1. Welcoming Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{data.date_display}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {data.greeting}, {data.patient_name}
            </h1>
            <p className="text-blue-100 text-sm mt-1">Here is your gentle guide for today.</p>
          </div>

          {/* Quick Progress Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl text-center min-w-[130px]">
            <span className="text-2xl font-black">{completedCount}/{data.today_routine.length}</span>
            <span className="block text-xs text-blue-100">Tasks Completed</span>
          </div>
        </div>
      </div>

      {/* 2. One-Touch Emergency & Caregiver Assistance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.primary_caregiver_contact && (
          <a
            href={`tel:${data.primary_caregiver_contact.phone}`}
            className="flex items-center gap-4 p-5 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 rounded-2xl transition-all shadow-sm group"
          >
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Tap to Call</span>
              <h3 className="text-base font-bold text-neutral-900">{data.primary_caregiver_contact.name}</h3>
              <p className="text-xs text-neutral-600">{data.primary_caregiver_contact.relationship} &bull; {data.primary_caregiver_contact.phone}</p>
            </div>
          </a>
        )}

        {data.emergency_help && (
          <div className="flex items-center gap-4 p-5 bg-rose-50 border-2 border-rose-300 rounded-2xl shadow-sm">
            <div className="w-12 h-12 bg-rose-600 text-white rounded-full flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Emergency Help</span>
              <p className="text-xs font-semibold text-neutral-800">{data.emergency_help.home_address}</p>
              <a
                href={`tel:${data.emergency_help.phone}`}
                className="inline-block mt-1 text-xs font-bold text-rose-700 hover:underline"
              >
                Call Helpline: {data.emergency_help.phone}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 3. Today's Gentle Routine */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Today's Routine</h2>
            <p className="text-xs text-neutral-500">Tap the checkmark when you complete an activity</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {data.today_routine.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggle(item.id)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                item.is_completed
                  ? 'bg-neutral-50 border-neutral-200 opacity-60'
                  : 'bg-white hover:bg-blue-50/50 border-neutral-300 hover:border-blue-400 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-neutral-100 rounded-xl shrink-0">
                  {getIcon(item.icon_hint)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {item.scheduled_time}
                    </span>
                    <h3 className={`text-sm sm:text-base font-bold ${item.is_completed ? 'line-through text-neutral-500' : 'text-neutral-900'}`}>
                      {item.title}
                    </h3>
                  </div>
                  {item.description && (
                    <p className="text-xs text-neutral-600 mt-1">{item.description}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={togglingId === item.id}
                className="p-2 text-neutral-400 hover:text-blue-600 transition-colors shrink-0"
              >
                {item.is_completed ? (
                  <CheckCircle className="w-7 h-7 text-emerald-600 fill-emerald-100" />
                ) : (
                  <Circle className="w-7 h-7 text-neutral-300 hover:text-blue-500" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Familiar People (Faces you know) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Important People in Your Life</h2>
          <p className="text-xs text-neutral-500">Family members and caregivers always here for you</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {data.familiar_people.map((person) => (
            <div
              key={person.id}
              className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={person.avatar_or_photo_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150'}
                    alt={person.name_or_title}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">{person.name_or_title}</h3>
                    <span className="text-xs text-blue-700 font-semibold">{person.relationship_or_context}</span>
                  </div>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed mb-4">{person.description}</p>
              </div>

              {person.phone && (
                <a
                  href={`tel:${person.phone}`}
                  className="w-full py-2 px-3 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-800 flex items-center justify-center gap-2 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Call {person.name_or_title.split(' ')[0]}</span>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Cherished Memories Album */}
      {data.comfort_memories.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Cherished Memories</h2>
            <p className="text-xs text-neutral-500">Familiar moments and peaceful places</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {data.comfort_memories.map((mem) => (
              <div
                key={mem.id}
                className="p-4 rounded-2xl border border-neutral-200 bg-amber-50/40 flex gap-4 items-start"
              >
                {mem.avatar_or_photo_url && (
                  <img
                    src={mem.avatar_or_photo_url}
                    alt={mem.name_or_title}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-amber-200 shadow-sm"
                  />
                )}
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">{mem.name_or_title}</h3>
                  {mem.relationship_or_context && (
                    <span className="text-[11px] text-amber-800 font-semibold">{mem.relationship_or_context}</span>
                  )}
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{mem.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
