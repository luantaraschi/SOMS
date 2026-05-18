import { DEEZER_API_BASE, deezerFetch } from './client.js';
import { deezerBucket } from './rate-limit.js';
import { DeezerError, type DeezerTrackDetail } from './types.js';

/**
 * Faz `GET /track/{id}` — retorna detalhe da track incluindo `release_date`
 * e URL preview **fresca** (Akamai HDN token, TTL ~30min).
 *
 * Em runtime de partida (`room:start`), use isto pra re-fetchar a URL antes
 * do countdown — não confie no `Track.previewUrl` cacheado, que decai.
 *
 * Retorna `null` em 404 (track removida do Deezer); lança `DeezerError` em
 * outras falhas (rede, 5xx esgotando retries).
 */
export async function getTrackById(id: number | string): Promise<DeezerTrackDetail | null> {
  await deezerBucket.acquire();
  try {
    return await deezerFetch<DeezerTrackDetail>(`${DEEZER_API_BASE}/track/${id}`);
  } catch (e) {
    if (e instanceof DeezerError && e.status === 404) return null;
    throw e;
  }
}
