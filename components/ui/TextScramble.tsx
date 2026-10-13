'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';

const CIPHER_CHARS = 'ABCDEF0123456789!@#$%&*<>{}[]=+/\\~_';

interface TextScrambleProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  speed?: number; // ms per frame
  scrambleCycles?: number; // how many cycles per character before resolving
  delay?: number; // initial delay before starting (ms)
  triggerKey?: any; // re-run animation when triggerKey changes
  showCursor?: boolean;
  onComplete?: () => void;
}

export default function TextScramble({
  text,
  as: Component = 'span',
  className = '',
  speed = 28,
  scrambleCycles = 3,
  delay = 0,
  triggerKey,
  showCursor = false,
  onComplete,
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const frameRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startScramble = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setIsTyping(true);
    setDisplayText('');

    timeoutRef.current = setTimeout(() => {
      let frame = 0;
      const targetLength = text.length;
      let lastTime = performance.now();

      const step = (currentTime: number) => {
        if (currentTime - lastTime >= speed) {
          lastTime = currentTime;
          frame++;

          // Current revealed index
          const revealedCount = Math.floor(frame / scrambleCycles);

          let output = '';
          for (let i = 0; i < targetLength; i++) {
            if (i < revealedCount) {
              output += text[i];
            } else if (i < revealedCount + 4 && i < targetLength) {
              // Scrambling glyphs window
              if (text[i] === ' ') {
                output += ' ';
              } else {
                const randomChar = CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
                output += randomChar;
              }
            } else {
              break;
            }
          }

          setDisplayText(output);

          if (revealedCount >= targetLength) {
            setDisplayText(text);
            setIsTyping(false);
            if (onComplete) onComplete();
            return;
          }
        }

        frameRef.current = requestAnimationFrame(step);
      };

      frameRef.current = requestAnimationFrame(step);
    }, delay);
  }, [text, speed, scrambleCycles, delay, onComplete]);

  useEffect(() => {
    startScramble();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [startScramble, triggerKey]);

  return (
    <Component className={className} onClick={startScramble} title="Click to re-decrypt">
      {displayText}
      {showCursor && isTyping && (
        <span className="inline-block w-2.5 h-[1.1em] align-middle ml-1 bg-blue-400 animate-cursor" />
      )}
    </Component>
  );
}
