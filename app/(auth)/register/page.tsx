'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { UserPlus, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import CommandConsoleOverlay from '@/components/CommandConsoleOverlay';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('CYBERGUARDS-2026-CTF');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [consoleOpen, setConsoleOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !inviteCode) {
      setError('All fields including Invite Passcode are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, inviteCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      router.push('/challenges');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col page-bg">
      <Navbar onOpenConsole={() => setConsoleOpen(true)} />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md surface-card p-7 space-y-5">
          
          {/* Header */}
          <div className="text-center space-y-2.5">
            <div className="relative w-14 h-14 mx-auto">
              <Image src="/logo.png" alt="ENISO CyberGuards Spartan Logo" fill className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-lg font-mono-code font-bold text-white tracking-tight uppercase">
                RECRUIT REGISTRATION
              </h1>
              <p className="text-xs font-mono-code text-slate-400 mt-0.5">
                Executive passcode validation for ENISO CyberGuards
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-lg text-xs font-mono-code flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-mono-code text-slate-400 font-medium">
                RECRUIT PASSCODE
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="CYBERGUARDS-2026-CTF"
                className="w-full bg-[#0b0f19] border border-blue-500/40 text-blue-400 focus:border-blue-500 rounded-lg px-3.5 py-2 text-xs font-mono-code placeholder:text-slate-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono-code text-slate-400 font-medium">
                OPERATIVE HANDLE
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. shadow_operative"
                className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-blue-500 rounded-lg px-3.5 py-2 text-xs font-mono-code text-white placeholder:text-slate-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono-code text-slate-400 font-medium">
                INSTITUTIONAL EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operative@eniso.u-sousse.tn"
                className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-blue-500 rounded-lg px-3.5 py-2 text-xs font-mono-code text-white placeholder:text-slate-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono-code text-slate-400 font-medium">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-blue-500 rounded-lg px-3.5 py-2 text-xs font-mono-code text-white placeholder:text-slate-500 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono-code font-semibold text-xs tracking-wide transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {loading ? 'INITIALIZING OPERATIVE ACCOUNT...' : 'ACTIVATE ACCOUNT'}
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="pt-3 border-t border-[#1e293b] text-center text-xs font-mono-code text-slate-400">
            <span>Already have an account? </span>
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
              Sign In
            </Link>
          </div>

        </div>
      </main>

      <CommandConsoleOverlay isOpen={consoleOpen} onClose={() => setConsoleOpen(false)} />
    </div>
  );
}
