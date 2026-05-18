/**
 * Token bucket simples para rate-limiting de chamadas à Deezer.
 *
 * Limite público Deezer ≈ 50 req / 5s por IP. Default abaixo (8 req/s) deixa
 * folga e respeita bursts curtos via `capacity`.
 */

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly capacity: number,
    private readonly refillPerSec: number,
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /** Bloqueia até ter pelo menos 1 token, então consome 1. */
  async acquire(): Promise<void> {
    while (true) {
      const now = Date.now();
      const elapsedSec = (now - this.lastRefill) / 1000;
      this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillPerSec);
      this.lastRefill = now;
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      const waitMs = Math.ceil(((1 - this.tokens) / this.refillPerSec) * 1000);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}

/** Instância default usada por search/track. 8 req/s. */
export const deezerBucket = new TokenBucket(8, 8);
