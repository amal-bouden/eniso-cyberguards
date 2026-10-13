'use client';

import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';

export interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  solvedCount: number;
  totalPoints: number;
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
              <div className="mt-1 text-xl font-mono-code font-bold text-amber-400">
                {top3[0].totalPoints} PTS
              </div>
              <div className="text-xs font-mono-code text-slate-400 mt-0.5">
                {top3[0].solvedCount} solves
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
              <div className="mt-1 text-lg font-mono-code font-bold text-slate-200">
                {top3[1].totalPoints} PTS
              </div>
              <div className="text-xs font-mono-code text-slate-400 mt-0.5">
                {top3[1].solvedCount} solves
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
              <div className="mt-1 text-lg font-mono-code font-bold text-amber-400">
                {top3[2].totalPoints} PTS
              </div>
              <div className="text-xs font-mono-code text-slate-400 mt-0.5">
                {top3[2].solvedCount} solves
              </div>
            </div>
          )}

        </div>
      )}

      {/* Leaderboard Table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0b0f19] border-b border-[#1e293b] text-[11px] font-mono-code font-bold text-slate-400 tracking-wider uppercase">
                <th className="py-3 px-4 text-center w-14">RANK</th>
                <th className="py-3 px-4">OPERATIVE</th>
                <th className="py-3 px-4 text-center">SOLVES</th>
                <th className="py-3 px-4 text-right">SCORE</th>
                <th className="py-3 px-4 text-right">LAST SOLVE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b] text-xs font-mono-code">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No operative rankings recorded yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[#18243b] transition-colors"
                  >
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
                      @{user.username}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-300">
                      {user.solvedCount}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">
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
