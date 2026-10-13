type RateLimitRecord = {
  timestamps: number[];
};

const store = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
    if (record.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 300000);

/**
 * Check if an key exceeds maxAttempts in a given time window (in ms).
 */
export function checkRateLimit(
  key: string,
  maxAttempts = 12,
  windowMs = 60000
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  let record = store.get(key);

  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }

  // Filter out timestamps outside window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxAttempts) {
    const oldest = record.timestamps[0];
    const resetMs = windowMs - (now - oldest);
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, resetMs),
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxAttempts - record.timestamps.length,
    resetMs: windowMs,
  };
}
