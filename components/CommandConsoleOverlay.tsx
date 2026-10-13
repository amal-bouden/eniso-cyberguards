'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, Send } from 'lucide-react';

const ASCII_BANNER = `
                                                     9@0                                                   
                                                   1@@@@@.                                                 
                                                 ;@@@@@@@@@+                                               
                                                 @@@@@@@@@@#                                               
                                                 @@@@@@@@@@#                                               
                                           .a    @@@@@@@@@@#    4                                          
                                          9@8    @@@@@@@@@@#    @@5                                        
                                        7@@@7    @@@@@@@@@@#    @@@@0                                      
                                      2@@@@@7    @@@@@@@@@@#    @@@@@@+                                    
                                    :@@@@@@@7    @@@@@@@@@@#    @@@@@@@#                                   
                                   @@@@@@@@@7    @@@@@@@@@@#    @@@@@@@@@$                                 
                                 #@@@@@@@@@@7    ,---------,    @@@@@@@@@@@5                               
                               =#@@@@@@@@@@@7                   @@@@@@@@@@@@6.                             
                              b@@@@@@@@@@@@@8+++++++++++++++++++@@@@@@@@@@@@@9                             
                             =W@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@6                            
                             !@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@_                           
                             @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@7                           
                             @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                           
                             @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                           
                             @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@W@@@@@@@@@@                           
                             @@@@@@@@0_ c@@@@@@@@@@@@@@@@@@@@@@@@@@#+ ,7@@@@@@@@                           
                             @@@@@@0_     :@@@@@@@@@@@@@@@@@@@@@@@=     +$@@@@@@                           
                             @@@@@@.        2@@@@@@@@@@@@@@@@@@@         2@@@@@@                           
                             @@@@@@@@-        9@@@@@@@@@@@@@@@0        :@@@@@@@@                           
                             @@@@@@@@@$=        #@@@@@@@@@@@8        ;@@@@@@@@@@                           
                             @@@@@@@@@@@7,       @@@@@@@@@@#       :W@@@@@@@@@@@                           
                             @@@@@@@@@@@@@3      @@@@@@@@@@#     -9@@@@@@@@@@@@@                           
                             @@@@@@@@@@@@@@@c    @@@@@@@@@@#    2@@@@@@@@@@@@@@@                           
                             @@@@@@@@@@@@@@@6    @@@@@@@@@@#    #@@@@@@@@@@@@@@@                           
                             @@@@@@@@@@@@@@@6    @@@@@@@@@@#    #@@@@@@@@@@@@@@@                           
                            _@@@@@@@@@@@@@@@6    #@@@@@@@@@6    #@@@@@@@@@@@@@@@                           
                          _@@@@@@@@@@@@@@@@@6     c@@@@@@9-     #@@@@@@@@@@@@@@@@$                         
                        _W@@@@@@@@@@@@@@@@@@6      _0@@W=       #@@@@@@@@@@@@@@@@@@3                       
                        8@@@@@@@@@@@@@@@@@@@6                   #@@@@@@@@@@@@@@@@@@@a                      
                          #@@@@@@@@@@@@@@@@@6                   #@@@@@@@@@@@@@@@@@7                        
                            @@@@@@@@@@@@@@@@6                   #@@@@@@@@@@@@@@W                          
                             :@@@@@@@@@@@@@@6                   #@@@@@@@@@@@@                              
                               2@@@@@@@@@@@@6                   #@@@@@@@@@@0                               
                                 6@@@@@@@@@@6                   #@@@@@@@@3                                 
                                   ,$@@@@@@6                   #@@@@@@4                                   
                                      :#@@@@6                   #@@@@8.                                    
                                        :@@@6                   #@@#-                                      
                                          -@6                   #@.                                        
`;

interface ConsoleOutput {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'banner';
  text: string;
}

interface CommandConsoleOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandConsoleOverlay({ isOpen, onClose }: CommandConsoleOverlayProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ConsoleOutput[]>([
    {
      id: 'init-banner',
      type: 'banner',
      text: ASCII_BANNER,
    },
    {
      id: 'init-msg',
      type: 'success',
      text: 'SYSTEM BOOT SUCCESSFUL. Type "help" to view available terminal commands.',
    },
  ]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Print ASCII Banner to browser console on mount
  useEffect(() => {
    console.log(`%c${ASCII_BANNER}`, 'color: #00E5FF; font-family: monospace; font-weight: bold;');
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Scroll to bottom on new output
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Global Ctrl + ~ keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === '`' || e.key === '~')) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open overlay
          const btn = document.getElementById('toggle-cli-btn');
          btn?.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCommand = async (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    // Add to command history
    setCmdHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const newHistory: ConsoleOutput[] = [
      ...history,
      { id: Math.random().toString(), type: 'input', text: `cyberguards@spartan:~$ ${trimmed}` },
    ];

    const parts = trimmed.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        newHistory.push({
          id: Math.random().toString(),
          type: 'output',
          text: `
AVAILABLE COMMANDS:
-------------------------------------------------------------
help                       Display command manual
banner                     Render Spartan ASCII Banner
challenges                 Fetch list of active CTF challenges
scoreboard                 Fetch top 5 leaderboard rankings
submit <id> <flag>         Submit flag for a challenge
whoami                     Show active user session details
clear                      Clear terminal console log
exit                       Close command terminal overlay
-------------------------------------------------------------`,
        });
        break;

      case 'banner':
        newHistory.push({
          id: Math.random().toString(),
          type: 'banner',
          text: ASCII_BANNER,
        });
        break;

      case 'clear':
        setHistory([]);
        setInput('');
        return;

      case 'exit':
      case 'close':
        onClose();
        setInput('');
        return;

      case 'whoami':
        try {
          const res = await fetch('/api/auth/me');
          const data = await res.json();
          if (data.user) {
            newHistory.push({
              id: Math.random().toString(),
              type: 'success',
              text: `USER SESSION: Username: ${data.user.username} | Email: ${data.user.email} | Role: ${data.user.role}`,
            });
          } else {
            newHistory.push({
              id: Math.random().toString(),
              type: 'error',
              text: 'NOT AUTHENTICATED: Log in to submit flags and track solves.',
            });
          }
        } catch {
          newHistory.push({ id: Math.random().toString(), type: 'error', text: 'Error fetching user session' });
        }
        break;

      case 'challenges':
        try {
          const res = await fetch('/api/challenges');
          const data = await res.json();
          if (data.challenges && data.challenges.length > 0) {
            let list = 'CHALLENGES LIST:\nID                             CATEGORY    PTS    SOLVES  TITLE\n';
            list += '------------------------------------------------------------------------------------\n';
            data.challenges.forEach((c: any) => {
              const solvedTag = c.isSolved ? '[SOLVED]' : '        ';
              list += `${c.id.padEnd(30)} ${c.category.padEnd(10)} ${String(c.points).padStart(4)}   ${String(c.solveCount).padStart(5)}   ${c.title} ${solvedTag}\n`;
            });
            newHistory.push({ id: Math.random().toString(), type: 'output', text: list });
          } else {
            newHistory.push({ id: Math.random().toString(), type: 'output', text: 'No active challenges found.' });
          }
        } catch {
          newHistory.push({ id: Math.random().toString(), type: 'error', text: 'Failed to fetch challenges.' });
        }
        break;

      case 'scoreboard':
        try {
          const res = await fetch('/api/scoreboard');
          const data = await res.json();
          if (data.leaderboard && data.leaderboard.length > 0) {
            let list = 'LEADERBOARD (TOP 5):\nRANK  MEMBER                    SOLVES    TOTAL POINTS\n';
            list += '--------------------------------------------------------------\n';
            data.leaderboard.slice(0, 5).forEach((m: any) => {
              list += `#${String(m.rank).padEnd(4)} ${m.username.padEnd(25)} ${String(m.solvedCount).padStart(6)}    ${String(m.totalPoints).padStart(12)} pts\n`;
            });
            newHistory.push({ id: Math.random().toString(), type: 'output', text: list });
          } else {
            newHistory.push({ id: Math.random().toString(), type: 'output', text: 'Scoreboard empty.' });
          }
        } catch {
          newHistory.push({ id: Math.random().toString(), type: 'error', text: 'Failed to fetch scoreboard.' });
        }
        break;

      case 'submit':
        if (args.length < 2) {
          newHistory.push({
            id: Math.random().toString(),
            type: 'error',
            text: 'USAGE: submit <challenge_id> <flag>\nExample: submit clx123... ECCC{secret_flag}',
          });
        } else {
          const challengeId = args[0];
          const flag = args.slice(1).join(' ');
          try {
            const res = await fetch('/api/submit-flag', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ challengeId, flag }),
            });
            const result = await res.json();
            if (result.status === 'correct') {
              newHistory.push({
                id: Math.random().toString(),
                type: 'success',
                text: `[+] ${result.message} (+${result.points} pts)`,
              });
            } else {
              newHistory.push({
                id: Math.random().toString(),
                type: 'error',
                text: `[-] ${result.message || result.error}`,
              });
            }
          } catch {
            newHistory.push({ id: Math.random().toString(), type: 'error', text: 'Flag submission request failed.' });
          }
        }
        break;

      default:
        newHistory.push({
          id: Math.random().toString(),
          type: 'error',
          text: `Command not recognized: "${command}". Type "help" for available commands.`,
        });
        break;
    }

    setHistory(newHistory);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0 && historyIndex < cmdHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInput(cmdHistory[cmdHistory.length - 1 - nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInput(cmdHistory[cmdHistory.length - 1 - nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[80vh] bg-[#0e1422] border border-[#1e293b] rounded-xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Terminal Header Bar — TryHackMe / HTB Web Terminal Style */}
        <div className="px-4 py-2.5 bg-[#0b0f19] border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <TerminalIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono-code font-bold text-white tracking-wider uppercase">
              ENISO CYBERGUARDS :: OPERATIVE TERMINAL
            </span>
            <span className="text-[10px] font-mono-code text-emerald-400 bg-emerald-950/80 px-2 py-0.2 rounded border border-emerald-800/60 font-semibold">
              CONNECTED
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono-code text-slate-400 hidden sm:inline">Press Esc or ~ to close</span>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#18243b] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Console Body */}
        <div className="flex-1 p-5 font-mono-code text-xs overflow-y-auto space-y-2 text-slate-300 bg-[#080d1a]">
          {history.map((item) => {
            if (item.type === 'banner') {
              return (
                <pre key={item.id} className="text-slate-200 font-mono-code text-[10px] sm:text-xs leading-none overflow-x-auto my-3">
                  {item.text}
                </pre>
              );
            }
            if (item.type === 'input') {
              return (
                <div key={item.id} className="text-white font-semibold pt-1">
                  {item.text}
                </div>
              );
            }
            if (item.type === 'error') {
              return (
                <div key={item.id} className="text-rose-400 whitespace-pre-wrap">
                  {item.text}
                </div>
              );
            }
            if (item.type === 'success') {
              return (
                <div key={item.id} className="text-emerald-400 whitespace-pre-wrap">
                  {item.text}
                </div>
              );
            }
            return (
              <div key={item.id} className="text-slate-400 whitespace-pre-wrap">
                {item.text}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-2.5 bg-[#0b0f19] border-t border-[#1e293b] flex items-center gap-2">
          <span className="text-emerald-400 font-mono-code font-bold text-xs select-none pl-2">
            cyberguards:~$
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type command ('help' for list)..."
            className="flex-1 bg-transparent border-none outline-none font-mono-code text-xs text-white placeholder:text-slate-500"
          />
          <button
            onClick={() => handleCommand(input)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all font-semibold text-xs flex items-center gap-1"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
