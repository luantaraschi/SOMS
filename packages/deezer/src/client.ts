/**
 * HTTP wrapper para Deezer. Timeout 5s, retry com backoff em 429 + 5xx,
 * fail-fast em 4xx (não-429), erros tipados via `DeezerError`.
 *
 * Em Node 22+ usa o `fetch` nativo (que internamente é undici).
 */

import { DeezerError } from './types.js';

const DEFAULT_TIMEOUT_MS = 5_000;
const RETRY_DELAYS_MS = [200, 500, 1000];

/** Faz GET tipado contra Deezer. Lança `DeezerError` em qualquer falha terminal. */
export async function deezerFetch<T>(url: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<T> {
  const maxAttempts = RETRY_DELAYS_MS.length + 1;
  let attempt = 0;
  let lastError: DeezerError | null = null;

  while (attempt < maxAttempts) {
    attempt += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        return (await res.json()) as T;
      }

      // 4xx (não 429): falha imediata, sem retry.
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        throw new DeezerError(res.status, `HTTP ${res.status}`);
      }

      // 429 ou 5xx: retentável.
      lastError = new DeezerError(res.status, `HTTP ${res.status}`);
      if (attempt >= maxAttempts) break;
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1] ?? 1000));
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof DeezerError) throw e;
      lastError = new DeezerError(null, (e as Error).message ?? 'network error');
      if (attempt >= maxAttempts) break;
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1] ?? 1000));
    }
  }

  throw lastError ?? new DeezerError(null, 'exhausted retries');
}

export const DEEZER_API_BASE = 'https://api.deezer.com';
