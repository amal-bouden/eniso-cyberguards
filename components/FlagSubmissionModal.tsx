'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Flag,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Server,
  Copy,
  Check,
  ExternalLink,
  Download,
  FileCode,
  FileText,
  FileArchive,
  Image as ImageIcon,
  Radio,
  Eye,
  EyeOff,
  Terminal,
  FolderDown,
  Clock,
  Timer,
  Play,
  Lock,
  Unlock,
  Zap,
  Trophy,
} from 'lucide-react';
import { ChallengeFile } from '@/lib/challenge-files';

export interface ChallengeItem {
  id: string;
  title: string;
  category: string;
  description: string;
  points: number;
  hint?: string | null;
  instanceUrl?: string | null;
  isPerUserInstance?: boolean;
  isDraft: boolean;
  solveCount: number;
  firstBlood?: string | null;
  isSolved?: boolean;
  files?: ChallengeFile[];
}

interface FlagSubmissionModalProps {
  challenge: ChallengeItem | null;
  onClose: () => void;
  onSolveSuccess: (challengeId: string, points: number, isFirstBlood: boolean) => void;
}

export default function FlagSubmissionModal({
  challenge,
  onClose,
  onSolveSuccess,
}: FlagSubmissionModalProps) {
  const [flag, setFlag] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [firstBloodTriggered, setFirstBloodTriggered] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [scoringResult, setScoringResult] = useState<{
    basePoints: number;
    speedBonus: number;
    firstBloodBonus: number;
    totalPoints: number;
    timeTakenSeconds: number;
    isFirstBlood: boolean;
  } | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const isTimerActiveRef = React.useRef(false);

  // Resolution stopwatch timer: only starts when user clicks "START CHALLENGE" (PicoCTF style)
  useEffect(() => {
    if (!challenge) return;

    // Reset temporary interactive states
    setFlag('');
    setShowHint(false);
    setStatusMsg(null);
    setCopiedTarget(false);
    setDownloadedFile(null);
    setPreviewImage(null);

    // If challenge is already solved, reveal everything with timer stopped
    if (challenge.isSolved) {
      setIsStarted(true);
      setIsTimerActive(false);
      isTimerActiveRef.current = false;
      return;
    }

    // Check localStorage to see if operative has already started this challenge earlier
    const storageKey = `ctf_start_${challenge.id}`;
    let savedStartTime: string | null = null;
    try {
      savedStartTime = localStorage.getItem(storageKey);
    } catch {
      // ignore
    }

    if (savedStartTime) {
      const startMs = parseInt(savedStartTime, 10);
      if (!isNaN(startMs) && startMs > 0) {
        const diffSeconds = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        setElapsedSeconds(diffSeconds);
        setIsStarted(true);
        setIsTimerActive(true);
        isTimerActiveRef.current = true;
        return;
      }
    }

    // Not started yet!
    setIsStarted(false);
    setIsTimerActive(false);
    isTimerActiveRef.current = false;
    setElapsedSeconds(0);
  }, [challenge?.id, challenge?.isSolved]);

  // Interval timer tick: only runs when active
  useEffect(() => {
    if (!isTimerActive) return;

    const interval = setInterval(() => {
      if (isTimerActiveRef.current) {
        setElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isTimerActive]);

  const handleStartChallenge = () => {
    if (!challenge) return;
    if (!isStarted) {
      const now = Date.now();
      try {
        localStorage.setItem(`ctf_start_${challenge.id}`, now.toString());
      } catch {
        // ignore
      }
      setElapsedSeconds(0);
      setIsStarted(true);
      setIsTimerActive(true);
      isTimerActiveRef.current = true;
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  if (!challenge) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim()) return;

    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/submit-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          flag: flag.trim(),
          elapsedSeconds,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setStatusMsg({ type: 'error', text: data.message });
        return;
      }

      if (data.status === 'correct' || data.status === 'admin_test') {
        setStatusMsg({ type: 'success', text: data.message });
        if (data.scoring) {
          setScoringResult(data.scoring);
        }
        setIsTimerActive(false); // Stop the timer on success
        isTimerActiveRef.current = false;

        confetti({
          particleCount: 110,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#38bdf8', '#f59e0b', '#ffffff'],
        });

        if (data.isFirstBlood) {
          setFirstBloodTriggered(true);
        }

        onSolveSuccess(challenge.id, data.points || challenge.points, !!data.isFirstBlood);

        setTimeout(() => {
          onClose();
        }, 3200);
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'INVALID FLAG. Check your payload and try again.' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network connection error during flag submission.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTarget = () => {
    if (challenge.instanceUrl) {
      navigator.clipboard.writeText(challenge.instanceUrl);
      setCopiedTarget(true);
      setTimeout(() => setCopiedTarget(false), 2000);
    }
  };

  const handleDownloadClick = (fileName: string) => {
    setDownloadedFile(fileName);
    setTimeout(() => {
      setDownloadedFile(null);
    }, 2500);
  };

  // Helper to render appropriate file icon based on extension or type
  const getFileIcon = (file: ChallengeFile) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (file.isImage || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    }
    if (['html', 'htm', 'py', 'c', 'cpp', 'js', 'ts'].includes(ext || '')) {
      return <FileCode className="w-4 h-4 text-cyan-400" />;
    }
    if (['zip', 'tar', 'gz', '7z'].includes(ext || '')) {
      return <FileArchive className="w-4 h-4 text-amber-400" />;
    }
    if (['pcap', 'pcapng'].includes(ext || '')) {
      return <Radio className="w-4 h-4 text-purple-400" />;
    }
    if (['txt', 'md', 'log'].includes(ext || '')) {
      return <FileText className="w-4 h-4 text-blue-400" />;
    }
    return <Terminal className="w-4 h-4 text-rose-400" />;
  };

  // Helper to format category badge colors
  const getCategoryTheme = (category: string) => {
    const cat = category.toUpperCase();
    if (cat.includes('WEB')) return 'text-sky-400 bg-sky-950/60 border-sky-800/60';
    if (cat.includes('CRYPTO')) return 'text-purple-400 bg-purple-950/60 border-purple-800/60';
    if (cat.includes('STEG')) return 'text-pink-400 bg-pink-950/60 border-pink-800/60';
    if (cat.includes('FORENSIC')) return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
    if (cat.includes('REVERS')) return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
    if (cat.includes('PWN')) return 'text-rose-400 bg-rose-950/60 border-rose-800/60';
    if (cat.includes('OSINT')) return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60';
    if (cat.includes('NET')) return 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60';
    return 'text-blue-400 bg-blue-950/60 border-blue-800/60';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
      <div
        className={`relative w-full max-w-2xl bg-[#0a1024] rounded-xl border border-[#172447] p-5 sm:p-6 space-y-4 shadow-2xl transition-all my-auto max-h-[92vh] overflow-y-auto ${
          firstBloodTriggered ? 'border-rose-500 shadow-rose-950/50' : 'shadow-black/70'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-[#172447] pb-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase tracking-wider border ${getCategoryTheme(
                  challenge.category
                )}`}
              >
                {challenge.category}
              </span>
              <span className="text-xs font-mono-code font-bold text-white px-2 py-0.5 rounded bg-[#1e293b]/70 border border-[#334155]/60">
                {challenge.points} PTS
              </span>
              {challenge.firstBlood && (
                <span className="text-[10px] font-mono-code text-rose-400 bg-rose-950/70 border border-rose-800/60 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                  <Flame className="w-3 h-3 text-rose-500" /> First Blood: @{challenge.firstBlood}
                </span>
              )}
              {challenge.isSolved && (
                <span className="text-[10px] font-mono-code text-emerald-400 bg-emerald-950/80 border border-emerald-800/70 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> SOLVED
                </span>
              )}
            </div>
            <h2 className="text-xl font-mono-code font-bold text-white tracking-tight flex items-center gap-2">
              <span>{challenge.title}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Elapsed Timer Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono-code text-xs font-bold tracking-widest transition-all ${
                challenge.isSolved
                  ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
                  : isStarted
                  ? 'bg-[#0b0f19] border-blue-900/60 text-blue-300'
                  : 'bg-[#0b0f19] border-slate-800 text-slate-500'
              }`}
            >
              <Timer
                className={`w-3.5 h-3.5 ${
                  isStarted && isTimerActive && !challenge.isSolved
                    ? 'animate-pulse text-blue-400'
                    : isStarted
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              />
              <span>{isStarted ? formatTimer(elapsedSeconds) : '00:00 (STANDBY)'}</span>
            </div>

            {isStarted && !challenge.isSolved && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/50 border border-blue-800/60 text-[10px] font-mono-code text-blue-300">
                <Zap className="w-3 h-3 text-blue-400" />
                <span>
                  SPEED: +{Math.round(challenge.points * 0.25 * (elapsedSeconds <= 300 ? 1 : elapsedSeconds >= 3600 ? 0 : (3600 - elapsedSeconds) / 3300))} PTS
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* First Blood Alert Banner */}
        {firstBloodTriggered && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/90 to-red-950/90 border border-rose-700 text-rose-100 font-mono-code text-xs flex items-center gap-2.5 shadow-lg shadow-rose-950/50">
            <Flame className="w-5 h-5 text-rose-400 animate-pulse shrink-0" />
            <div>
              <span className="font-bold tracking-wide">FIRST BLOOD CLAIMED!</span>
              <p className="text-[11px] text-rose-200/90 font-sans mt-0.5">
                You were the first operative to crack this challenge. Points and honors recorded on the scoreboard!
              </p>
            </div>
          </div>
        )}

        {/* Challenge Brief / Description — written as styled text matching the platform theme */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono-code text-slate-300 font-semibold tracking-wider uppercase">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>CHALLENGE BRIEF</span>
            </div>
            <span className="text-[10px] font-mono-code text-slate-400">
              MISSION BRIEFING
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-[#040711]/85 border border-[#172447] text-xs sm:text-[13px] text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-text shadow-inner">
            {challenge.description}
          </div>
        </div>

        {/* Challenge Session & Timer Control */}
        {!isStarted && !challenge.isSolved && (
          <div className="p-4 rounded-xl bg-[#040711] border border-[#172447] flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-[#0a1024] border border-[#172447] text-blue-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-mono-code font-bold text-white flex items-center gap-2">
                  <span>CHALLENGE SESSION</span>
                  <span className="text-[10px] text-amber-400 font-medium px-1.5 py-0.2 rounded bg-amber-950/70 border border-amber-800/60">STANDBY</span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans truncate mt-0.5">
                  Click Start Challenge to activate the resolution stopwatch and unlock resources.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleStartChallenge}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono-code font-semibold text-xs transition-all flex items-center gap-2 shrink-0 shadow-sm active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>START CHALLENGE</span>
            </button>
          </div>
        )}

        {/* Operational Target Environment (Only when started or solved AND challenge has an active instanceUrl) */}
        {(isStarted || challenge.isSolved) && challenge.instanceUrl && (
          <div className="p-4 rounded-xl bg-[#040711] border border-[#172447] space-y-2 shadow-inner">
            <div className="flex items-center justify-between text-xs font-mono-code">
              <span className="text-slate-300 flex items-center gap-1.5 font-bold tracking-wider">
                <Server className="w-3.5 h-3.5 text-blue-400" /> OPERATIONAL TARGET
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE
              </span>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <code className="flex-1 px-3 py-2 rounded-lg bg-[#0a1024] border border-[#172447] text-xs font-mono-code text-slate-200 truncate select-all">
                {challenge.instanceUrl}
              </code>

              {challenge.instanceUrl.startsWith('http://') ||
              challenge.instanceUrl.startsWith('https://') ||
              challenge.instanceUrl.startsWith('/') ? (
                <a
                  href={challenge.instanceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono-code text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> OPEN TARGET
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleCopyTarget}
                  className="px-3.5 py-2 rounded-lg bg-[#0a1024] border border-[#172447] hover:border-blue-500/50 text-slate-200 font-mono-code text-xs font-medium transition-all flex items-center gap-1.5 shrink-0"
                >
                  {copiedTarget ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedTarget ? 'COPIED' : 'COPY'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* CHALLENGE ARTIFACTS / DOWNLOADABLE FILES SECTION */}
        {challenge.files && challenge.files.length > 0 && (
          !isStarted && !challenge.isSolved ? (
            /* Clean locked indicator before starting */
            <div className="p-3.5 rounded-xl bg-[#040711] border border-[#172447] flex items-center gap-3 shadow-inner">
              <div className="p-2 rounded-lg bg-[#0a1024] border border-[#172447] text-slate-400 shrink-0">
                <Lock className="w-4 h-4 text-amber-400/90" />
              </div>
              <div className="text-xs font-mono-code text-slate-300">
                <span className="font-semibold text-white">{challenge.files.length} {challenge.files.length === 1 ? 'file' : 'files'} attached</span>
                <span className="text-slate-500 ml-2">— Start challenge above to unlock artifacts</span>
              </div>
            </div>
          ) : (
            /* Unlocked Files List */
            <div className="space-y-3 p-4 rounded-xl bg-[#040711] border border-[#172447] shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderDown className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-mono-code font-bold text-white uppercase tracking-wider">
                    CHALLENGE ARTIFACTS & FILES
                  </span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full font-mono-code bg-blue-950 text-blue-300 border border-blue-800/60 font-semibold">
                    {challenge.files.length} {challenge.files.length === 1 ? 'FILE' : 'FILES'}
                  </span>
                </div>
                <span className="text-[10px] font-mono-code text-slate-400 hidden sm:inline">
                  Direct Uncompressed Downloads
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                {challenge.files.map((file, idx) => {
                  const isDownloaded = downloadedFile === file.name;
                  const isPreviewOpen = previewImage === file.path;

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[#0a1024] border border-[#172447] hover:border-blue-500/40 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* File Icon & Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-[#040711] border border-[#172447] shrink-0">
                            {getFileIcon(file)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono-code font-bold text-white tracking-wide truncate">
                                {file.name}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code text-slate-400 bg-[#040711] border border-[#172447]">
                                {file.size}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-sans truncate mt-0.5">
                              {file.description}
                            </p>
                          </div>
                        </div>

                        {/* Download & Preview Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {file.isImage && (
                            <button
                              type="button"
                              onClick={() => setPreviewImage(isPreviewOpen ? null : file.path)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#040711] border border-[#172447] hover:border-blue-500/50 text-slate-300 hover:text-white text-xs font-mono-code flex items-center gap-1.5 transition-all"
                              title="Preview image"
                            >
                              {isPreviewOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-blue-400" />}
                              <span className="hidden sm:inline">{isPreviewOpen ? 'Hide' : 'Preview'}</span>
                            </button>
                          )}

                          <a
                            href={file.path}
                            download={file.name}
                            onClick={() => handleDownloadClick(file.name)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
                              isDownloaded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
                            }`}
                          >
                            {isDownloaded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>SAVED</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>DOWNLOAD</span>
                              </>
                            )}
                          </a>
                        </div>
                      </div>

                      {/* Inline Image Preview */}
                      {file.isImage && isPreviewOpen && (
                        <div className="pt-2 border-t border-[#172447] space-y-2 animate-in fade-in duration-200">
                          <div className="relative rounded-lg overflow-hidden border border-[#172447] bg-black/60 flex items-center justify-center p-2 max-h-64">
                            <img
                              src={file.path}
                              alt={file.name}
                              className="max-h-60 max-w-full object-contain rounded"
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-mono-code text-slate-400">
                            <span>Raw Uncompressed Image Artifact</span>
                            <a
                              href={file.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Open in full resolution
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}

        {/* Tactical Hint Accordion */}
        {challenge.hint && (
          !isStarted && !challenge.isSolved ? (
            <div className="flex items-center gap-2 text-xs font-mono-code text-slate-500 p-2.5 rounded-lg bg-[#040711]/50 border border-[#172447]">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Tactical hint locked — launch CTF to reveal</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="text-xs font-mono-code text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors p-1"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>{showHint ? 'Hide Tactical Hint' : 'Show Tactical Hint'}</span>
              </button>

              {showHint && (
                <div className="p-3.5 rounded-xl bg-[#040711]/90 border border-amber-900/40 text-xs font-mono-code text-amber-200/90 whitespace-pre-line leading-relaxed shadow-sm">
                  💡 {challenge.hint}
                </div>
              )}
            </div>
          )
        )}

        {/* Flag Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2 border-t border-[#172447]">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono-code text-slate-300 font-semibold tracking-wide uppercase">
              SUBMIT CAPTURED FLAG
            </label>
            <div className="relative">
              <Flag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder="ECCC{...}"
                disabled={loading || !!challenge.isSolved}
                className="w-full bg-[#040711] border border-[#172447] focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono-code text-white placeholder:text-slate-500 outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Explicit Score Breakdown Card upon solve */}
          {scoringResult && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/80 via-[#0a142e] to-indigo-950/80 border border-blue-700/60 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  POINTS AWARDED BREAKDOWN
                </span>
                <span className="font-bold text-amber-400 text-sm">
                  +{scoringResult.totalPoints} PTS TOTAL
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center font-mono-code text-xs">
                <div className="p-2 rounded-lg bg-[#040711]/90 border border-[#172447]">
                  <span className="text-[10px] text-slate-400 block">BASE WORTH</span>
                  <span className="text-white font-bold">+{scoringResult.basePoints}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#040711]/90 border border-blue-900/50">
                  <span className="text-[10px] text-blue-400 block flex items-center justify-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" /> SPEED ({formatTimer(scoringResult.timeTakenSeconds)})
                  </span>
                  <span className="text-blue-300 font-bold">+{scoringResult.speedBonus}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#040711]/90 border border-rose-900/50">
                  <span className="text-[10px] text-rose-400 block flex items-center justify-center gap-0.5">
                    <Flame className="w-2.5 h-2.5" /> 1ST BLOOD
                  </span>
                  <span className="text-rose-300 font-bold">+{scoringResult.firstBloodBonus}</span>
                </div>
              </div>
            </div>
          )}

          {statusMsg && !scoringResult && (
            <div
              className={`p-3 rounded-xl border text-xs font-mono-code flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-800 text-rose-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono-code text-slate-400 hover:text-white hover:bg-[#172447]/50 transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading || !flag.trim() || !!challenge.isSolved}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono-code font-bold text-xs tracking-wider uppercase transition-all disabled:opacity-50 shadow-md shadow-blue-900/30 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>VERIFYING...</span>
                </>
              ) : challenge.isSolved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ALREADY SOLVED</span>
                </>
              ) : (
                <>
                  <Flag className="w-3.5 h-3.5" />
                  <span>SUBMIT FLAG</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
