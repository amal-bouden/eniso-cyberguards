'use client';

import React, { useState } from 'react';
import { Lock, Unlock, ShieldCheck, CheckCircle2, ArrowRight, ExternalLink, Key, Code, Terminal } from 'lucide-react';

export default function VisitorAccessPortal() {
  const [step1Passed, setStep1Passed] = useState(false);
  const [step2Passed, setStep2Passed] = useState(false);

  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');
  
  const [error1, setError1] = useState('');
  const [error2, setError2] = useState('');

  // Challenge 1: Hex string "4359424552475541524453" -> ASCII "CYBERGUARDS"
  const handleVerifyStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (input1.trim().toUpperCase() === 'CYBERGUARDS') {
      setStep1Passed(true);
      setError1('');
    } else {
      setError1('INVALID DECODE KEY: Decode the hex string 4359424552475541524453');
    }
  };

  // Challenge 2: Secret header / token calculation check "CYBERGUARDS-2026"
  const handleVerifyStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (input2.trim().toUpperCase() === 'CYBERGUARDS-2026') {
      setStep2Passed(true);
      setError2('');
    } else {
      setError2('ACCESS DENIED: Re-calculate HMAC key using "CYBERGUARDS" + "-" + "2026"');
    }
  };

  const isUnlocked = step1Passed && step2Passed;

  return (
    <div className="bg-[#090D16] border border-[#00E5FF]/40 rounded-xl p-6 md:p-8 space-y-6 shadow-[0_0_30px_rgba(0,229,255,0.15)] cyber-clip">
      <div className="border-b border-[#1E293B] pb-4 space-y-2">
        <div className="flex items-center gap-2">
          <Lock className={`w-5 h-5 ${isUnlocked ? 'text-[#00FF66]' : 'text-[#00E5FF]'}`} />
          <h2 className="text-lg font-mono-cyber font-bold text-white tracking-wider flex items-center gap-2">
            VISITOR MEMBERSHIP APPLICATION GATEWAY
            {isUnlocked && (
              <span className="text-xs px-2 py-0.5 rounded bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40 flex items-center gap-1 font-bold">
                <Unlock className="w-3.5 h-3.5" /> UNLOCKED
              </span>
            )}
          </h2>
        </div>
        <p className="text-xs text-slate-400 font-sans">
          To prevent automated spam and ensure recruit readiness, prospective CyberGuards recruits must solve 2 initial screening challenges to unlock the official membership application form.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Challenge 1 */}
        <div className={`p-5 rounded-lg border space-y-4 ${
          step1Passed
            ? 'bg-[#00FF66]/5 border-[#00FF66]/50'
            : 'bg-[#05070B] border-[#1E293B]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono-cyber font-bold text-[#00E5FF] flex items-center gap-1.5">
              <Code className="w-4 h-4" /> RECRUIT TEST #1: HEX DECODER
            </span>
            {step1Passed ? (
              <span className="text-xs text-[#00FF66] font-mono-cyber font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> PASSED
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono-cyber">LOCKED</span>
            )}
          </div>

          <div className="p-3 bg-[#090D16] border border-slate-800 rounded text-xs font-mono-cyber text-slate-300">
            <p className="text-slate-400 mb-1">Decode the hex payload into plain text:</p>
            <code className="text-[#00E5FF] font-bold tracking-wider block bg-black p-2 rounded">
              43 59 42 45 52 47 55 41 52 44 53
            </code>
          </div>

          {!step1Passed ? (
            <form onSubmit={handleVerifyStep1} className="space-y-2">
              <input
                type="text"
                value={input1}
                onChange={(e) => setInput1(e.target.value)}
                placeholder="Enter decoded ASCII text..."
                className="w-full bg-[#05070B] border border-[#1E293B] focus:border-[#00E5FF] rounded px-3 py-2 text-xs font-mono-cyber text-white outline-none"
              />
              {error1 && <p className="text-[11px] font-mono-cyber text-[#FF0055]">{error1}</p>}
              <button
                type="submit"
                className="w-full py-2 bg-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF] hover:text-black rounded font-mono-cyber font-bold text-xs transition-all border border-[#00E5FF]/40"
              >
                VERIFY TEST #1
              </button>
            </form>
          ) : (
            <p className="text-xs font-mono-cyber text-[#00FF66]">
              ✓ Test #1 Decoded successfully! Key verified.
            </p>
          )}
        </div>

        {/* Challenge 2 */}
        <div className={`p-5 rounded-lg border space-y-4 ${
          step2Passed
            ? 'bg-[#00FF66]/5 border-[#00FF66]/50'
            : 'bg-[#05070B] border-[#1E293B]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono-cyber font-bold text-[#00E5FF] flex items-center gap-1.5">
              <Key className="w-4 h-4" /> RECRUIT TEST #2: SECURITY STRING SYNTHESIS
            </span>
            {step2Passed ? (
              <span className="text-xs text-[#00FF66] font-mono-cyber font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> PASSED
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono-cyber">LOCKED</span>
            )}
          </div>

          <div className="p-3 bg-[#090D16] border border-slate-800 rounded text-xs font-mono-cyber text-slate-300">
            <p className="text-slate-400 mb-1">Synthesize token using hyphenated uppercase formula:</p>
            <code className="text-[#00E5FF] font-bold tracking-wider block bg-black p-2 rounded">
              "CYBERGUARDS" + "-" + "2026"
            </code>
          </div>

          {!step2Passed ? (
            <form onSubmit={handleVerifyStep2} className="space-y-2">
              <input
                type="text"
                value={input2}
                onChange={(e) => setInput2(e.target.value)}
                placeholder="Enter synthesized security token..."
                className="w-full bg-[#05070B] border border-[#1E293B] focus:border-[#00E5FF] rounded px-3 py-2 text-xs font-mono-cyber text-white outline-none"
              />
              {error2 && <p className="text-[11px] font-mono-cyber text-[#FF0055]">{error2}</p>}
              <button
                type="submit"
                className="w-full py-2 bg-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF] hover:text-black rounded font-mono-cyber font-bold text-xs transition-all border border-[#00E5FF]/40"
              >
                VERIFY TEST #2
              </button>
            </form>
          ) : (
            <p className="text-xs font-mono-cyber text-[#00FF66]">
              ✓ Test #2 Synthesized successfully! Token accepted.
            </p>
          )}
        </div>

      </div>

      {/* Unlocked Link */}
      {isUnlocked ? (
        <div className="p-6 bg-[#00FF66]/10 border-2 border-[#00FF66] rounded-lg text-center space-y-3 matrix-glow">
          <ShieldCheck className="w-10 h-10 text-[#00FF66] mx-auto animate-bounce" />
          <h3 className="text-base font-mono-cyber font-bold text-white tracking-wider">
            ALL RECRUIT ACCESS CHALLENGES COMPLETED!
          </h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            You have proven your basic cybersecurity competence. Submit your official application form to join the CyberGuards squad.
          </p>
          <a
            href="https://forms.google.com/cyberguards-application"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00FF66] text-black font-mono-cyber font-extrabold text-sm rounded-lg hover:bg-[#00FF66]/90 transition-all shadow-lg"
          >
            SUBMIT CLUB APPLICATION FORM (GOOGLE SHEETS) <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div className="p-4 bg-[#05070B] border border-slate-800 rounded text-center text-xs font-mono-cyber text-slate-500">
          Complete both recruit tests above to unlock the official CyberGuards application form.
        </div>
      )}
    </div>
  );
}
