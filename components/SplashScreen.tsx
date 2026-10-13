'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

const FINAL_TEXT = 'ENISO  CYBERGUARDS';
const CIPHER = 'ABCDEF0123456789@#$%<>{}[]=+/\\~_!?';

/* ── Binary / ASCII rain canvas ── */
function useMatrixRain(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CHARS = '01アイウエオカキクケコ#@%$<>{}[]01001101001 ';
    const FONT_SIZE = 13;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    const cols = Math.floor(W / FONT_SIZE);
    const drops: number[] = Array(cols).fill(1);

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    let raf: number;
    let lastTime = 0;
    const INTERVAL = 48;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - lastTime < INTERVAL) return;
      lastTime = now;

      ctx.fillStyle = 'rgba(2, 5, 8, 0.18)';
      ctx.fillRect(0, 0, W, H);

      ctx.font = `${FONT_SIZE}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const y = drops[i] * FONT_SIZE;

        // Leading char brighter
        if (drops[i] * FONT_SIZE < H * 0.12) {
          ctx.fillStyle = 'rgba(96,165,250,0.9)';
        } else if (Math.random() > 0.92) {
          ctx.fillStyle = 'rgba(147,197,253,0.85)';
        } else {
          const alpha = Math.random() * 0.35 + 0.1;
          ctx.fillStyle = `rgba(30,64,175,${alpha})`;
        }

        ctx.fillText(char, i * FONT_SIZE, y);

        if (y > H && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [canvasRef]);
}

/* ── ASCII border lines around logo ── */
const ASCII_CORNERS = [
  { pos: 'top-0 left-0',   text: '┌──────────────┐' },
  { pos: 'bottom-0 left-0', text: '└──────────────┘' },
];

export default function SplashScreen({ onComplete, duration = 3400 }: SplashScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [logoVisible, setLogoVisible] = useState(false);
  const [cipherText, setCipherText] = useState('');
  const [subVisible, setSubVisible] = useState(false);
  const [scanLine, setScanLine] = useState(0);

  useMatrixRain(canvasRef);

  /* ── Logo appear ── */
  useEffect(() => {
    const t = setTimeout(() => setLogoVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  /* ── Scan line sweep across logo ── */
  useEffect(() => {
    if (!logoVisible) return;
    let v = 0;
    const id = setInterval(() => {
      v += 2;
      setScanLine(v);
      if (v >= 105) clearInterval(id);
    }, 8);
    return () => clearInterval(id);
  }, [logoVisible]);

  /* ── Cipher scramble ── */
  useEffect(() => {
    let frame = 0;
    let raf: number;
    let last = performance.now();
    const speed = 22;
    const cycles = 5;

    const step = (now: number) => {
      if (now - last >= speed) {
        last = now;
        frame++;
        const revealed = Math.floor(frame / cycles);
        let out = '';
        for (let i = 0; i < FINAL_TEXT.length; i++) {
          if (i < revealed) {
            out += FINAL_TEXT[i];
          } else if (i < revealed + 6) {
            out += FINAL_TEXT[i] === ' '
              ? ' '
              : CIPHER[Math.floor(Math.random() * CIPHER.length)];
          } else {
            out += CIPHER[Math.floor(Math.random() * CIPHER.length)];
          }
        }
        setCipherText(out);
        if (revealed >= FINAL_TEXT.length) {
          setCipherText(FINAL_TEXT);
          setSubVisible(true);
          return;
        }
      }
      raf = requestAnimationFrame(step);
    };

    const t = setTimeout(() => { raf = requestAnimationFrame(step); }, 700);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, []);

  /* ── Auto exit ── */
  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('out');
      setTimeout(onComplete, 800);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onComplete]);

  const dismiss = useCallback(() => {
    setPhase('out');
    setTimeout(onComplete, 800);
  }, [onComplete]);

  return (
    <div
      onClick={dismiss}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden
        transition-opacity duration-800 ${phase === 'out' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: '#020508' }}
    >
      {/* Matrix rain canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.9 }} />

      {/* Center vignette to make logo pop */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(2,5,8,0.82) 30%, transparent 100%)' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6">

        {/* ASCII corner decoration + logo */}
        <div className={`relative transition-all duration-700 ${logoVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          {/* ASCII frame lines */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-blue-700/60 text-[11px] whitespace-nowrap tracking-widest">
            ┌──── OPERATIVE ID: CG-7749 ────┐
          </div>
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-blue-700/60 text-[11px] whitespace-nowrap tracking-widest">
            └─────── ACCESS LEVEL: ALPHA ───┘
          </div>

          {/* Logo container */}
          <div className="relative w-52 h-52 mx-auto">
            <Image
              src="/logo.png"
              alt="ENISO CyberGuards"
              fill
              className="object-contain"
              style={{
                filter: 'drop-shadow(0 0 32px rgba(59,130,246,0.55)) drop-shadow(0 0 64px rgba(29,78,216,0.3))',
              }}
              priority
            />

            {/* Scan line sweep */}
            {logoVisible && scanLine < 105 && (
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  top: `${scanLine}%`,
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.8), transparent)',
                  boxShadow: '0 0 8px rgba(96,165,250,0.6)',
                  transition: 'top 0.05s linear',
                }}
              />
            )}
          </div>
        </div>

        {/* Cipher text title */}
        <div
          className="text-center space-y-3"
          style={{ animation: 'splash-text-in 0.7s ease-out 0.6s both' }}
        >
          {/* Binary row above title */}
          <div className="font-mono text-[10px] tracking-[0.3em] text-blue-800/70 text-center">
            01000101 01001110 01001001 01010011 01001111
          </div>

          <div className="font-mono text-3xl sm:text-4xl font-bold tracking-[0.2em] text-white"
            style={{ textShadow: '0 0 20px rgba(96,165,250,0.4)' }}>
            {cipherText || '\u00a0'}
          </div>

          {/* Binary row below title */}
          <div className="font-mono text-[10px] tracking-[0.3em] text-blue-800/70 text-center">
            01000011 01011001 01000010 01000101 01010010
          </div>

          <div className={`transition-all duration-700 space-y-2 ${subVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <div className="h-px bg-gradient-to-r from-transparent via-blue-600/50 to-transparent w-72 mx-auto" />
            <div className="font-mono text-[11px] tracking-[0.28em] text-blue-400/70 uppercase">
              National Engineering School of Sousse
            </div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-slate-600">
              // CTF OPERATIVE PLATFORM — INITIALIZING . . .
            </div>
          </div>
        </div>

        {/* ASCII progress bar */}
        <div className={`font-mono text-[11px] text-blue-700/80 tracking-widest transition-opacity duration-700 delay-500 ${subVisible ? 'opacity-100' : 'opacity-0'}`}>
          [<span className="text-blue-400">████████████████████</span>] 100%
        </div>
      </div>

      {/* Dismiss hint */}
      <div className={`absolute bottom-8 font-mono text-[10px] tracking-[0.3em] text-slate-600 transition-opacity duration-700 delay-700 ${subVisible ? 'opacity-100' : 'opacity-0'}`}>
        ▸ CLICK ANYWHERE TO ENTER
      </div>
    </div>
  );
}
