import { describe, expect, it } from 'vitest';
import { TokenBucket } from '../src/rate-limit.js';

describe('TokenBucket', () => {
  it('starts at capacity — first N acquires are near-instant', async () => {
    const bucket = new TokenBucket(3, 1);
    const t0 = Date.now();
    await bucket.acquire();
    await bucket.acquire();
    await bucket.acquire();
    expect(Date.now() - t0).toBeLessThan(50);
  });

  it('blocks once tokens exhausted, refilling at refillPerSec', async () => {
    const bucket = new TokenBucket(1, 10); // 10/s → 100ms per token
    await bucket.acquire(); // consumes the initial 1
    const t0 = Date.now();
    await bucket.acquire(); // must wait ~100ms
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeGreaterThanOrEqual(50);
    expect(elapsed).toBeLessThanOrEqual(250);
  });
});
