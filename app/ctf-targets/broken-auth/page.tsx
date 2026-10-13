'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Database, Lock, Search, AlertCircle, ArrowLeft } from 'lucide-react';

export default function BrokenAuthTargetPage() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: number; title: string }> | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const initialNotes = [
    { id: 1, title: "Reminder: rotate the guest wifi password" },
    { id: 2, title: "Room booking for Thursday's workshop confirmed" },
    { id: 3, title: "Printer on 2nd floor is out of toner again" },
    { id: 4, title: "Follow up with sponsors about swag order" },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginMessage(null);

    const u = username.trim();
    const p = password.trim();

    // Emulate raw SQL query:
    // SELECT id, username, is_admin FROM users WHERE username = '${username}' AND password = '${password}'
    // Check if SQL injection was used to bypass admin check:
    const isSqliBypass =
      (u.includes("'") && (u.includes("--") || u.includes("#") || u.toLowerCase().includes("or '1'='1") || u.toLowerCase().includes("or 1=1"))) &&
      (u.toLowerCase().startsWith("admin") || u.toLowerCase().includes("admin"));

    if (isSqliBypass) {
      setIsAdminLoggedIn(true);
      setLoginMessage(null);
      return;
    }

    if (u === 'admin' && p === 'Xk9#mP2$vQ8nL5wR') {
      setIsAdminLoggedIn(true);
      return;
    }

    if (u === 'guest' && p === 'guest123') {
      setLoginMessage({ text: 'Welcome, guest. You are logged in, but you are not an admin.', success: true });
      return;
    }

    if (u.includes("'") && !u.includes("--") && !u.includes("#")) {
      setLoginMessage({ text: 'Database error: near "\'": syntax error in SQL query: SELECT id, username, is_admin FROM users WHERE username = \'' + username + '\' AND password = \'' + password + '\'', success: false });
      return;
    }

    setLoginMessage({ text: 'Invalid username or password.', success: false });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);

    const q = query.trim();
    if (!q) {
      setResults(null);
      return;
    }

    // Emulate SQL injection on notes search:
    // SELECT id, title FROM notes WHERE title LIKE '%${q}%'
    // Intended payload: zzz' UNION SELECT id, title FROM secrets --
    const lower = q.toLowerCase();
    if (lower.includes('union') && lower.includes('select')) {
      if (lower.includes('secrets')) {
        // Successful UNION injection extraction!
        setResults([
          { id: 99, title: "ECCC{sql_injection_master}" }
        ]);
        return;
      } else {
        // UNION injection but querying wrong table
        setSearchError('Database error: no such table in UNION query. Hint: the security review noted that administrative flags were isolated in the `secrets` table.');
        setResults([]);
        return;
      }
    }

    if (q.includes("'") && !q.includes("--") && !q.includes("#")) {
      setSearchError('Database error: unrecognized token in query: SELECT id, title FROM notes WHERE title LIKE \'%' + q + '%\'');
      setResults([]);
      return;
    }

    const filtered = initialNotes.filter((n) => n.title.toLowerCase().includes(q.toLowerCase()));
    setResults(filtered);
  };

  return (
    <div className="min-h-screen bg-[#0a0e12] text-[#dbe4e8] font-mono p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full space-y-6">
        
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            href="/challenges"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Operational CTF Lab
          </Link>
          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400">
            TARGET LIVE PORT 5001 (EMULATED)
          </span>
        </div>

        {!isAdminLoggedIn ? (
          /* Login Card */
          <div className="bg-[#10161c] border border-[#1f2b33] rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-[#39ff8f] flex items-center gap-2">
                <Shield className="w-5 h-5" /> &gt; CyberGuard Intranet Login
              </h1>
              <p className="text-xs text-slate-400">
                Internal member access portal. Unsanitized input is piped into raw SQL.
              </p>
            </div>

            {/* CTF Target Goal Banner — ensures participants know this is the target, not a site login barrier */}
            <div className="p-3 rounded-lg bg-blue-950/60 border border-blue-800/60 text-xs text-blue-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  <strong className="text-blue-300">CTF OBJECTIVE:</strong> Bypass this login using SQL Injection (e.g. <code className="text-amber-300">admin&apos; --</code>).
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUsername("admin' -- ");
                  setPassword("anything");
                }}
                className="px-2.5 py-1 rounded bg-blue-600/40 hover:bg-blue-600 border border-blue-400/50 text-[11px] font-bold text-white transition-all shrink-0 cursor-pointer"
              >
                Insert SQLi
              </button>
            </div>

            {loginMessage && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  loginMessage.success
                    ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/80 border border-rose-800 text-rose-300'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold block">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin' -- "
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0e12] border border-[#1f2b33] focus:border-[#39ff8f] text-white text-xs outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold block">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="anything (bypassed if comment character used)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0e12] border border-[#1f2b33] focus:border-[#39ff8f] text-white text-xs outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#39ff8f] hover:bg-[#34e27f] text-[#04140a] font-bold text-xs uppercase tracking-wider transition-all"
              >
                Sign in
              </button>
            </form>

            <div className="pt-2 border-t border-[#1f2b33] text-[11px] text-slate-500">
              Target query: <code className="text-[#3fb0ff]">SELECT id, username, is_admin FROM users WHERE username = '{'{username}'}' AND password = '{'{password}'}'</code>
            </div>
          </div>
        ) : (
          /* Admin Search View */
          <div className="bg-[#10161c] border border-[#1f2b33] rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#1f2b33] pb-4">
              <div>
                <h1 className="text-xl font-bold text-[#39ff8f] flex items-center gap-2">
                  <Database className="w-5 h-5" /> &gt; Internal Notes Search
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Authenticated as <span className="text-[#39ff8f] font-bold">admin</span>. Flag moved to internal <code className="text-amber-400">secrets</code> table.
                </p>
              </div>
              <button
                onClick={() => setIsAdminLoggedIn(false)}
                className="text-[11px] px-2.5 py-1 rounded bg-[#1f2b33] hover:bg-[#2e3e4a] text-slate-300"
              >
                Sign out
              </button>
            </div>

            {searchError && (
              <div className="p-3 rounded-lg text-xs bg-rose-950/80 border border-rose-800 text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold block">Search Query</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. zzz' UNION SELECT id, title FROM secrets --"
                    className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#0a0e12] border border-[#1f2b33] focus:border-[#39ff8f] text-white text-xs outline-none transition-all placeholder:text-slate-600"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-[#39ff8f] hover:bg-[#34e27f] text-[#04140a] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5" /> Search
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Search Results</h2>
              {results === null ? (
                <p className="text-xs text-slate-600 italic">Enter a query above to query the database.</p>
              ) : results.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No matching notes returned.</p>
              ) : (
                <ul className="divide-y divide-[#1f2b33] rounded-lg border border-[#1f2b33] bg-[#0a0e12] overflow-hidden">
                  {results.map((r) => (
                    <li key={r.id} className="p-3 text-xs flex items-center justify-between">
                      <span className="text-slate-400 font-mono">#{r.id}</span>
                      <span className={r.title.startsWith('ECCC{') ? 'text-[#39ff8f] font-bold select-all bg-[#10161c] px-2 py-0.5 rounded border border-[#39ff8f]/30' : 'text-slate-200'}>
                        {r.title}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-2 border-t border-[#1f2b33] text-[11px] text-slate-500">
              Target query: <code className="text-[#3fb0ff]">SELECT id, title FROM notes WHERE title LIKE '%{'{query}'}%'</code>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
