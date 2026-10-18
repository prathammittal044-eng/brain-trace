import React, { useState, useEffect } from 'react';
import { Users, Calendar, BookOpen, Heart, Shield, CheckCircle2, Lock, Plus, Activity, ArrowLeft } from 'lucide-react';
import { careSpaceApi } from '../../services/apiClient';

interface FamilyDashboardViewProps {
  onBackToHome?: () => void;
  onLogout?: () => void;
  userName?: string;
}

export const FamilyDashboardView: React.FC<FamilyDashboardViewProps> = ({ onBackToHome, onLogout, userName }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add memory modal
  const [showAddMemModal, setShowAddMemModal] = useState(false);
  const [memTitle, setMemTitle] = useState('');
  const [memRelation, setMemRelation] = useState('');
  const [memDesc, setMemDesc] = useState('');
  const [memPhoto, setMemPhoto] = useState('');

  const fetchFamilyView = async () => {
    try {
      setLoading(true);
      const resp = await careSpaceApi.getFamilyView();
      if (resp.success && resp.data) {
        setData(resp.data);
      } else {
        setError(resp.message || 'Could not load family portal.');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading care circle.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyView();
  }, []);

  const handleToggleTask = async (id: string) => {
    try {
      const resp = await careSpaceApi.toggleRoutineItem(id);
      if (resp.success) {
        fetchFamilyView();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memTitle) return;
    try {
      await careSpaceApi.addMemoryItem({
        item_type: 'life_memory',
        name_or_title: memTitle,
        relationship_or_context: memRelation,
        description: memDesc,
        avatar_or_photo_url: memPhoto || undefined,
        is_private_to_patient: false,
      });
      setShowAddMemModal(false);
      setMemTitle('');
      setMemRelation('');
      setMemDesc('');
      setMemPhoto('');
      fetchFamilyView();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-neutral-500">
        <Activity className="w-8 h-8 animate-spin mb-3 text-purple-600" />
        <p className="font-semibold text-sm">Opening Family Care Space...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl border border-red-200 text-center max-w-md w-full shadow-lg">
          <h3 className="text-red-700 font-bold mb-2">Notice</h3>
          <p className="text-xs text-neutral-600 mb-4">{error || 'Could not access family portal.'}</p>
          <button
            onClick={fetchFamilyView}
            className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const perms = data.my_permissions || {};

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#09090b] font-sans antialiased p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="p-2 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded-md">
                Family Portal &bull; {data.care_space_name}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900">
                Welcome, {userName || 'Family Member'}
              </h1>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl"
            >
              Log Out
            </button>
          )}
        </div>

        {/* Permissions Scope Banner */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-neutral-600">
            <Lock className="w-4 h-4 text-purple-600" />
            <span>Scoped Access: <b>{data.my_role}</b></span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full font-semibold ${perms.can_manage_appointments ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
              Appointments: {perms.can_manage_appointments ? 'Managed' : 'Protected'}
            </span>
            <span className={`px-2 py-0.5 rounded-full font-semibold ${perms.can_edit_memory_book ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
              Memory Book: {perms.can_edit_memory_book ? 'Contributor' : 'Viewer'}
            </span>
          </div>
        </div>

        {/* Grid Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Assigned Family Tasks */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Your Assigned Tasks</h2>
                <p className="text-xs text-neutral-500">Tasks coordinated for {data.patient_name}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {data.assigned_tasks && data.assigned_tasks.length > 0 ? (
                data.assigned_tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200"
                  >
                    <div>
                      <h4 className={`text-sm font-bold ${task.is_completed ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
                        {task.title}
                      </h4>
                      <span className="text-xs text-neutral-500">{task.scheduled_time}</span>
                    </div>
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold ${
                        task.is_completed ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {task.is_completed ? 'Done ✓' : 'Mark Done'}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-400 italic py-4 text-center">No tasks assigned to your role today.</p>
              )}
            </div>
          </div>

          {/* 2. Upcoming Appointments (Scoped) */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900">Appointments</h2>
              <p className="text-xs text-neutral-500">Clinical schedule</p>
            </div>

            {perms.can_manage_appointments ? (
              <div className="space-y-2.5">
                {data.upcoming_appointments && data.upcoming_appointments.length > 0 ? (
                  data.upcoming_appointments.map((apt: any) => (
                    <div key={apt.id} className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs">
                      <div className="font-bold text-neutral-900">{apt.doctor}</div>
                      <div className="text-neutral-500">{apt.date} at {apt.time} ({apt.type})</div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 italic py-4 text-center">No upcoming appointments scheduled.</p>
                )}
              </div>
            ) : (
              <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 text-center space-y-1">
                <Lock className="w-5 h-5 text-neutral-400 mx-auto mb-1" />
                <h4 className="text-xs font-bold text-neutral-700">Managed by Primary Caregiver</h4>
                <p className="text-[11px] text-neutral-400">Appointment scheduling is restricted by Care Circle policy.</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Memory Book (Scoped) */}
        {perms.can_view_memory_book && (
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Family Memory Book</h2>
                <p className="text-xs text-neutral-500">Shared memories, family photos, and familiar faces</p>
              </div>
              {perms.can_edit_memory_book && (
                <button
                  onClick={() => setShowAddMemModal(true)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Memory</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
              {data.memory_book?.map((mem: any) => (
                <div key={mem.id} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                  {mem.avatar_or_photo_url && (
                    <img
                      src={mem.avatar_or_photo_url}
                      alt={mem.name_or_title}
                      className="w-full h-32 object-cover rounded-xl border border-neutral-200"
                    />
                  )}
                  <h4 className="text-sm font-bold text-neutral-900">{mem.name_or_title}</h4>
                  {mem.relationship_or_context && (
                    <span className="text-[11px] font-semibold text-purple-700 block">{mem.relationship_or_context}</span>
                  )}
                  <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed">{mem.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Safety Emergency Contacts */}
        {data.safety_contacts && data.safety_contacts.length > 0 && (
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-bold text-neutral-900">Safety & Emergency Directory</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.safety_contacts.map((c: any, idx: number) => (
                <a
                  key={idx}
                  href={`tel:${c.phone}`}
                  className="p-3 bg-neutral-50 hover:bg-rose-50/50 rounded-2xl border border-neutral-200 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">{c.name}</h4>
                    <span className="text-[11px] text-neutral-500">{c.role}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-700 mt-2 block">{c.phone}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Memory Modal */}
      {showAddMemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-neutral-900">Contribute to Memory Book</h3>
            <form onSubmit={handleAddMemory} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-700">Memory Title</label>
                <input
                  type="text"
                  value={memTitle}
                  onChange={(e) => setMemTitle(e.target.value)}
                  placeholder="e.g. Family Trip to Shimla"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-700">Relationship or Context</label>
                <input
                  type="text"
                  value={memRelation}
                  onChange={(e) => setMemRelation(e.target.value)}
                  placeholder="Summer vacation 1998"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-700">Photo URL (optional)</label>
                <input
                  type="url"
                  value={memPhoto}
                  onChange={(e) => setMemPhoto(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-700">Story / Narrative</label>
                <textarea
                  value={memDesc}
                  onChange={(e) => setMemDesc(e.target.value)}
                  placeholder="We took the toy train through the hills..."
                  className="w-full px-3 py-2 border rounded-lg text-sm h-20"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemModal(false)}
                  className="flex-1 py-2 border rounded-lg text-sm text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700"
                >
                  Save Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
