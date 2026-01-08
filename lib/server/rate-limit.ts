import { Prediction } from '@prisma/client';

interface RateLimitResult {
  allowed: boolean;
  retryAfter: number; // Seconds until next allowed request
  concentration: {
    active: number; // Available slots (0-3)
    total: number;  // Total capacity (3)
    nextRefillIn: number; // Seconds until next refill
  };
}

export const RATE_LIMIT_CONFIG = {
  CAPACITY: 3,
  REFILL_RATE_SECONDS: 45, // Refill 1 slot every 45 seconds (Allows ~80 requests/hour)
  WINDOW_SECONDS: 3 * 60, // Look back window (enough to cover full refill)
};

/**
 * Stateless Token Bucket Algorithm
 * Calculates available tokens based on prediction history.
 */
export function calculateRateLimit(
  predictions: Pick<Prediction, 'createdAt'>[],
  now: Date = new Date()
): RateLimitResult {
  const { CAPACITY, REFILL_RATE_SECONDS } = RATE_LIMIT_CONFIG;
  const nowTime = now.getTime();
  
  // 1. Initialize bucket as full at the start of the window
  // We simulate the bucket state from the oldest relevant prediction to now.
  // Ideally, we'd start at -Infinity, but strictly we only care about the window.
  // Actually, for stateless, we can assume the bucket was full at (OldestPrediction or Now-Window).
  
  // Correct Stateless Approach:
  // Sort predictions by date (oldest first)
  const sortedPredictions = [...predictions].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  
  let tokens = CAPACITY;
  let lastUpdate = nowTime - (RATE_LIMIT_CONFIG.WINDOW_SECONDS * 1000); // Start far back
  
  // If we have no predictions or all are very old, we are full.
  // But to be accurate, let's walk through the events.
  
  // Optimization: Only consider predictions within the window that could possibly affect us.
  // A prediction older than CAPACITY * REFILL_RATE guarantees full refill since then.
  const windowStart = nowTime - (CAPACITY * REFILL_RATE_SECONDS * 1000);
  
  // Filter relevant predictions
  const relevantPredictions = sortedPredictions.filter(
    p => p.createdAt.getTime() > windowStart
  );
  
  if (relevantPredictions.length === 0) {
    return {
      allowed: true,
      retryAfter: 0,
      concentration: { active: CAPACITY, total: CAPACITY, nextRefillIn: 0 }
    };
  }

  // We assume full bucket just before the first relevant prediction
  lastUpdate = relevantPredictions[0].createdAt.getTime() - 1; 
  tokens = CAPACITY; 

  for (const p of relevantPredictions) {
    const pTime = p.createdAt.getTime();
    
    // Refill tokens based on time passed since last event
    const elapsed = (pTime - lastUpdate) / 1000;
    const refillAmount = elapsed / REFILL_RATE_SECONDS;
    tokens = Math.min(CAPACITY, tokens + refillAmount);
    
    // Consume token
    // If tokens < 1, it means this prediction technically violated the limit?
    // But it's in the DB, so it happened. We just record the state.
    tokens = Math.max(0, tokens - 1);
    
    lastUpdate = pTime;
  }
  
  // Final update to now
  const elapsedSinceLast = (nowTime - lastUpdate) / 1000;
  const finalRefill = elapsedSinceLast / REFILL_RATE_SECONDS;
  tokens = Math.min(CAPACITY, tokens + finalRefill);
  
  const activeInteger = Math.floor(tokens);
  
  // If we have < 1 token, we are blocked.
  const allowed = tokens >= 1;
  
  // Calculate retryAfter
  // We need to reach 1.0 tokens.
  // If we have 0.4 tokens, we need 0.6 more.
  // 0.6 * 45s = 27s.
  let retryAfter = 0;
  let nextRefillIn = 0;

  if (tokens < 1) {
    retryAfter = Math.ceil((1 - tokens) * REFILL_RATE_SECONDS);
  }
  
  // Next Refill logic (for UI)
  // If tokens < CAPACITY, how long until next integer boundary?
  // e.g. 2.5 -> needs 0.5 to reach 3.
  // e.g. 0.5 -> needs 0.5 to reach 1 (which is same as retryAfter).
  if (tokens < CAPACITY) {
    const fractional = tokens % 1; // 2.5 -> 0.5
    // But wait, Refill is continuous. 
    // We want to know when we get the "next full token" or just "next refill unit"?
    // The UI shows discrete hearts/balls. 
    // Usually we just show "time to next charge".
    // 2.5 -> 0.5 needed to be 3.
    // 0.0 -> 1.0 needed to be 1.
    
    const neededForNextInt = 1 - (tokens - Math.floor(tokens));
    nextRefillIn = Math.ceil(neededForNextInt * REFILL_RATE_SECONDS);
  }

  // Enforce "Breathe" minimal delay (30s) if burst exhausted
  // Strategy: If calculating logic says OK, but the last prediction was SUPER recent
  // and we are borderline?
  // Actually the Token Bucket handles this naturally. 
  // If I have 1.0 tokens, and I spend 1. 
  // I have 0. I wait 45s.
  // This is a bit stricter than "Burst 3 then wait 30s".
  // If I want "Burst 3, then wait 30s", the refill rate should be faster?
  // Or cost is cheaper?
  // Let's stick to standard Token Bucket 45s (0.75min).
  // 3 tokens = 2m 15s to fill.
  
  return {
    allowed,
    retryAfter,
    concentration: {
      active: activeInteger,
      total: CAPACITY,
      nextRefillIn: tokens >= CAPACITY ? 0 : nextRefillIn
    }
  };
}
