'use client';

import { useEffect, useRef } from 'react';

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CHARS = '01アイウエカキクケコ#@$%<>{}[]!?~_=+01001101';
    const FONT_SIZE = 12;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    let cols = Math.floor(W / FONT_SIZE);
    let drops: number[] = Array(cols).fill(1).map(() => Math.random() * -50);

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      cols = Math.floor(W / FONT_SIZE);
      drops = Array(cols).fill(1).map(() => Math.random() * -50);
    };
    window.addEventListener('resize', onResize);

    let raf: number;
    let lastTime = 0;
    const INTERVAL = 80; // slower than splash — calm, ambient

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - lastTime < INTERVAL) return;
      lastTime = now;

      // Fade trail — very transparent to keep it subtle
      ctx.fillStyle = 'rgba(4, 7, 17, 0.22)';
      ctx.fillRect(0, 0, W, H);

      ctx.font = `${FONT_SIZE}px "Share Tech Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const y = drops[i] * FONT_SIZE;

        // Brightest at leading edge
        if (Math.random() > 0.97) {
          ctx.fillStyle = 'rgba(147,197,253,0.55)'; // bright blue-200
        } else if (Math.random() > 0.88) {
          ctx.fillStyle = 'rgba(59,130,246,0.25)';  // blue-500
        } else {
          ctx.fillStyle = 'rgba(30,64,175,0.13)';   // deep navy — barely visible
        }

        ctx.fillText(char, i * FONT_SIZE, y);

        if (y > H && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.4; // very slow drift
      }
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <>
      {/* Matrix rain canvas — fixed, behind everything */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0, opacity: 0.75 }}
      />

      {/* Scanline overlay — mimics CRT / terminal monitor feel */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Top ambient glow — operative command center feel */}
      <div
        className="fixed top-0 left-0 right-0 pointer-events-none"
        style={{
          zIndex: 1,
          height: '380px',
          background:
            'radial-gradient(ellipse 70% 100% at 50% -10%, rgba(29,78,216,0.14) 0%, transparent 70%)',
        }}
      />

      {/* Bottom vignette — keeps content readable */}
      <div
        className="fixed bottom-0 left-0 right-0 pointer-events-none"
        style={{
          zIndex: 1,
          height: '200px',
          background: 'linear-gradient(to top, rgba(4,7,17,0.6) 0%, transparent 100%)',
        }}
      />
    </>
  );
}
