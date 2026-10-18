import React, { useState } from 'react';
import { Users, KeyRound, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { careSpaceApi } from '../../services/apiClient';

interface CareSpaceSetupModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

export const CareSpaceSetupModal: React.FC<CareSpaceSetupModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [assistanceLevel, setAssistanceLevel] = useState<'independent' | 'guided' | 'assisted'>('guided');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a Care Circle name.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const resp = await careSpaceApi.createSpace({
        name: name.trim(),
        assistance_level: assistanceLevel,
      });
      if (resp.success) {
        setSuccessMsg('Care Space created successfully!');
        setTimeout(() => {
          onSuccess();
        }, 800);
      } else {
        setError(resp.message || 'Failed to create Care Space.');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating Care Space.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Please enter your invitation code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const resp = await careSpaceApi.acceptInvitation(inviteCode.trim().toUpperCase());
      if (resp.success) {
        setSuccessMsg('Successfully joined the Care Space!');
        setTimeout(() => {
          onSuccess();
        }, 800);
      } else {
        setError(resp.message || 'Invalid or expired invitation code.');
      }
    } catch (err: any) {
      setError(err.message || 'Error joining Care Space.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl text-blue-700">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Connected Care Space</h2>
            <p className="text-xs text-neutral-500">Connect patient, family, and caregivers in one circle</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-neutral-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setTab('create'); setError(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === 'create' ? 'bg-white shadow text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Create New Circle
          </button>
          <button
            type="button"
            onClick={() => { setTab('join'); setError(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === 'join' ? 'bg-white shadow text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Join with Code
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Care Circle Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sharma Family Circle"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Support / Assistance Level</label>
              <select
                value={assistanceLevel}
                onChange={(e) => setAssistanceLevel(e.target.value as any)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="independent">Independent (Self-navigating with gentle reminders)</option>
                <option value="guided">Guided (Routine assistance & family reminders)</option>
                <option value="assisted">Assisted (Comprehensive daily support & monitoring)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{loading ? 'Creating...' : 'Create Care Space'}</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Invitation Code</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="e.g. CARE-4F8A9B"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm uppercase tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-neutral-400 mt-1">Ask the primary caregiver or patient for an invitation code.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-neutral-900 hover:bg-black text-white font-semibold rounded-lg text-sm shadow transition-colors flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>{loading ? 'Joining...' : 'Join Circle'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
