import { getTrackById } from '@soms/deezer';
import type { Logger } from 'pino';
import type { SelectedTrack } from './track-selector.js';

export type RoundQueueItem = {
  trackId: string;
  providerTrackId: string;
  title: string;
  artists: string[];
  decade: number;
  freshPreviewUrl: string;
  coverUrl: string;
};

export type PreloadError =
  | { code: 'DEEZER_UNAVAILABLE'; message: string }
  | { code: 'INSUFFICIENT_FRESH_TRACKS'; got: number; needed: number };

export type PreloadOpts = {
  selectedTracks: SelectedTrack[];
  spareTracks?: SelectedTrack[];
  logger: Logger;
};

/**
 * Faz refetch em paralelo de previewUrl frescas via Deezer. Substitui tracks
 * mortas (404, preview vazio) pelas de `spareTracks` na ordem.
 *
 * Estratégia: 1 round paralelo com TODOS (selected + spares). Filtra alive,
 * pega os primeiros `selectedTracks.length`. Rate limit já garantido pelo
 * token bucket do @soms/deezer.
 *
 * Cenários de erro:
 * - Todas as requests falharam (rede/5xx): DEEZER_UNAVAILABLE
 * - Alive < needed (mortas + spares insuficientes): INSUFFICIENT_FRESH_TRACKS
 */
export async function preloadRoundQueue(
  opts: PreloadOpts,
): Promise<{ ok: true; queue: RoundQueueItem[] } | { ok: false; error: PreloadError }> {
  const needed = opts.selectedTracks.length;
  const candidates = [...opts.selectedTracks, ...(opts.spareTracks ?? [])];

  const start = Date.now();
  const results = await Promise.allSettled(candidates.map(fetchOne));
  const elapsed = Date.now() - start;

  const failures = results.filter((r) => r.status === 'rejected');
  const successes = results.filter(
    (r): r is PromiseFulfilledResult<RoundQueueItem | null> => r.status === 'fulfilled',
  );
  const alive: RoundQueueItem[] = successes.flatMap((r) => (r.value ? [r.value] : []));

  opts.logger.info(
    {
      candidates: candidates.length,
      needed,
      alive: alive.length,
      dead: successes.length - alive.length,
      failed: failures.length,
      elapsedMs: elapsed,
    },
    'preloadRoundQueue: done',
  );

  if (alive.length === 0 && failures.length > 0) {
    return {
      ok: false,
      error: {
        code: 'DEEZER_UNAVAILABLE',
        message: 'all deezer fetches failed during preload',
      },
    };
  }

  if (alive.length < needed) {
    return {
      ok: false,
      error: { code: 'INSUFFICIENT_FRESH_TRACKS', got: alive.length, needed },
    };
  }

  return { ok: true, queue: alive.slice(0, needed) };
}

async function fetchOne(track: SelectedTrack): Promise<RoundQueueItem | null> {
  const detail = await getTrackById(track.providerTrackId);
  if (!detail) return null;
  if (!detail.preview) return null;
  return {
    trackId: track.id,
    providerTrackId: track.providerTrackId,
    title: track.title,
    artists: track.artists,
    decade: track.decade,
    freshPreviewUrl: detail.preview,
    coverUrl: detail.album?.cover_xl ?? '',
  };
}
