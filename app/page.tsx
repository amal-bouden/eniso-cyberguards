'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import LiveSolveFeed from '@/components/LiveSolveFeed';
import CommandConsoleOverlay from '@/components/CommandConsoleOverlay';
import TextScramble from '@/components/ui/TextScramble';
import SplashScreen from '@/components/SplashScreen';
import { 
  Shield, 
  Terminal, 
  Trophy, 
  Flag, 
  Flame, 
  CheckCircle2, 
  Lock, 
  Globe, 
  Cpu, 
  Binary, 
  KeyRound, 
  Search, 
  FileCode,
  ArrowRight,
  UserCheck
} from 'lucide-react';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'MEMBER' | 'ADMIN';
}

export default function MemberPortalHome() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };
  const [inviteStatus, setInviteStatus] = useState<{ success: boolean; msg: string } | null>(null);

  const [stats, setStats] = useState({
    challenges: 0,
    solves: 0,
    members: 0,
    firstBloods: 0,
  });

  useEffect(() => {
    fetchSessionAndStats();
  }, []);

  const fetchSessionAndStats = async () => {
    try {
      const [authRes, chalRes, scoreRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/challenges'),
        fetch('/api/scoreboard'),
      ]);

      const authData = await authRes.json();
      const chalData = await chalRes.json();
      const scoreData = await scoreRes.json();

      if (authData.user) setUser(authData.user);

      const challengesList = chalData.challenges || [];
      const totalSolves = challengesList.reduce((acc: number, c: any) => acc + (c.solveCount || 0), 0);
      const totalFirstBloods = challengesList.filter((c: any) => !!c.firstBlood).length;

      setStats({
        challenges: challengesList.length,
        solves: totalSolves,
        members: scoreData.leaderboard?.length || 0,
        firstBloods: totalFirstBloods,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickInviteVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;

    try {
      const res = await fetch('/api/auth/verify-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCodeInput.trim() }),
      });
      const data = await res.json();

      if (data.valid) {
        setInviteStatus({ success: true, msg: 'Passcode verified. Redirecting to registration...' });
        setTimeout(() => {
          window.location.href = `/register?code=${encodeURIComponent(inviteCodeInput.trim())}`;
        }, 800);
      } else {
        setInviteStatus({ success: false, msg: data.message || 'Invalid or exhausted recruit passcode.' });
      }
    } catch {
      window.location.href = `/register?code=${encodeURIComponent(inviteCodeInput.trim())}`;
    }
  };

  const categories = [
    { title: 'Web Exploitation', count: 'OWASP Top 10, Injection, Auth Bypass', icon: Globe, color: 'text-sky-400', border: 'border-sky-500/20' },
    { title: 'Reverse Engineering', count: 'ELF, x86_64, Ghidra Analysis, Patching', icon: Cpu, color: 'text-amber-400', border: 'border-amber-500/20' },
    { title: 'Binary Exploitation (Pwn)', count: 'Buffer Overflow, ROP Chains, Shellcoding', icon: Binary, color: 'text-rose-400', border: 'border-rose-500/20' },
    { title: 'Cryptography', count: 'RSA, ECC, AES Modes, Quantum-Resistant', icon: KeyRound, color: 'text-purple-400', border: 'border-purple-500/20' },
    { title: 'Digital Forensics', count: 'PCAP, Memory Dumps, Steganography', icon: FileCode, color: 'text-emerald-400', border: 'border-emerald-500/20' },
    { title: 'Network & OSINT', count: 'Reconnaissance, Pivoting, Metadata Extraction', icon: Search, color: 'text-cyan-400', border: 'border-cyan-500/20' },
  ];

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative">
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      
      {/* Navbar */}
      <Navbar onOpenConsole={() => setConsoleOpen(true)} />

      {/* Hero Header & Member Portal Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Main Hero Header — TryHackMe / Hack The Box Structure */}
        <section className="relative text-center space-y-5 pt-4 pb-2">
          
          {/* Top Operational Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#131c2e] border border-[#1e293b] text-xs font-mono-code text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-white font-medium">ENISO CYBERGUARDS</span>
            <span className="text-slate-600">•</span>
            <span className="text-blue-400">OPERATIONAL CTF LAB</span>
          </div>

          {/* Authentic Spartan Helmet Emblem Header */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="relative w-44 h-44 mx-auto">
              <Image
                src="/logo.png"
                alt="ENISO CyberGuards Spartan Logo"
                fill
                className="object-contain"
                priority
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono-code text-slate-400 tracking-wider uppercase">
                NATIONAL ENGINEERING SCHOOL OF SOUSSE
              </span>
              <TextScramble
                text="CYBERGUARDS"
                as="h1"
                className="text-3xl sm:text-5xl font-mono-code font-bold text-white tracking-tight"
                speed={22}
                scrambleCycles={4}
                delay={200}
                showCursor
                triggerKey={showSplash}
              />
            </div>

            <TextScramble
              text="Exclusive CTF war-room for ENISO CyberGuards recruits."
              as="p"
              className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed"
              speed={14}
              scrambleCycles={2}
              delay={500}
              triggerKey={showSplash}
            />
          </div>

          {/* Action Callouts */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {user ? (
              <Link
                href="/challenges"
                className="px-5 py-2.5 rounded-lg bg-[#1a3a6e] hover:bg-[#1e4080] text-white font-mono-code font-semibold text-xs tracking-wide transition-all shadow-sm flex items-center gap-2"
              >
                <Flag className="w-4 h-4" /> LAUNCH TARGETS MATRIX
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-lg bg-[#1a3a6e] hover:bg-[#1e4080] text-white font-mono-code font-semibold text-xs tracking-wide transition-all shadow-sm flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" /> MEMBER SIGN IN
              </Link>
            )}

            <Link
              href="/scoreboard"
              className="px-5 py-2.5 rounded-lg bg-[#131c2e] hover:bg-[#18243b] border border-[#1e293b] text-slate-200 font-mono-code font-medium text-xs tracking-wide transition-all flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-amber-400" /> LEADERBOARD RANKINGS
            </Link>

            <button
              onClick={() => setConsoleOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-[#131c2e] hover:bg-[#18243b] border border-[#1e293b] text-emerald-400 font-mono-code font-medium text-xs tracking-wide transition-all flex items-center gap-2"
            >
              <Terminal className="w-4 h-4" /> CLI OVERLAY
            </button>
          </div>
        </section>

        {/* Live Operative Telemetry Bar — HTB/TryHackMe Style Metric Boxes */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="surface-card p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono-code uppercase tracking-wider">ACTIVE OPERATIVES</span>
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-mono-code font-bold text-white">
              {stats.members || 3}
            </div>
            <p className="text-[11px] text-slate-400 font-mono-code">Recruited Members</p>
          </div>

          <div className="surface-card p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono-code uppercase tracking-wider">ACTIVE MACHINES</span>
              <Flag className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-mono-code font-bold text-white">
              {stats.challenges || 6}
            </div>
            <p className="text-[11px] text-slate-400 font-mono-code">Per-Member Targets</p>
          </div>

          <div className="surface-card p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono-code uppercase tracking-wider">VALID SOLVES</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-mono-code font-bold text-emerald-400">
              {stats.solves || 4}
            </div>
            <p className="text-[11px] text-slate-400 font-mono-code">Flags Submitted</p>
          </div>

          <div className="surface-card p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono-code uppercase tracking-wider">FIRST BLOODS</span>
              <Flame className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-mono-code font-bold text-rose-400">
              {stats.firstBloods || 2}
            </div>
            <p className="text-[11px] text-slate-400 font-mono-code">Speed Exploits</p>
          </div>
        </section>

        {/* Member Recruit Passcode Verification Section */}
        {!user && (
          <section className="surface-card p-6 space-y-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono-code bg-[#0b0f19] text-blue-400 border border-blue-500/20">
                  <Lock className="w-3 h-3 text-amber-400" /> RECRUIT PASSCODE ACTIVATION
                </div>
                <h2 className="text-lg font-mono-code font-bold text-white">Have an Executive Invite Code?</h2>
                <p className="text-xs text-slate-400">
                  Recruited members are issued a single-use passcode by ENISO CyberGuards club leads to register their operative account.
                </p>
              </div>

              <Link
                href="/login"
                className="px-3.5 py-2 rounded-lg bg-[#0b0f19] hover:bg-[#18243b] border border-[#1e293b] text-xs font-mono-code text-slate-300 transition-all shrink-0"
              >
                ALREADY REGISTERED? SIGN IN →
              </Link>
            </div>

            <form onSubmit={handleQuickInviteVerification} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  placeholder="Enter Passcode (e.g. CYBERGUARDS-2026-CTF)"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#0b0f19] border border-[#1e293b] text-white font-mono-code text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono-code font-semibold text-xs tracking-wide transition-all shrink-0"
                >
                  VERIFY & REGISTER
                </button>
              </div>

              {inviteStatus && (
                <div
                  className={`p-3 rounded-lg border text-xs font-mono-code ${
                    inviteStatus.success
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-800 text-rose-300'
                  }`}
                >
                  {inviteStatus.msg}
                </div>
              )}
            </form>
          </section>
        )}

        {/* Operational Categories — TryHackMe & HTB Style Cards */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
            <div>
              <h2 className="text-base font-mono-code font-bold text-white tracking-tight uppercase">ATTACK CATEGORIES</h2>
              <p className="text-xs text-slate-400">Core offensive security domains tailored for ENISO engineering students</p>
            </div>
            <Link
              href="/challenges"
              className="text-xs font-mono-code text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              VIEW ALL TARGETS <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={idx}
                  href="/challenges"
                  className="surface-card p-4 hover:border-[#3b82f6]/40 transition-all space-y-2.5 block"
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-[#0b0f19] border border-[#1e293b]">
                      <Icon className={`w-4 h-4 ${cat.color}`} />
                    </span>
                    <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-[#0b0f19] text-slate-400 border border-[#1e293b]">
                      CTF TARGETS
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-mono-code font-bold text-white">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">{cat.count}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Live Solves Feed Ticker */}
        <section className="surface-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xs font-mono-code font-bold text-white uppercase tracking-wider">LIVE SOLVE TELEMETRY</h2>
            </div>
            <span className="text-[11px] font-mono-code text-slate-500">Real-time Activity</span>
          </div>

          <LiveSolveFeed />
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e293b] bg-[#080c14] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-mono-code">
          <div className="flex items-center gap-2.5">
            <div className="relative w-5 h-5">
              <Image src="/logo.png" alt="Spartan Helmet" fill className="object-contain" />
            </div>
            <span>ENISO CYBERGUARDS © 2026 • NATIONAL ENGINEERING SCHOOL OF SOUSSE</span>
          </div>
          <div>OPERATIONAL CTF PLATFORM v2.5</div>
        </div>
      </footer>

      {/* Command Line Console Overlay */}
      <CommandConsoleOverlay isOpen={consoleOpen} onClose={() => setConsoleOpen(false)} />
    </div>
  );
}
