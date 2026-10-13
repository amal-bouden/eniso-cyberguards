'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CommandConsoleOverlay from '@/components/CommandConsoleOverlay';
import { KeyRound, Plus, Trash2, Edit3, Eye, EyeOff, ShieldCheck, UserCheck, Ticket, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert, Upload, FileJson, X as XIcon } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  category: string;
  description: string;
  points: number;
  hint?: string | null;
  instanceUrl?: string | null;
  isPerUserInstance?: boolean;
  isDraft: boolean;
  solveCount: number;
}

interface InviteCode {
  id: string;
  code: string;
  maxUses: number;
  uses: number;
  expiresAt?: string | null;
  _count?: { users: number };
}

interface UserRecord {
  id: string;
  username: string;
  email: string;
  role: 'MEMBER' | 'ADMIN';
  createdAt: string;
  inviteCode?: { code: string } | null;
  _count?: { solves: number };
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'challenges' | 'invites' | 'users' | 'setup' | 'import'>('challenges');

  // --- Import Challenges state ---
  const [importDragging, setImportDragging] = useState(false);
  const [importChallenges, setImportChallenges] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; results: any[] } | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(false);

  // Data states
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Challenge Modal/Form state
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [chTitle, setChTitle] = useState('');
  const [chCategory, setChCategory] = useState('Web');
  const [chDescription, setChDescription] = useState('');
  const [chPoints, setChPoints] = useState(150);
  const [chFlag, setChFlag] = useState('');
  const [chHint, setChHint] = useState('');
  const [chInstanceUrl, setChInstanceUrl] = useState('');
  const [chIsPerUserInstance, setChIsPerUserInstance] = useState(true);
  const [chIsDraft, setChIsDraft] = useState(true);

  // Invite Code Form state
  const [invCode, setInvCode] = useState('');
  const [invMaxUses, setInvMaxUses] = useState(50);
  const [invExpiresAt, setInvExpiresAt] = useState('');

  // Setup Code Form state
  const [setupCode, setSetupCode] = useState('');
  const [setupUsername, setSetupUsername] = useState('admin');
  const [setupEmail, setSetupEmail] = useState('admin@cyberguards.tn');
  const [setupPassword, setSetupPassword] = useState('CyberGuards2026!');

  // User Reset Password state
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetNewPass, setResetNewPass] = useState('');

  useEffect(() => {
    fetchAllData();
  }, [activeTab]);

  const fetchAllData = async () => {
    setLoading(true);
    setMsg(null);
    try {
      if (activeTab === 'challenges') {
        const res = await fetch('/api/challenges');
        const data = await res.json();
        if (data.challenges) setChallenges(data.challenges);
      } else if (activeTab === 'invites') {
        const res = await fetch('/api/admin?resource=invite-codes');
        const data = await res.json();
        if (data.inviteCodes) setInviteCodes(data.inviteCodes);
      } else if (activeTab === 'users') {
        const res = await fetch('/api/admin?resource=users');
        const data = await res.json();
        if (data.users) setUsers(data.users);
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: 'Error loading admin data' });
    } finally {
      setLoading(false);
    }
  };

  // --- Challenge Actions ---
  const handleOpenCreateChallenge = () => {
    setEditingChallenge(null);
    setChTitle('');
    setChCategory('Web');
    setChDescription('');
    setChPoints(150);
    setChFlag('');
    setChHint('');
    setChInstanceUrl('');
    setChIsPerUserInstance(true);
    setChIsDraft(true);
    setShowChallengeModal(true);
  };

  const handleOpenEditChallenge = (ch: Challenge) => {
    setEditingChallenge(ch);
    setChTitle(ch.title);
    setChCategory(ch.category);
    setChDescription(ch.description);
    setChPoints(ch.points);
    setChFlag(''); // Plaintext flag kept empty unless updating
    setChHint(ch.hint || '');
    setChInstanceUrl(ch.instanceUrl || '');
    setChIsPerUserInstance(ch.isPerUserInstance !== undefined ? ch.isPerUserInstance : true);
    setChIsDraft(ch.isDraft);
    setShowChallengeModal(true);
  };

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        id: editingChallenge?.id,
        title: chTitle,
        category: chCategory,
        description: chDescription,
        points: chPoints,
        flag: chFlag,
        hint: chHint,
        instanceUrl: chInstanceUrl,
        isPerUserInstance: chIsPerUserInstance,
        isDraft: chIsDraft,
      };

      const method = editingChallenge ? 'PATCH' : 'POST';
      const res = await fetch('/api/challenges', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: data.error || 'Failed to save challenge' });
        return;
      }

      setMsg({ type: 'success', text: editingChallenge ? 'Challenge updated successfully' : 'Challenge created successfully' });
      setShowChallengeModal(false);
      fetchAllData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleToggleDraft = async (ch: Challenge) => {
    try {
      const res = await fetch('/api/challenges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ch.id, isDraft: !ch.isDraft }),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: `Challenge "${ch.title}" ${!ch.isDraft ? 'set to DRAFT' : 'PUBLISHED'}` });
        fetchAllData();
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: 'Toggle draft failed' });
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    if (!confirm('Are you sure you want to delete this challenge? Linked solves will be cascade deleted.')) return;
    try {
      const res = await fetch(`/api/challenges?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Challenge deleted successfully' });
        fetchAllData();
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Delete failed' });
    }
  };

  // --- Invite Code Actions ---
  const handleCreateInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-invite',
          code: invCode,
          maxUses: invMaxUses,
          expiresAt: invExpiresAt || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: `Invite code ${data.inviteCode.code} generated successfully!` });
        setInvCode('');
        fetchAllData();
      } else {
        setMsg({ type: 'error', text: data.error });
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: 'Invite creation failed' });
    }
  };

  const handleDeleteInvite = async (id: string) => {
    if (!confirm('Delete this invite code?')) return;
    try {
      const res = await fetch(`/api/admin?type=invite&id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Invite code deleted' });
        fetchAllData();
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Delete failed' });
    }
  };

  // --- User Management Actions ---
  const handleToggleUserRole = async (userRec: UserRecord) => {
    const newRole = userRec.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    if (!confirm(`Change role of @${userRec.username} to ${newRole}?`)) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userRec.id, role: newRole }),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: `Role of @${userRec.username} updated to ${newRole}` });
        fetchAllData();
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Role update failed' });
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!resetNewPass.trim()) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: resetNewPass.trim() }),
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'User password reset successfully' });
        setResetUserId(null);
        setResetNewPass('');
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Password reset failed' });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? Solves will be cascade deleted.')) return;
    try {
      const res = await fetch(`/api/admin?type=user&id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: 'User deleted successfully' });
        fetchAllData();
      } else {
        setMsg({ type: 'error', text: data.error });
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Delete user failed' });
    }
  };

  // --- One-Time Setup Code Admin Setup ---
  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/setup-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setupCode,
          username: setupUsername,
          email: setupEmail,
          password: setupPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: data.message });
      } else {
        setMsg({ type: 'error', text: data.error });
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: 'Setup failed' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col page-bg">
      <Navbar onOpenConsole={() => setConsoleOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-red-950/80 border border-red-800/80 text-red-400">
              <KeyRound className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-mono-code font-bold text-white tracking-tight">
                  EXECUTIVE BOARD ADMIN OPS
                </h1>
                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-lg bg-red-950 text-red-400 border border-red-800/60 font-bold">
                  ROOT
                </span>
              </div>
              <p className="text-xs font-mono-code text-zinc-400 mt-0.5">
                Manage CTFs, target instance URLs, invite passcodes, and member accounts.
              </p>
            </div>
          </div>

          <button
            onClick={fetchAllData}
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white text-xs font-mono-code flex items-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            SYNC DATA
          </button>
        </div>

        {/* Status Message Banner */}
        {msg && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-mono-code flex items-center justify-between ${
              msg.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-800/80 text-emerald-300'
                : 'bg-red-950/80 border-red-800/80 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{msg.text}</span>
            </div>
            <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#1E293B] overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('challenges')}
            className={`px-4 py-2 text-xs font-mono-cyber font-bold tracking-wider rounded-t transition-all ${
              activeTab === 'challenges'
                ? 'bg-[#090D16] text-[#00E5FF] border-t-2 border-x border-[#00E5FF]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            CHALLENGES (CRUD)
          </button>

          <button
            onClick={() => setActiveTab('invites')}
            className={`px-4 py-2 text-xs font-mono-cyber font-bold tracking-wider rounded-t transition-all ${
              activeTab === 'invites'
                ? 'bg-[#090D16] text-[#00E5FF] border-t-2 border-x border-[#00E5FF]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            INVITE CODES
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-xs font-mono-cyber font-bold tracking-wider rounded-t transition-all ${
              activeTab === 'users'
                ? 'bg-[#090D16] text-[#00E5FF] border-t-2 border-x border-[#00E5FF]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            MEMBER MANAGEMENT
          </button>

          <button
            onClick={() => setActiveTab('setup')}
            className={`px-4 py-2 text-xs font-mono-cyber font-bold tracking-wider rounded-t transition-all ${
              activeTab === 'setup'
                ? 'bg-[#090D16] text-[#FF0055] border-t-2 border-x border-[#FF0055]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ONE-TIME ADMIN SETUP
          </button>

          <button
            onClick={() => { setActiveTab('import'); setImportResult(null); setImportError(''); setImportChallenges([]); setImportFileName(''); }}
            className={`px-4 py-2 text-xs font-mono-cyber font-bold tracking-wider rounded-t transition-all flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'bg-[#090D16] text-[#A78BFA] border-t-2 border-x border-[#A78BFA]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3 h-3" />
            IMPORT CHALLENGES
          </button>
        </div>

        {/* TAB 1: CHALLENGE MANAGEMENT */}
        {activeTab === 'challenges' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-mono-cyber font-bold text-white tracking-wider">
                CHALLENGE MANIFEST ({challenges.length})
              </h2>
              <button
                onClick={handleOpenCreateChallenge}
                className="px-4 py-2 bg-[#00E5FF] text-black font-mono-cyber font-bold text-xs rounded hover:bg-[#00E5FF]/90 transition-all cyan-glow flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> CREATE NEW CHALLENGE
              </button>
            </div>

            <div className="bg-[#090D16] border border-[#1E293B] rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#05070B] border-b border-[#1E293B] text-[11px] font-mono-cyber font-bold text-slate-400">
                    <th className="py-3 px-4">TITLE</th>
                    <th className="py-3 px-4">CATEGORY</th>
                    <th className="py-3 px-4 text-center">POINTS</th>
                    <th className="py-3 px-4 text-center">SOLVES</th>
                    <th className="py-3 px-4 text-center">STATE</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] text-xs font-mono-cyber">
                  {challenges.map((ch) => (
                    <tr key={ch.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-white">{ch.title}</td>
                      <td className="py-3 px-4 text-[#00E5FF]">{ch.category}</td>
                      <td className="py-3 px-4 text-center font-bold">{ch.points}</td>
                      <td className="py-3 px-4 text-center text-slate-400">{ch.solveCount}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleDraft(ch)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                            ch.isDraft
                              ? 'bg-[#FF0055]/20 text-[#FF0055] border-[#FF0055]/40'
                              : 'bg-[#00FF66]/20 text-[#00FF66] border-[#00FF66]/40'
                          }`}
                        >
                          {ch.isDraft ? 'DRAFT (HIDDEN)' : 'PUBLISHED'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditChallenge(ch)}
                          className="p-1 rounded text-slate-400 hover:text-[#00E5FF]"
                          title="Edit Challenge"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteChallenge(ch.id)}
                          className="p-1 rounded text-slate-400 hover:text-[#FF0055]"
                          title="Delete Challenge"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: INVITE CODE GENERATOR */}
        {activeTab === 'invites' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="bg-[#090D16] border border-[#1E293B] rounded-lg p-6 space-y-4">
              <h3 className="text-sm font-mono-cyber font-bold text-white tracking-wider flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#00E5FF]" /> GENERATE INVITE CODE
              </h3>
              <form onSubmit={handleCreateInviteCode} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-mono-cyber text-slate-300">CUSTOM CODE (OPTIONAL)</label>
                  <input
                    type="text"
                    value={invCode}
                    onChange={(e) => setInvCode(e.target.value)}
                    placeholder="Auto-generated if empty"
                    className="w-full bg-[#05070B] border border-[#1E293B] rounded px-3 py-2 text-xs font-mono-cyber text-white uppercase outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono-cyber text-slate-300">MAXIMUM USES</label>
                  <input
                    type="number"
                    value={invMaxUses}
                    onChange={(e) => setInvMaxUses(parseInt(e.target.value, 10))}
                    className="w-full bg-[#05070B] border border-[#1E293B] rounded px-3 py-2 text-xs font-mono-cyber text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono-cyber text-slate-300">EXPIRATION DATE (OPTIONAL)</label>
                  <input
                    type="datetime-local"
                    value={invExpiresAt}
                    onChange={(e) => setInvExpiresAt(e.target.value)}
                    className="w-full bg-[#05070B] border border-[#1E293B] rounded px-3 py-2 text-xs font-mono-cyber text-white outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-[#00E5FF] text-black font-mono-cyber font-bold text-xs rounded hover:bg-[#00E5FF]/90 cyan-glow"
                >
                  CREATE INVITE CODE
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 bg-[#090D16] border border-[#1E293B] rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#05070B] border-b border-[#1E293B] text-[11px] font-mono-cyber font-bold text-slate-400">
                    <th className="py-3 px-4">CODE</th>
                    <th className="py-3 px-4 text-center">USAGE</th>
                    <th className="py-3 px-4 text-center">EXPIRATION</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] text-xs font-mono-cyber">
                  {inviteCodes.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-[#00E5FF]">{inv.code}</td>
                      <td className="py-3 px-4 text-center">
                        {inv.uses} / {inv.maxUses === 0 ? '∞' : inv.maxUses}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400">
                        {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteInvite(inv.id)}
                          className="p-1 text-slate-400 hover:text-[#FF0055]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MEMBER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-[#090D16] border border-[#1E293B] rounded-lg overflow-hidden space-y-4 p-4">
            <h2 className="text-sm font-mono-cyber font-bold text-white tracking-wider">
              REGISTERED MEMBERS & EXECUTIVE BOARD ({users.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#05070B] border-b border-[#1E293B] text-[11px] font-mono-cyber font-bold text-slate-400">
                    <th className="py-3 px-4">USERNAME</th>
                    <th className="py-3 px-4">EMAIL</th>
                    <th className="py-3 px-4 text-center">ROLE</th>
                    <th className="py-3 px-4 text-center">SOLVES</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] text-xs font-mono-cyber">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-white">@{u.username}</td>
                      <td className="py-3 px-4 text-slate-400">{u.email}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleUserRole(u)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                            u.role === 'ADMIN'
                              ? 'bg-[#FF0055]/20 text-[#FF0055] border-[#FF0055]/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {u.role}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">{u._count?.solves || 0}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {resetUserId === u.id ? (
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="password"
                              value={resetNewPass}
                              onChange={(e) => setResetNewPass(e.target.value)}
                              placeholder="New password"
                              className="bg-[#05070B] border border-[#00E5FF] px-2 py-1 text-xs text-white rounded outline-none"
                            />
                            <button
                              onClick={() => handleResetPassword(u.id)}
                              className="px-2 py-1 bg-[#00E5FF] text-black font-bold text-xs rounded"
                            >
                              Save
                            </button>
                            <button onClick={() => setResetUserId(null)} className="text-slate-400 text-xs">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setResetUserId(u.id)}
                            className="text-xs text-[#00E5FF] hover:underline"
                          >
                            Reset Password
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1 text-slate-400 hover:text-[#FF0055]"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ONE-TIME ADMIN SETUP */}
        {activeTab === 'setup' && (
          <div className="max-w-md bg-[#090D16] border border-[#FF0055]/40 rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-mono-cyber font-bold text-[#FF0055] tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> ONE-TIME INITIAL ADMIN CREATOR
            </h3>
            <p className="text-xs font-mono-cyber text-slate-400">
              Claim or elevate an account to Executive Board Admin using the server setup code (default: <code className="text-[#00E5FF]">CYBERGUARDS-ADMIN-SETUP-2026</code>).
            </p>

            <form onSubmit={handleSetupAdmin} className="space-y-3 font-mono-cyber text-xs">
              <div className="space-y-1">
                <label className="text-slate-300">SETUP CODE</label>
                <input
                  type="text"
                  value={setupCode}
                  onChange={(e) => setSetupCode(e.target.value)}
                  placeholder="CYBERGUARDS-ADMIN-SETUP-2026"
                  className="w-full bg-[#05070B] border border-[#1E293B] focus:border-[#FF0055] rounded px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">ADMIN USERNAME</label>
                <input
                  type="text"
                  value={setupUsername}
                  onChange={(e) => setSetupUsername(e.target.value)}
                  className="w-full bg-[#05070B] border border-[#1E293B] rounded px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">ADMIN EMAIL</label>
                <input
                  type="email"
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  className="w-full bg-[#05070B] border border-[#1E293B] rounded px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">ADMIN PASSWORD</label>
                <input
                  type="password"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  className="w-full bg-[#05070B] border border-[#1E293B] rounded px-3 py-2 text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#FF0055] text-white font-bold rounded hover:bg-[#FF0055]/90 crimson-glow"
              >
                CLAIM EXECUTIVE ADMIN PRIVILEGES
              </button>
            </form>
          </div>
        )}

      </main>

      {/* Challenge Create/Edit Modal */}
      {showChallengeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#090D16] border border-[#00E5FF]/40 rounded-lg p-6 space-y-4">
            <h3 className="text-base font-mono-cyber font-bold text-white">
              {editingChallenge ? 'EDIT CHALLENGE' : 'CREATE NEW CHALLENGE'}
            </h3>

            <form onSubmit={handleSaveChallenge} className="space-y-3 text-xs font-mono-cyber">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300">TITLE</label>
                  <input
                    type="text"
                    required
                    value={chTitle}
                    onChange={(e) => setChTitle(e.target.value)}
                    className="w-full bg-[#05070B] border border-[#1E293B] rounded px-3 py-2 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-[#00E5FF]">CATEGORY</label>
                  <select
                    value={chCategory}
                    onChange={(e) => setChCategory(e.target.value)}
                    className="w-full bg-[#05070B] border border-[#1E293B] rounded px-3 py-2 text-white outline-none"
                  >
                    <option value="Web">Web</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Forensics">Forensics</option>
                    <option value="Reverse">Reverse</option>
                    <option value="Pwn">Pwn</option>
                    <option value="OSINT">OSINT</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">DESCRIPTION (MARKDOWN & LINKS SUPPORTED)</label>
                <textarea
                  rows={3}
                  required
                  value={chDescription}
                  onChange={(e) => setChDescription(e.target.value)}
                  className="w-full bg-[#05070B] border border-[#1E293B] rounded px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300">POINTS</label>
                  <input
                    type="number"
                    required
                    value={chPoints}
                    onChange={(e) => setChPoints(parseInt(e.target.value, 10))}
                    className="w-full bg-[#05070B] border border-[#1E293B] rounded px-3 py-2 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300">
                    PLAINTEXT FLAG {editingChallenge && '(Leave empty to keep existing)'}
                  </label>
                  <input
                    type="text"
                    required={!editingChallenge}
                    value={chFlag}
                    onChange={(e) => setChFlag(e.target.value)}
                    placeholder="ENISO{secret_flag}"
                    className="w-full bg-[#05070B] border border-[#1E293B] rounded px-3 py-2 text-[#00FF66] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-[#00E5FF] font-bold">TARGET INSTANCE URL / HOST LINK (OPTIONAL)</label>
                <input
                  type="text"
                  value={chInstanceUrl}
                  onChange={(e) => setChInstanceUrl(e.target.value)}
                  placeholder="https://challs.cyberguards.io/web101 or nc pwn.cyberguards.io 9000"
                  className="w-full bg-[#05070B] border border-[#00E5FF]/40 rounded px-3 py-2 text-[#00FF66] font-bold outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chIsPerUserInstance"
                  checked={chIsPerUserInstance}
                  onChange={(e) => setChIsPerUserInstance(e.target.checked)}
                  className="w-4 h-4 accent-[#00E5FF]"
                />
                <label htmlFor="chIsPerUserInstance" className="text-slate-300 cursor-pointer text-[11px]">
                  GENERATE PER-USER DYNAMIC TARGET LINK (Appends ?operative=username)
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">TACTICAL HINT (OPTIONAL)</label>
                <input
                  type="text"
                  value={chHint}
                  onChange={(e) => setChHint(e.target.value)}
                  className="w-full bg-[#05070B] border border-[#1E293B] rounded px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chIsDraft"
                  checked={chIsDraft}
                  onChange={(e) => setChIsDraft(e.target.checked)}
                  className="w-4 h-4 accent-[#FF0055]"
                />
                <label htmlFor="chIsDraft" className="text-slate-300 cursor-pointer">
                  SAVE AS UNPUBLISHED DRAFT (Hidden from members)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChallengeModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00E5FF] text-black font-bold rounded cyan-glow"
                >
                  SAVE CHALLENGE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: IMPORT CHALLENGES */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <span className="p-2 rounded-xl bg-violet-950/80 border border-violet-700/60 text-violet-400">
              <Upload className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-mono-cyber font-bold text-white tracking-wider">IMPORT CHALLENGES FROM JSON</h2>
              <p className="text-[11px] text-zinc-400 font-mono-code mt-0.5">
                Drag &amp; drop a JSON file containing an array of challenge objects, or click to browse.
              </p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setImportDragging(true); }}
            onDragLeave={() => setImportDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setImportDragging(false);
              setImportError('');
              setImportResult(null);
              const file = e.dataTransfer.files[0];
              if (!file) return;
              setImportFileName(file.name);
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const parsed = JSON.parse(ev.target?.result as string);
                  const arr = Array.isArray(parsed) ? parsed : parsed.challenges ?? [];
                  if (!Array.isArray(arr)) throw new Error('Expected a JSON array of challenges.');
                  setImportChallenges(arr);
                } catch (err: any) {
                  setImportError(err.message ?? 'Invalid JSON');
                  setImportChallenges([]);
                }
              };
              reader.readAsText(file);
            }}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
              importDragging
                ? 'border-violet-400 bg-violet-950/30'
                : importChallenges.length > 0
                ? 'border-emerald-600/60 bg-emerald-950/20'
                : 'border-zinc-700 bg-zinc-900/40 hover:border-zinc-500'
            }`}
            onClick={() => document.getElementById('import-file-input')?.click()}
          >
            <input
              id="import-file-input"
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                setImportError('');
                setImportResult(null);
                const file = e.target.files?.[0];
                if (!file) return;
                setImportFileName(file.name);
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const parsed = JSON.parse(ev.target?.result as string);
                    const arr = Array.isArray(parsed) ? parsed : parsed.challenges ?? [];
                    if (!Array.isArray(arr)) throw new Error('Expected a JSON array.');
                    setImportChallenges(arr);
                  } catch (err: any) {
                    setImportError(err.message ?? 'Invalid JSON');
                    setImportChallenges([]);
                  }
                };
                reader.readAsText(file);
              }}
            />
            {importChallenges.length > 0 ? (
              <div className="flex flex-col items-center gap-2">
                <FileJson className="w-10 h-10 text-emerald-400" />
                <p className="text-emerald-300 font-mono-code font-bold text-sm">{importFileName}</p>
                <p className="text-emerald-400 text-xs">{importChallenges.length} challenge{importChallenges.length !== 1 ? 's' : ''} ready to import</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-10 h-10 text-zinc-500" />
                <p className="text-zinc-400 font-mono-code text-sm">Drop your <span className="text-violet-400 font-bold">.json</span> file here, or click to browse</p>
                <p className="text-zinc-600 text-xs font-mono-code">Must be a JSON array: [&#123; title, category, description, points, flag, hint?, instanceUrl? &#125;, ...]</p>
              </div>
            )}
          </div>

          {importError && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/60 text-red-300 text-xs font-mono-code flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {/* Preview table */}
          {importChallenges.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono-cyber font-bold text-zinc-300 tracking-wider">PREVIEW ({importChallenges.length} challenges)</h3>
                <button
                  onClick={() => { setImportChallenges([]); setImportFileName(''); setImportResult(null); }}
                  className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <XIcon className="w-3 h-3" /> Clear
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-xs font-mono-code">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60">
                      <th className="text-left px-4 py-2.5 text-zinc-400 font-bold">#</th>
                      <th className="text-left px-4 py-2.5 text-zinc-400 font-bold">TITLE</th>
                      <th className="text-left px-4 py-2.5 text-zinc-400 font-bold">CATEGORY</th>
                      <th className="text-left px-4 py-2.5 text-zinc-400 font-bold">PTS</th>
                      <th className="text-left px-4 py-2.5 text-zinc-400 font-bold">FLAG</th>
                      <th className="text-left px-4 py-2.5 text-zinc-400 font-bold">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importChallenges.map((c: any, i: number) => {
                      const missing = !c.title || !c.category || !c.description || !c.flag || typeof c.points !== 'number';
                      return (
                        <tr key={i} className={`border-b border-zinc-800/50 ${ missing ? 'bg-red-950/20' : 'hover:bg-zinc-800/40' } transition-colors`}>
                          <td className="px-4 py-2.5 text-zinc-500">{i + 1}</td>
                          <td className="px-4 py-2.5 text-white font-bold">{c.title ?? <span className="text-red-400">MISSING</span>}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded-full bg-violet-950 border border-violet-700/40 text-violet-300 text-[10px]">{c.category ?? '?'}</span>
                          </td>
                          <td className="px-4 py-2.5 text-[#00E5FF] font-bold">{c.points ?? <span className="text-red-400">?</span>}</td>
                          <td className="px-4 py-2.5 text-zinc-400 max-w-[200px] truncate">{c.flag ?? <span className="text-red-400">MISSING</span>}</td>
                          <td className="px-4 py-2.5">
                            {missing
                              ? <span className="text-red-400 font-bold">⚠ INVALID</span>
                              : <span className="text-emerald-400">✓ OK</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Import result */}
              {importResult && (
                <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-700/60 space-y-2">
                  <p className="text-emerald-300 font-mono-cyber font-bold text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Import Complete — {importResult.created} created, {importResult.updated} updated
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                    {importResult.results.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-mono-code text-zinc-300">
                        <span className={r.action === 'created' ? 'text-emerald-400' : 'text-amber-400'}>
                          {r.action === 'created' ? '+ created' : '↻ updated'}
                        </span>
                        <span className="truncate">{r.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <p className="text-xs text-zinc-500 font-mono-code self-center">Safe to re-run — duplicates are updated, not doubled.</p>
                <button
                  disabled={importLoading || importChallenges.some((c: any) => !c.title || !c.category || !c.description || !c.flag || typeof c.points !== 'number')}
                  onClick={async () => {
                    setImportLoading(true);
                    setImportResult(null);
                    setMsg(null);
                    try {
                      const res = await fetch('/api/admin/import-challenges', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ challenges: importChallenges }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        setMsg({ type: 'error', text: data.error || 'Import failed' });
                      } else {
                        setImportResult(data);
                        setMsg({ type: 'success', text: `${data.created} challenges created, ${data.updated} updated.` });
                      }
                    } catch (e: any) {
                      setMsg({ type: 'error', text: e.message });
                    } finally {
                      setImportLoading(false);
                    }
                  }}
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono-cyber font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-violet-900/40"
                >
                  {importLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {importLoading ? 'IMPORTING...' : `IMPORT ${importChallenges.length} CHALLENGES`}
                </button>
              </div>
            </div>
          )}

          {/* JSON format reference */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <p className="text-xs font-mono-cyber font-bold text-zinc-400 tracking-wider">EXPECTED JSON FORMAT</p>
            <pre className="text-[11px] font-mono-code text-zinc-300 overflow-x-auto leading-relaxed">{
`[\n  {\n    "title": "My Challenge",\n    "category": "Web",\n    "description": "Find the flag...",\n    "points": 150,\n    "flag": "ECCC{my_flag_here}",\n    "hint": "Optional hint text",\n    "instanceUrl": "https://chall.example.com",\n    "isPerUserInstance": false,\n    "isDraft": false\n  }\n]`
            }</pre>
          </div>
        </div>
      )}

      <CommandConsoleOverlay isOpen={consoleOpen} onClose={() => setConsoleOpen(false)} />
    </div>
  );
}
