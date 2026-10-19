export interface ScoreCalculation {
  basePoints: number;
  speedBonus: number;
  firstBloodBonus: number;
  totalPoints: number;
  decayPercent: number; // 0 - 100%
  timeTakenSeconds: number;
  isFirstBlood: boolean;
}

/**
 * Calculates CTF challenge score based on:
 * 1. Base Challenge Points (worth of the challenge)
 * 2. Timing/Speed (up to +25% bonus for <= 5min solves, linearly decaying to 0% at 1 hour)
 * 3. First Blood (+20% bonus for the first operative who cracks the challenge)
 */
export function calculateScore(
  basePoints: number,
  timeTakenSeconds: number = 0,
  isFirstBlood: boolean = false
): ScoreCalculation {
  const base = Math.max(0, basePoints);
  const time = Math.max(0, Math.floor(timeTakenSeconds));

  // Max speed bonus is 25% of the base challenge points
  const maxSpeedBonus = Math.round(base * 0.25);
  let speedBonus = 0;
  let decayPercent = 0;

  if (time <= 300) {
    // Solved in <= 5 minutes: Full speed bonus (+25%)
    speedBonus = maxSpeedBonus;
    decayPercent = 100;
  } else if (time < 3600) {
    // Linear decay between 5 minutes (300s) and 60 minutes (3600s)
    const factor = (3600 - time) / (3600 - 300);
    decayPercent = Math.max(0, Math.min(100, Math.round(factor * 100)));
    speedBonus = Math.round(maxSpeedBonus * factor);
  } else {
    // Solved after 1 hour: 0% speed bonus (still earns full base points)
    speedBonus = 0;
    decayPercent = 0;
  }

  // First Blood Bonus is 20% of base challenge points
  const firstBloodBonus = isFirstBlood ? Math.round(base * 0.20) : 0;

  const totalPoints = base + speedBonus + firstBloodBonus;

  return {
    basePoints: base,
    speedBonus,
    firstBloodBonus,
    totalPoints,
    decayPercent,
    timeTakenSeconds: time,
    isFirstBlood,
  };
}

/**
 * Resolves score breakdown for a solve record, computing on the fly for legacy records if needed.
 */
export function resolveSolveScore(solve: {
  points?: number | null;
  basePoints?: number | null;
  speedBonus?: number | null;
  firstBloodBonus?: number | null;
  timeTakenSeconds?: number | null;
  isFirstBlood?: boolean | null;
  challenge?: { points: number } | null;
}): ScoreCalculation {
  const base = solve.basePoints ?? solve.challenge?.points ?? 0;

  if (solve.points != null && solve.points > 0) {
    const isFb = !!solve.isFirstBlood;
    const fbBonus = solve.firstBloodBonus ?? (isFb ? Math.round(base * 0.20) : 0);
    const spBonus = solve.speedBonus ?? Math.max(0, solve.points - base - fbBonus);
    const time = solve.timeTakenSeconds ?? 0;
    const factor = time <= 300 ? 100 : time >= 3600 ? 0 : Math.round(((3600 - time) / 3300) * 100);

    return {
      basePoints: base,
      speedBonus: spBonus,
      firstBloodBonus: fbBonus,
      totalPoints: solve.points,
      decayPercent: factor,
      timeTakenSeconds: time,
      isFirstBlood: isFb,
    };
  }

  // Compute for legacy records
  const isFb = !!solve.isFirstBlood;
  const time = solve.timeTakenSeconds ?? 1800; // default 30m if untracked
  return calculateScore(base, time, isFb);
}

/**
 * Helper to humanly format seconds into MM:SS or Xh Ym
 */
export function formatSolveDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}
