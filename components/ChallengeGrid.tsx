'use client';

import React, { useState } from 'react';
import { Flag, Flame, CheckCircle2, Search, ShieldAlert, Server, ArrowUpRight, FolderDown } from 'lucide-react';
import FlagSubmissionModal, { ChallengeItem } from './FlagSubmissionModal';

interface ChallengeGridProps {
  challenges: ChallengeItem[];
  userRole?: 'MEMBER' | 'ADMIN';
  onChallengeSolved?: () => void;
}

const CATEGORIES = [
  'ALL',
  'WEB',
  'CRYPTO',
  'FORENSICS',
  'STEGANOGRAPHY',
  'NETWORKING',
  'REVERSE',
  'PWN',
  'OSINT',
  'MISC',
];

const CATEGORY_COLORS: Record<string, string> = {
  WEB: 'text-sky-400 bg-sky-950/40 border-sky-800/40',
  CRYPTO: 'text-purple-400 bg-purple-950/40 border-purple-800/40',
  FORENSICS: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
  STEGANOGRAPHY: 'text-pink-400 bg-pink-950/40 border-pink-800/40',
  NETWORKING: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/40',
  REVERSE: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
  PWN: 'text-rose-400 bg-rose-950/40 border-rose-800/40',
  OSINT: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40',
  MISC: 'text-teal-400 bg-teal-950/40 border-teal-800/40',
};

export default function ChallengeGrid({
  challenges,
  userRole,
  onChallengeSolved,
}: ChallengeGridProps) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChallenge, setActiveChallenge] = useState<ChallengeItem | null>(null);

  const filteredChallenges = challenges.filter((c) => {
    const matchesCategory =
      selectedCategory === 'ALL' || c.category.toUpperCase() === selectedCategory;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSolveSuccess = (challengeId: string, points: number, isFirstBlood: boolean) => {
    onChallengeSolved?.();
    // Broadcast solve event so scoreboard can update instantly
    try {
      const bc = new BroadcastChannel('ctf_solves');
      bc.postMessage({ challengeId, points, isFirstBlood, ts: Date.now() });
      bc.close();
    } catch {
      // BroadcastChannel not available in all environments, silently ignore
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Category Tabs & Search Bar — TryHackMe / HTB Style Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 surface-card p-2.5">
        
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-medium tracking-wide transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-[#18243b]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search targets..."
            className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-blue-500 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono-code text-white placeholder:text-slate-400 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid of Challenges */}
      {filteredChallenges.length === 0 ? (
        <div className="text-center py-16 surface-card space-y-2">
          <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-mono-code font-bold text-slate-300">NO TARGETS FOUND</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
            No active CTF machines match your category or search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredChallenges.map((ch) => {
            const catColor = CATEGORY_COLORS[ch.category.toUpperCase()] || 'text-slate-300 bg-slate-900 border-slate-700';

            return (
              <div
                key={ch.id}
                onClick={() => setActiveChallenge(ch)}
                className={`group relative surface-card p-4 cursor-pointer transition-all hover:border-blue-500/40 hover:bg-[#18243b] ${
                  ch.isSolved
                    ? 'border-emerald-500/40 bg-emerald-950/15'
                    : ch.isDraft
                    ? 'border-rose-900/40 bg-rose-950/10'
                    : 'border-[#1e293b]'
                }`}
              >
                
                {/* Category & Status Badges */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-semibold tracking-wider border ${catColor}`}>
                      {ch.category.toUpperCase()}
                    </span>
                    {ch.instanceUrl && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                        <Server className="w-2.5 h-2.5" /> DEDICATED
                      </span>
                    )}
                    {ch.files && ch.files.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold tracking-wider bg-blue-950/80 text-blue-300 border border-blue-800/60 flex items-center gap-1">
                        <FolderDown className="w-2.5 h-2.5 text-blue-400" /> {ch.files.length} {ch.files.length === 1 ? 'FILE' : 'FILES'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {ch.isSolved && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-700/60 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> SOLVED
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Points */}
                <div className="space-y-1 mb-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-mono-code font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1">
                      <span>{ch.title}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                    </h3>
                    <span className="text-xs font-mono-code text-slate-200 font-bold px-2 py-0.5 rounded bg-[#0b0f19] border border-[#1e293b]">
                      {ch.points} PTS
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 font-sans leading-relaxed">
                    {ch.description}
                  </p>
                </div>

                {/* Solves & First Blood — TryHackMe / HTB Machine Footer */}
                <div className="pt-2.5 border-t border-[#1e293b] flex items-center justify-between text-[11px] font-mono-code text-slate-400">
                  <span>{ch.solveCount} {ch.solveCount === 1 ? 'solve' : 'solves'}</span>
                  
                  {ch.firstBlood ? (
                    <span className="text-rose-400 flex items-center gap-1 font-medium">
                      <Flame className="w-3 h-3 text-rose-500" /> @{ch.firstBlood}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">No solves yet</span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Flag Submission Modal */}
      {activeChallenge && (
        <FlagSubmissionModal
          challenge={activeChallenge}
          onClose={() => setActiveChallenge(null)}
          onSolveSuccess={handleSolveSuccess}
        />
      )}
    </div>
  );
}
