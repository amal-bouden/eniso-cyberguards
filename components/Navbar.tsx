'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Terminal, Shield, Trophy, Flag, LogOut, Menu, X, KeyRound, Lock, User } from 'lucide-react';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'MEMBER' | 'ADMIN';
}

interface NavbarProps {
  onOpenConsole?: () => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export default function Navbar({ onOpenConsole }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const navLinks = [
    { href: '/', label: 'HOME', icon: Shield },
    { href: '/challenges', label: 'CHALLENGES', icon: Flag },
    { href: '/scoreboard', label: 'SCOREBOARD', icon: Trophy },
  ];

  if (user?.role === 'ADMIN') {
    navLinks.push({ href: '/admin', label: 'ADMIN OPS', icon: KeyRound });
  }

  return (
    <header className="sticky top-0 z-50 bg-[#040711]/95 backdrop-blur-md border-b border-[#172447] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Authentic Spartan Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="ENISO CyberGuards Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5 font-mono-code font-bold text-sm tracking-tight text-white">
              <span className="text-[10px] text-blue-400 font-sans tracking-normal uppercase">ENISo</span>
              <span>CYBER<span className="text-slate-400 font-medium">GUARDS</span></span>
            </div>
            <span className="text-[9px] font-mono-code text-slate-400 tracking-wider uppercase -mt-0.5">
              CYBERSECURITY CLUB
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links — Clean TryHackMe / HTB Style */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono-code tracking-wide flex items-center gap-2 transition-colors ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0a1024]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls & User Menu */}
        <div className="flex items-center gap-2.5">
          
          {/* CLI Drawer Button */}
          <button
            onClick={onOpenConsole}
            title="Toggle Terminal Console (Ctrl + ~)"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a1024] border border-[#172447] text-slate-300 hover:text-white hover:border-[#24386b] text-xs font-mono-code transition-all"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">CLI</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.2 text-[10px] bg-[#040711] text-slate-400 rounded border border-[#172447]">
              ~
            </kbd>
          </button>

          {/* User Auth Status */}
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a1024] border border-[#172447] text-xs font-mono-code">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-200 font-medium">{user.username}</span>
                    {user.role === 'ADMIN' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-950/80 text-red-400 border border-red-800/60 font-bold">
                        ADMIN
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-[#0a1024] transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-mono-code text-slate-300 hover:text-white hover:bg-[#0a1024] transition-all border border-[#172447]"
                  >
                    SIGN IN
                  </Link>

                  <Link
                    href="/register"
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-mono-code font-semibold text-xs hover:bg-blue-500 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    REGISTER
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#0a1024]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#070c1d] border-b border-[#172447] px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono-code ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-[#0a1024]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
