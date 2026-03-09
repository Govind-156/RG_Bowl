type RateLimitConfig = {
  windowMs: number;
  max: number;
};

const globalForRateLimit = globalThis as unknown as {
  _rateLimitStore?: Map<string, number[]>;
};

const store: Map<string, number[]> =
  globalForRateLimit._rateLimitStore ?? new Map<string, number[]>();

if (!globalForRateLimit._rateLimitStore) {
  globalForRateLimit._rateLimitStore = store;
}

export async function checkRateLimit(
  identifier: string,
  { windowMs, max }: RateLimitConfig,
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (store.get(identifier) ?? []).filter((ts) => ts > windowStart);

  if (timestamps.length >= max) {
    const retryAfterMs = timestamps[0] + windowMs - now;
    const retryAfter = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return { ok: false, retryAfter };
  }

  timestamps.push(now);
  store.set(identifier, timestamps);

  return { ok: true };
}

