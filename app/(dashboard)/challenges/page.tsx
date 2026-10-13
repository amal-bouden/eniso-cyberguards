'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CommandConsoleOverlay from '@/components/CommandConsoleOverlay';
import ChallengeGrid from '@/components/ChallengeGrid';
import { ChallengeItem } from '@/components/FlagSubmissionModal';
import { Flag, RefreshCw, AlertCircle } from 'lucide-react';

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'MEMBER' | 'ADMIN' | undefined>(undefined);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChallenges();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUserRole(data.user?.role);
    } catch {
      setUserRole(undefined);
    }
  };

  const fetchChallenges = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/challenges');
      const data = await res.json();
      if (res.ok && data.challenges) {
        setChallenges(data.challenges);
      } else {
        setError(data.error || 'Failed to load challenges');
      }
    } catch (e: any) {
      setError('Network connection error while fetching challenges.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col page-bg">
      <Navbar onOpenConsole={() => setConsoleOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header Title — TryHackMe / HTB Style Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-[#131c2e] border border-[#1e293b] text-blue-400">
                <Flag className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-mono-code font-bold text-white tracking-tight uppercase">
                  OPERATIONAL CTF LAB
                </h1>
                <p className="text-xs font-mono-code text-slate-400 mt-0.5">
                  Per-member target instances, live exploit targets, and flag submission portal.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchChallenges}
              className="px-3.5 py-1.5 rounded-lg bg-[#131c2e] border border-[#1e293b] hover:border-[#334155] text-slate-300 hover:text-white text-xs font-mono-code flex items-center gap-2 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
              REFRESH TARGETS
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-lg text-xs font-mono-code flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && challenges.length === 0 ? (
          <div className="py-20 text-center space-y-3 surface-card">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono-code text-slate-400 tracking-wider">
              CONNECTING TO ENISO CYBERGUARDS TARGET INSTANCES...
            </p>
          </div>
        ) : (
          <ChallengeGrid
            challenges={challenges}
            userRole={userRole}
            onChallengeSolved={fetchChallenges}
          />
        )}
      </main>

      {/* Command Line Console Overlay */}
      <CommandConsoleOverlay isOpen={consoleOpen} onClose={() => setConsoleOpen(false)} />
    </div>
  );
}
