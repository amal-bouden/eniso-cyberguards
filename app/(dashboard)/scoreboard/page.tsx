'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import CommandConsoleOverlay from '@/components/CommandConsoleOverlay';
import ScoreboardTable, { LeaderboardUser } from '@/components/ScoreboardTable';
import LiveSolveFeed, { FeedItem } from '@/components/LiveSolveFeed';
import { Trophy, RefreshCw, Clock, Radio } from 'lucide-react';

const POLL_INTERVAL = 10; // seconds

export default function ScoreboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [countdown, setCountdown] = useState(POLL_INTERVAL);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const countdownRef = useRef(POLL_INTERVAL);

  useEffect(() => {
    fetchScoreboard();

    // Auto-refresh every POLL_INTERVAL seconds
    const pollInterval = setInterval(() => {
      fetchScoreboard();
      countdownRef.current = POLL_INTERVAL;
      setCountdown(POLL_INTERVAL);
    }, POLL_INTERVAL * 1000);

    // Countdown tick every second
    const tickInterval = setInterval(() => {
      countdownRef.current = Math.max(0, countdownRef.current - 1);
      setCountdown(countdownRef.current);
    }, 1000);

    // BroadcastChannel: instant refresh when any tab submits a correct flag
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('ctf_solves');
      bc.onmessage = () => {
        // Small delay to allow DB to commit before we fetch
        setTimeout(() => fetchScoreboard(), 600);
      };
    } catch {
      // BroadcastChannel unavailable (SSR / older browsers) — silent fallback
    }

    return () => {
      clearInterval(pollInterval);
      clearInterval(tickInterval);
      bc?.close();
    };
  }, []);

  const fetchScoreboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/scoreboard');
      const data = await res.json();

      if (res.ok) {
        setLeaderboard(data.leaderboard || []);
        setFeed(data.feed || []);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        // Reset countdown after successful fetch
        countdownRef.current = POLL_INTERVAL;
        setCountdown(POLL_INTERVAL);
      }
    } catch (e) {
      console.error('Scoreboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col page-bg">
      <Navbar onOpenConsole={() => setConsoleOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header — TryHackMe / HTB Style */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-[#131c2e] border border-[#1e293b] text-amber-400">
                <Trophy className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-mono-code font-bold text-white tracking-tight uppercase">
                  OPERATIVE LEADERBOARD & TELEMETRY
                </h1>
                <p className="text-xs font-mono-code text-slate-400 mt-0.5">
                  Official rankings for recruited members of ENISO CyberGuards.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Live indicator + countdown */}
            <div className="flex items-center gap-2 bg-[#131c2e] border border-[#1e293b] px-3 py-1.5 rounded-lg">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono-code text-emerald-400 font-bold tracking-wider">LIVE</span>
              {lastUpdated && (
                <span className="text-[11px] font-mono-code text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-400" />
                  {lastUpdated}
                </span>
              )}
              <span className="text-[10px] font-mono-code text-slate-500 border-l border-[#1e293b] pl-2">
                ↻ {countdown}s
              </span>
            </div>
            <button
              onClick={() => fetchScoreboard(true)}
              disabled={refreshing}
              className="px-3.5 py-1.5 rounded-lg bg-[#131c2e] border border-[#1e293b] hover:border-[#334155] text-slate-300 hover:text-white text-xs font-mono-code flex items-center gap-2 transition-all shadow-sm disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
              REFRESH
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Table Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <ScoreboardTable leaderboard={leaderboard} />
          </div>

          {/* Real-time Solve Feed Column (1 Col) */}
          <div className="space-y-4">
            <div className="surface-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-mono-code font-bold text-white uppercase tracking-wider">
                    LIVE TICKER
                  </h3>
                </div>
                <span className="text-[10px] font-mono-code text-slate-500">↻ {countdown}s</span>
              </div>

              <LiveSolveFeed feed={feed} />
            </div>
          </div>

        </div>

      </main>

      {/* Command Line Console Overlay */}
      <CommandConsoleOverlay isOpen={consoleOpen} onClose={() => setConsoleOpen(false)} />
    </div>
  );
}
