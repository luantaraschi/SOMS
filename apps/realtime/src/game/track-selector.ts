import { prisma } from '@soms/db';
import type { RoomSettings } from '@soms/shared';
import type { Logger } from 'pino';

export type SelectedTrack = {
  id: string;
  providerTrackId: string;
  title: string;
  artists: string[];
  decade: number;
};

export type SelectTracksError =
  | { code: 'INSUFFICIENT_TRACKS'; available: number; requested: number }
  | { code: 'NO_TRACKS_MATCHED' };

export type SelectTracksOpts = {
  settings: RoomSettings;
  count: number;
  excludeIds?: string[];
  logger: Logger;
};

export async function selectTracksForGame(
  opts: SelectTracksOpts,
): Promise<{ ok: true; tracks: SelectedTrack[] } | { ok: false; error: SelectTracksError }> {
  const { genres, decades } = opts.settings.trackSource;

  const where: Record<string, unknown> = {};
  if (genres.length > 0) where.genres = { hasSome: genres };
  if (decades.length > 0) where.decade = { in: decades };
  if (opts.excludeIds && opts.excludeIds.length > 0) {
    where.id = { notIn: opts.excludeIds };
  }

  const start = Date.now();
  const rows = await prisma.track.findMany({
    where,
    select: {
      id: true,
      providerTrackId: true,
      title: true,
      artists: true,
      decade: true,
    },
  });
  const elapsed = Date.now() - start;

  opts.logger.info(
    { count: rows.length, genres, decades, elapsedMs: elapsed },
    'selectTracksForGame: query done',
  );

  if (rows.length === 0) {
    return { ok: false, error: { code: 'NO_TRACKS_MATCHED' } };
  }
  if (rows.length < opts.count) {
    return {
      ok: false,
      error: {
        code: 'INSUFFICIENT_TRACKS',
        available: rows.length,
        requested: opts.count,
      },
    };
  }

  const shuffled = shuffleInPlace([...rows]);
  const picked = shuffled.slice(0, opts.count).map((r) => ({
    id: r.id,
    providerTrackId: r.providerTrackId,
    title: r.title,
    artists: r.artists,
    decade: r.decade ?? 0,
  }));

  return { ok: true, tracks: picked };
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j] as T, arr[i] as T];
  }
  return arr;
}
