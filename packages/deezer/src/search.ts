import { DEEZER_API_BASE, deezerFetch } from './client.js';
import { deezerBucket } from './rate-limit.js';
import type { DeezerSearchResponse, DeezerSearchTrack } from './types.js';

const DEFAULT_LIMIT = 25;

export type SearchTracksOptions = {
  query: string;
  limit?: number;
};

/**
 * Faz uma busca via `/search?q=<query>&limit=<n>`. Aplica rate limit.
 * Retorna `[]` em erro permanente (não lança).
 */
export async function searchTracks(opts: SearchTracksOptions): Promise<DeezerSearchTrack[]> {
  await deezerBucket.acquire();
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const url = `${DEEZER_API_BASE}/search?q=${encodeURIComponent(opts.query)}&limit=${limit}`;
  try {
    const json = await deezerFetch<DeezerSearchResponse>(url);
    return json.data ?? [];
  } catch (e) {
    console.error(`[deezer] search "${opts.query}" → ${(e as Error).message}`);
    return [];
  }
}

/**
 * Executa N buscas em paralelo e junta candidates, dedupando por track id.
 *
 * Necessário para `GenreEntry.deezerQuery: string[]` (artistas-âncora) —
 * Deezer search com múltiplos nomes próprios numa única query é AND fuzzy
 * estrito e pode retornar 0 mesmo com cada artista tendo tracks indexadas.
 */
export async function searchTracksMulti(queries: string[], limit?: number): Promise<DeezerSearchTrack[]> {
  const buckets = await Promise.all(queries.map((q) => searchTracks({ query: q, limit })));
  const seen = new Set<number>();
  const merged: DeezerSearchTrack[] = [];
  for (const list of buckets) {
    for (const t of list) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        merged.push(t);
      }
    }
  }
  return merged;
}
