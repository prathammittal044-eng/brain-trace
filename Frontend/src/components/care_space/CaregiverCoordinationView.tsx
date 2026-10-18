import React, { useState, useEffect } from 'react';
import {
  Users, Calendar, Clock, Plus, Shield, BookOpen, Activity,
  CheckCircle2, AlertTriangle, Send, History, Heart, FileText, Check
} from 'lucide-react';
import { careSpaceApi } from '../../services/apiClient';

export const CaregiverCoordinationView: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Add Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<'medication' | 'activity' | 'meal' | 'reminder'>('activity');
  const [taskTime, setTaskTime] = useState('09:00 AM');
  const [taskRecurrence, setTaskRecurrence] = useState('daily');

  // Add Care Log form state
  const [logType, setLogType] = useState<'vitals' | 'mood' | 'meal' | 'hydration' | 'observation'>('vitals');
  const [logTitle, setLogTitle] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [vitalSystolic, setVitalSystolic] = useState('120');
  const [vitalDiastolic, setVitalDiastolic] = useState('80');

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'family_member' | 'trusted_contact'>('family_member');
  const [inviteLabel, setInviteLabel] = useState('Son');
  const [generatedCode, setGeneratedCode] = useState('');

  // Safety form state
  const [safeZones, setSafeZones] = useState('');
  const [wanderingRisk, setWanderingRisk] = useState('moderate');
  const [calmingStrat, setCalmingStrat] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const resp = await careSpaceApi.getCaregiverView();
      if (resp.success && resp.data) {
        setData(resp.data);
        if (resp.data.safety_summary) {
          setSafeZones((resp.data.safety_summary.safe_zones || []).join(', '));
          setWanderingRisk(resp.data.safety_summary.wandering_risk_level || 'moderate');
          setCalmingStrat((resp.data.safety_summary.calming_strategies || []).join('\n'));
        }
      } else {
        setError(resp.message || 'Failed to load caregiver dashboard.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to care space.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleRoutine = async (id: string) => {
    try {
      const resp = await careSpaceApi.toggleRoutineItem(id);
      if (resp.success) {
        fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    try {
      await careSpaceApi.addRoutineItem({
        title: taskTitle,
        category: taskCategory,
        scheduled_time: taskTime,
        recurrence: taskRecurrence,
      });
      setShowAddTaskModal(false);
      setTaskTitle('');
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTitle) return;
    try {
      await careSpaceApi.addCareLog({
        log_type: logType,
        title: logTitle,
        details: logType === 'vitals' ? { systolic: vitalSystolic, diastolic: vitalDiastolic } : {},
        notes: logNotes,
      });
      setShowAddLogModal(false);
      setLogTitle('');
      setLogNotes('');
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      const resp = await careSpaceApi.inviteMember({
        email: inviteEmail,
        role: inviteRole,
        relationship_label: inviteLabel,
      });
      if (resp.success && resp.data) {
        setGeneratedCode(resp.data.invite_code);
        fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSafety = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await careSpaceApi.updateSafetyPlan({
        safe_zones: safeZones.split(',').map((s) => s.trim()).filter(Boolean),
        wandering_risk_level: wanderingRisk,
        calming_strategies: calmingStrat.split('\n').map((s) => s.trim()).filter(Boolean),
      });
      setShowSafetyModal(false);
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const openAuditTrail = async () => {
    try {
      const resp = await careSpaceApi.getAuditLogs();
      if (resp.success) {
        setAuditLogs(resp.data || []);
        setShowAuditModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-neutral-500">
        <Activity className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
        <p className="font-medium text-sm">Loading Care Coordination Dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-center max-w-lg mx-auto">
        <p className="font-semibold mb-2">{error || 'Could not load care coordination.'}</p>
        <button onClick={fetchDashboard} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
              {data.care_space_name}
            </span>
            <span className="text-xs font-semibold text-neutral-500">Patient: {data.patient_name} ({data.patient_code})</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Care Coordination Hub</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openAuditTrail}
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <History className="w-4 h-4" />
            <span>Audit Trail</span>
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Users className="w-4 h-4" />
            <span>Invite Family</span>
          </button>
          <button
            onClick={() => setShowSafetyModal(true)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Shield className="w-4 h-4" />
            <span>Safety Plan</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Routine</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-neutral-900">
            {data.completed_tasks_count} / {data.completed_tasks_count + data.pending_tasks_count}
          </div>
          <span className="text-xs text-neutral-500">Tasks completed today</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Wandering Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 capitalize">
            {data.safety_summary?.wandering_risk_level || 'Moderate'}
          </div>
          <span className="text-xs text-neutral-500">Active geofence monitoring</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Care Circle</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-neutral-900">
            {data.family_members?.length || 1} Members
          </div>
          <span className="text-xs text-neutral-500">Authorized participants</span>
        </div>
      </div>

      {/* 3. Main Split Grid: Routine & Care Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Routine Management */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Daily Routine & Tasks</h2>
              <p className="text-xs text-neutral-500">Agreed daily routine for the patient</p>
            </div>
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {data.daily_routine_overview?.map((task: any) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3.5 bg-neutral-50 hover:bg-neutral-100/80 rounded-2xl border border-neutral-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleRoutine(task.id)}
                    className={`p-1 rounded-lg border ${
                      task.is_completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-neutral-300 text-transparent hover:border-neutral-400'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <div>
                    <h4 className={`text-sm font-bold ${task.is_completed ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
                      {task.title}
                    </h4>
                    <span className="text-xs text-neutral-500">{task.scheduled_time} &bull; {task.category}</span>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-neutral-600 bg-white px-2 py-1 rounded-lg border border-neutral-200">
                  {task.difficulty_level || 'Easy'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Care Activity Logs */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Care Activity Logs</h2>
              <p className="text-xs text-neutral-500">Vitals, mood, meals, and observations</p>
            </div>
            <button
              onClick={() => setShowAddLogModal(true)}
              className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Record Log</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {data.recent_care_logs?.map((log: any) => (
              <div
                key={log.id}
                className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                      {log.log_type}
                    </span>
                    <h4 className="text-xs font-bold text-neutral-900">{log.title}</h4>
                  </div>
                  <span className="text-[11px] text-neutral-400">{log.created_at?.slice(0, 10)}</span>
                </div>

                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="flex gap-2 text-xs text-neutral-600 font-mono">
                    {Object.entries(log.details).map(([k, v]: any) => (
                      <span key={k} className="bg-white px-2 py-0.5 rounded border border-neutral-200">
                        {k}: <b>{v}</b>
                      </span>
                    ))}
                  </div>
                )}

                {log.notes && (
                  <p className="text-xs text-neutral-600 italic">"{log.notes}"</p>
                )}
                <span className="text-[10px] text-neutral-400 block">Logged by {log.author_name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Educational Resources & Support */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Caregiver Education & Self-Care</h2>
          <p className="text-xs text-neutral-500">Clinically vetted tips for dementia caregiving and stress relief</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.curated_tips?.map((tip: any) => (
            <div
              key={tip.id}
              className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 flex flex-col justify-between hover:border-blue-300 transition-colors"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  {tip.category} &bull; {tip.readTime}
                </span>
                <h4 className="text-sm font-bold text-neutral-900 mt-2 mb-1">{tip.title}</h4>
                <p className="text-xs text-neutral-600 line-clamp-2">{tip.summary}</p>
              </div>

              <button
                onClick={() => { setSelectedArticle(tip); setShowEducationModal(true); }}
                className="mt-3 text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <span>Read Guide</span>
                <BookOpen className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-neutral-900">Add Daily Routine Item</h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-700">Task Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Morning Physiotherapy"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-700">Category</label>
                <select
                  value={taskCategory}
                  onChange={(e: any) => setTaskCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="activity">Activity / Exercise</option>
                  <option value="medication">Medication</option>
                  <option value="meal">Meal / Hydration</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-700">Scheduled Time</label>
                <input
                  type="text"
                  value={taskTime}
                  onChange={(e) => setTaskTime(e.target.value)}
                  placeholder="10:00 AM"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="flex-1 py-2 border rounded-lg text-sm text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Care Log Modal */}
      {showAddLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-neutral-900">Record Care Observation</h3>
            <form onSubmit={handleCreateLog} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-700">Type</label>
                <select
                  value={logType}
                  onChange={(e: any) => setLogType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="vitals">Vitals (BP, Pulse)</option>
                  <option value="mood">Mood / Engagement</option>
                  <option value="meal">Meal / Hydration</option>
                  <option value="observation">Observation / Sundowning</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-700">Title</label>
                <input
                  type="text"
                  value={logTitle}
                  onChange={(e) => setLogTitle(e.target.value)}
                  placeholder="e.g. Afternoon BP check"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              {logType === 'vitals' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-neutral-700">Systolic</label>
                    <input
                      type="number"
                      value={vitalSystolic}
                      onChange={(e) => setVitalSystolic(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-700">Diastolic</label>
                    <input
                      type="number"
                      value={vitalDiastolic}
                      onChange={(e) => setVitalDiastolic(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-neutral-700">Notes / Details</label>
                <textarea
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="Patient was calm, resting comfortably."
                  className="w-full px-3 py-2 border rounded-lg text-sm h-20"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="flex-1 py-2 border rounded-lg text-sm text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-neutral-900">Invite Family Member</h3>
            {generatedCode ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900">Invitation Generated!</h4>
                <p className="text-xs text-neutral-600">Share this code with your family member:</p>
                <div className="font-mono text-lg font-black tracking-widest text-emerald-800 bg-white p-2 rounded-lg border border-emerald-300 select-all">
                  {generatedCode}
                </div>
                <button
                  onClick={() => { setGeneratedCode(''); setShowInviteModal(false); }}
                  className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="family@demenx.ai"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700">Relationship Label</label>
                  <input
                    type="text"
                    value={inviteLabel}
                    onChange={(e) => setInviteLabel(e.target.value)}
                    placeholder="e.g. Eldest Son, Daughter, Sister"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-2 border rounded-lg text-sm text-neutral-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-neutral-900 text-white rounded-lg text-sm font-semibold hover:bg-black"
                  >
                    Generate Invite Code
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Safety Plan Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-neutral-900">Update Safety & Wandering Plan</h3>
            <form onSubmit={handleSaveSafety} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-700">Wandering Risk Level</label>
                <select
                  value={wanderingRisk}
                  onChange={(e) => setWanderingRisk(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="low">Low (Stays inside with supervision)</option>
                  <option value="moderate">Moderate (May pace toward front exit in evening)</option>
                  <option value="high">High (High wandering risk, alert sensors active)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-700">Safe Zones (comma-separated)</label>
                <input
                  type="text"
                  value={safeZones}
                  onChange={(e) => setSafeZones(e.target.value)}
                  placeholder="Home & Garden, Green Park Hall"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-700">Calming Strategies (one per line)</label>
                <textarea
                  value={calmingStrat}
                  onChange={(e) => setCalmingStrat(e.target.value)}
                  placeholder="Play 1970s acoustic music&#10;Show Shimla photo album"
                  className="w-full px-3 py-2 border rounded-lg text-sm h-24"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSafetyModal(false)}
                  className="flex-1 py-2 border rounded-lg text-sm text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700"
                >
                  Update Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Logs Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900">Care Space Audit Trail</h3>
              <button onClick={() => setShowAuditModal(false)} className="text-xs text-neutral-400 hover:text-black">
                Close
              </button>
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {auditLogs.map((log: any) => (
                <div key={log.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
                  <div className="flex justify-between font-bold text-neutral-800">
                    <span>{log.action}</span>
                    <span className="text-neutral-400 font-normal">{log.created_at}</span>
                  </div>
                  <span className="text-neutral-500">By: {log.actor_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
