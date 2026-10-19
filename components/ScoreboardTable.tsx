'use client';

import React from 'react';
import { Trophy, Medal, Award, Zap, Flame, Shield } from 'lucide-react';

export interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  solvedCount: number;
  totalPoints: number;
  basePoints?: number;
  speedBonus?: number;
  firstBloodBonus?: number;
  firstBloodCount?: number;
  lastSolveTime: string;
}

interface ScoreboardTableProps {
  leaderboard: LeaderboardUser[];
}

export default function ScoreboardTable({ leaderboard }: ScoreboardTableProps) {
  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top 3 Podium Highlights — TryHackMe / HTB Style */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* 1st Place */}
          {top3[0] && (
            <div className="order-1 md:order-2 surface-card border border-amber-500/40 p-5 text-center relative overflow-hidden bg-[#131c2e]">
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-amber-400 text-black text-[10px] font-mono-code font-bold rounded uppercase">
                RANK #1
              </div>
              <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-1.5 mt-0.5" />
              <h3 className="text-base font-mono-code font-bold text-white tracking-tight">
                @{top3[0].username}
              </h3>
              <div className="mt-1 text-2xl font-mono-code font-bold text-amber-400">
                {top3[0].totalPoints} <span className="text-sm">PTS</span>
              </div>
              <div className="text-xs font-mono-code text-slate-400 mt-1 flex items-center justify-center gap-2">
                <span>{top3[0].solvedCount} solves</span>
                {top3[0].firstBloodCount ? (
                  <span className="text-rose-400 font-bold flex items-center gap-0.5">
                    <Flame className="w-3 h-3 text-rose-500 inline" /> {top3[0].firstBloodCount} FB
                  </span>
                ) : null}
              </div>

              {/* Explicit Points Breakdown Chips */}
              <div className="mt-3 pt-3 border-t border-amber-500/20 grid grid-cols-3 gap-1 text-[10px] font-mono-code">
                <div className="bg-[#0b0f19]/80 p-1 rounded border border-[#1e293b]">
                  <span className="text-slate-400 block text-[9px]">BASE</span>
                  <span className="text-slate-200 font-bold">{top3[0].basePoints ?? top3[0].totalPoints}</span>
                </div>
                <div className="bg-[#0b0f19]/80 p-1 rounded border border-blue-900/40">
                  <span className="text-blue-400 block text-[9px] flex items-center justify-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" /> SPEED
                  </span>
                  <span className="text-blue-300 font-bold">+{top3[0].speedBonus ?? 0}</span>
                </div>
                <div className="bg-[#0b0f19]/80 p-1 rounded border border-rose-900/40">
                  <span className="text-rose-400 block text-[9px] flex items-center justify-center gap-0.5">
                    <Flame className="w-2.5 h-2.5" /> BLOOD
                  </span>
                  <span className="text-rose-300 font-bold">+{top3[0].firstBloodBonus ?? 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* 2nd Place */}
          {top3[1] && (
            <div className="order-2 md:order-1 surface-card border border-slate-600/40 p-5 text-center relative overflow-hidden bg-[#131c2e]">
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-slate-300 text-black text-[10px] font-mono-code font-bold rounded uppercase">
                RANK #2
              </div>
              <Medal className="w-8 h-8 text-slate-300 mx-auto mb-1.5 mt-0.5" />
              <h3 className="text-sm font-mono-code font-bold text-white tracking-tight">
                @{top3[1].username}
              </h3>
              <div className="mt-1 text-xl font-mono-code font-bold text-slate-200">
                {top3[1].totalPoints} <span className="text-sm">PTS</span>
              </div>
              <div className="text-xs font-mono-code text-slate-400 mt-1 flex items-center justify-center gap-2">
                <span>{top3[1].solvedCount} solves</span>
                {top3[1].firstBloodCount ? (
                  <span className="text-rose-400 font-bold flex items-center gap-0.5">
                    <Flame className="w-3 h-3 text-rose-500 inline" /> {top3[1].firstBloodCount} FB
                  </span>
                ) : null}
              </div>

              {/* Explicit Points Breakdown Chips */}
              <div className="mt-3 pt-3 border-t border-slate-700/40 grid grid-cols-3 gap-1 text-[10px] font-mono-code">
                <div className="bg-[#0b0f19]/80 p-1 rounded border border-[#1e293b]">
                  <span className="text-slate-400 block text-[9px]">BASE</span>
                  <span className="text-slate-200 font-bold">{top3[1].basePoints ?? top3[1].totalPoints}</span>
                </div>
                <div className="bg-[#0b0f19]/80 p-1 rounded border border-blue-900/40">
                  <span className="text-blue-400 block text-[9px] flex items-center justify-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" /> SPEED
                  </span>
                  <span className="text-blue-300 font-bold">+{top3[1].speedBonus ?? 0}</span>
                </div>
                <div className="bg-[#0b0f19]/80 p-1 rounded border border-rose-900/40">
                  <span className="text-rose-400 block text-[9px] flex items-center justify-center gap-0.5">
                    <Flame className="w-2.5 h-2.5" /> BLOOD
                  </span>
                  <span className="text-rose-300 font-bold">+{top3[1].firstBloodBonus ?? 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="order-3 md:order-3 surface-card border border-amber-700/40 p-5 text-center relative overflow-hidden bg-[#131c2e]">
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-amber-700 text-white text-[10px] font-mono-code font-bold rounded uppercase">
                RANK #3
              </div>
              <Award className="w-8 h-8 text-amber-500 mx-auto mb-1.5 mt-0.5" />
              <h3 className="text-sm font-mono-code font-bold text-white tracking-tight">
                @{top3[2].username}
              </h3>
              <div className="mt-1 text-xl font-mono-code font-bold text-amber-400">
                {top3[2].totalPoints} <span className="text-sm">PTS</span>
              </div>
              <div className="text-xs font-mono-code text-slate-400 mt-1 flex items-center justify-center gap-2">
                <span>{top3[2].solvedCount} solves</span>
                {top3[2].firstBloodCount ? (
                  <span className="text-rose-400 font-bold flex items-center gap-0.5">
                    <Flame className="w-3 h-3 text-rose-500 inline" /> {top3[2].firstBloodCount} FB
                  </span>
                ) : null}
              </div>

              {/* Explicit Points Breakdown Chips */}
              <div className="mt-3 pt-3 border-t border-amber-900/40 grid grid-cols-3 gap-1 text-[10px] font-mono-code">
                <div className="bg-[#0b0f19]/80 p-1 rounded border border-[#1e293b]">
                  <span className="text-slate-400 block text-[9px]">BASE</span>
                  <span className="text-slate-200 font-bold">{top3[2].basePoints ?? top3[2].totalPoints}</span>
                </div>
                <div className="bg-[#0b0f19]/80 p-1 rounded border border-blue-900/40">
                  <span className="text-blue-400 block text-[9px] flex items-center justify-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" /> SPEED
                  </span>
                  <span className="text-blue-300 font-bold">+{top3[2].speedBonus ?? 0}</span>
                </div>
                <div className="bg-[#0b0f19]/80 p-1 rounded border border-rose-900/40">
                  <span className="text-rose-400 block text-[9px] flex items-center justify-center gap-0.5">
                    <Flame className="w-2.5 h-2.5" /> BLOOD
                  </span>
                  <span className="text-rose-300 font-bold">+{top3[2].firstBloodBonus ?? 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table with Explicit Breakdown */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0b0f19] border-b border-[#1e293b] text-[11px] font-mono-code font-bold text-slate-400 tracking-wider uppercase">
                <th className="py-3 px-4 text-center w-14">RANK</th>
                <th className="py-3 px-4">OPERATIVE</th>
                <th className="py-3 px-4 text-center">SOLVES</th>
                <th className="py-3 px-3 text-right">BASE PTS</th>
                <th className="py-3 px-3 text-right text-blue-400">⚡ SPEED</th>
                <th className="py-3 px-3 text-right text-rose-400">🩸 1ST BLOOD</th>
                <th className="py-3 px-4 text-right text-amber-400">TOTAL SCORE</th>
                <th className="py-3 px-4 text-right">LAST SOLVE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b] text-xs font-mono-code">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No operative rankings recorded yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((user) => (
                  <tr key={user.id} className="hover:bg-[#18243b] transition-colors">
                    <td className="py-3 px-4 text-center font-bold">
                      <span
                        className={`inline-block w-6 h-6 leading-6 rounded text-xs font-bold ${
                          user.rank === 1
                            ? 'bg-amber-400 text-black'
                            : user.rank === 2
                            ? 'bg-slate-300 text-black'
                            : user.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-[#0b0f19] text-slate-400 border border-[#1e293b]'
                        }`}
                      >
                        {user.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <span>@{user.username}</span>
                        {user.firstBloodCount ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-950/80 text-rose-400 border border-rose-800/60 font-bold flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5 text-rose-500" /> {user.firstBloodCount}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-300">
                      {user.solvedCount}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">
                      {user.basePoints ?? user.totalPoints}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-blue-400">
                      +{user.speedBonus ?? 0}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-rose-400">
                      +{user.firstBloodBonus ?? 0}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-400 text-sm">
                      {user.totalPoints} PTS
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                      {new Date(user.lastSolveTime).toLocaleDateString()} {new Date(user.lastSolveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
