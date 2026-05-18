// Sprint 1 seed: popula o Postgres com 2 tracks Deezer por gênero, usando o
// mapeamento GENRES de @soms/shared.
//
// Caminho principal de track-selection em partida real é o Provider Deezer
// (apps/realtime/src/providers/deezer.ts — Bloco E1). Este seed serve para:
//   - Modo offline (SOMS_OFFLINE=true) — precisa ter tracks no banco
//   - Dev/testes sem internet
//   - Smoke test do token bucket que E1 vai usar
//
// Idempotente: chave única (provider, providerTrackId). Rodar 2x não duplica.

import { Prisma } from '@prisma/client';
import { GENRE_KEYS, GENRES, type GenreKey } from '@soms/shared';
import { prisma } from './src/index.js';

const DEEZER_API_BASE = 'https://api.deezer.com';
const TRACKS_PER_GENRE = 2;
const DEEZER_SEARCH_LIMIT = 25; // broader fetch; filter local (estratégia C)
const HEAD_CHECK_TIMEOUT_MS = 3000;

// ============================================================
//  Token bucket — max 8 req/s (limite público Deezer = 50/5s).
//  Mesmo padrão que E1 vai usar em produção.
// ============================================================
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly capacity: number,
    private readonly refillPerSec: number,
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

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

const bucket = new TokenBucket(8, 8);

// ============================================================
//  Tipos parciais da Deezer API (apenas o subset que usamos).
// ============================================================
type DeezerArtist = { id: number; name: string };
type DeezerAlbum = { id: number; title: string; cover_xl: string };
type DeezerSearchTrack = {
  id: number;
  title: string;
  preview: string;
  duration: number;
  artist: DeezerArtist;
  album: DeezerAlbum;
};
type DeezerTrackDetail = DeezerSearchTrack & {
  release_date?: string; // só aparece em /track/{id}, não em /search
};
type DeezerSearchResponse = { data: DeezerSearchTrack[]; total: number };

// ============================================================
//  Helpers de fetch.
// ============================================================
async function deezerSearch(q: string): Promise<DeezerSearchTrack[]> {
  await bucket.acquire();
  const url = `${DEEZER_API_BASE}/search?q=${encodeURIComponent(q)}&limit=${DEEZER_SEARCH_LIMIT}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`  ! Deezer search "${q}" → HTTP ${res.status}`);
      return [];
    }
    const json = (await res.json()) as DeezerSearchResponse;
    return json.data ?? [];
  } catch (e) {
    console.error(`  ! Deezer search "${q}" → ${(e as Error).message}`);
    return [];
  }
}

/**
 * Executa N buscas em paralelo e junta candidates, dedupando por track id.
 * Usado para `GenreEntry.deezerQuery: string[]` (artistas-âncora).
 */
async function deezerSearchMulti(queries: string[]): Promise<DeezerSearchTrack[]> {
  const buckets = await Promise.all(queries.map((q) => deezerSearch(q)));
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

async function deezerTrackDetail(id: number): Promise<DeezerTrackDetail | null> {
  await bucket.acquire();
  try {
    const res = await fetch(`${DEEZER_API_BASE}/track/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as DeezerTrackDetail;
  } catch {
    return null;
  }
}

async function headCheck(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEAD_CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function parseYear(releaseDate: string | undefined): number | null {
  if (!releaseDate) return null;
  const year = Number.parseInt(releaseDate.slice(0, 4), 10);
  return Number.isFinite(year) && year >= 1900 && year <= 2100 ? year : null;
}

function getDecade(year: number): number {
  return Math.floor(year / 10) * 10;
}

// ============================================================
//  Per-genre seeding.
// ============================================================
type GenreSummary = { inserted: number; existed: number; skipped: number };

async function seedGenre(genreKey: GenreKey): Promise<GenreSummary> {
  const entry = GENRES[genreKey];
  const queries = Array.isArray(entry.deezerQuery) ? entry.deezerQuery : [entry.deezerQuery];
  const queryDesc = queries.length === 1 ? `"${queries[0]}"` : JSON.stringify(queries);
  console.log(`\n[seed] genre="${genreKey}" query=${queryDesc}`);

  const candidates = await deezerSearchMulti(queries);
  if (candidates.length === 0) {
    console.warn(`  ⚠ zero candidates returned — consider adjusting deezerQuery`);
    return { inserted: 0, existed: 0, skipped: 0 };
  }

  let inserted = 0;
  let existed = 0;
  let skipped = 0;

  for (const dt of candidates) {
    if (inserted >= TRACKS_PER_GENRE) break;

    if (!dt.preview || !dt.artist?.name) {
      skipped += 1;
      continue;
    }

    const detail = await deezerTrackDetail(dt.id);
    const year = parseYear(detail?.release_date);
    if (year === null) {
      console.log(`  ? ${dt.title} — no valid year (skip)`);
      skipped += 1;
      continue;
    }

    const alive = await headCheck(dt.preview);
    if (!alive) {
      console.log(`  ✗ ${dt.title} — preview HEAD failed`);
      skipped += 1;
      continue;
    }

    const existing = await prisma.track.findUnique({
      where: {
        provider_providerTrackId: {
          provider: 'deezer',
          providerTrackId: String(dt.id),
        },
      },
    });

    if (existing) {
      existed += 1;
      console.log(`  ⟲ ${dt.title} — ${dt.artist.name} (${year}) [já existia]`);
      continue;
    }

    const data: Prisma.TrackCreateInput = {
      provider: 'deezer',
      providerTrackId: String(dt.id),
      title: dt.title,
      artists: [dt.artist.name],
      feats: [],
      album: dt.album?.title ?? null,
      coverUrl: dt.album?.cover_xl ?? null,
      previewUrl: dt.preview,
      duration: dt.duration ?? null,
      releaseYear: year,
      genres: [genreKey],
      deezerGenres: [],
      decade: getDecade(year),
    };

    await prisma.track.create({ data });
    console.log(`  ✓ ${dt.title} — ${dt.artist.name} (${year})`);
    inserted += 1;
  }

  if (inserted === 0 && existed === 0) {
    console.warn(`  ⚠ no usable tracks for genre="${genreKey}" — adjust deezerQuery?`);
  }

  return { inserted, existed, skipped };
}

// ============================================================
//  Main.
// ============================================================
function parseSeedGenres(): GenreKey[] {
  const raw = process.env.SEED_GENRES?.trim();
  if (!raw) return [...GENRE_KEYS];

  const requested = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const known = new Set<string>(GENRE_KEYS);
  const unknown = requested.filter((r) => !known.has(r));
  if (unknown.length > 0) {
    console.warn(`[seed] SEED_GENRES ignora chaves desconhecidas: ${unknown.join(', ')}`);
  }
  return requested.filter((r): r is GenreKey => known.has(r));
}

async function main(): Promise<void> {
  const genresToSeed = parseSeedGenres();
  const filtered = genresToSeed.length !== GENRE_KEYS.length;

  console.log('[seed] starting Deezer-driven seed...');
  console.log(
    `[seed] target: ${TRACKS_PER_GENRE} tracks × ${genresToSeed.length} genres = ${
      TRACKS_PER_GENRE * genresToSeed.length
    } max${filtered ? ` (filtered via SEED_GENRES=${genresToSeed.join(',')})` : ''}`,
  );
  console.log('[seed] rate limit: 8 req/s token bucket');

  const summary: Record<string, GenreSummary> = {};
  let totalInserted = 0;
  let totalExisted = 0;

  for (const genreKey of genresToSeed) {
    summary[genreKey] = await seedGenre(genreKey);
    totalInserted += summary[genreKey].inserted;
    totalExisted += summary[genreKey].existed;
  }

  console.log('\n[seed] summary por gênero:');
  for (const [genre, s] of Object.entries(summary)) {
    console.log(
      `  ${genre.padEnd(12)} → inserted=${s.inserted} existed=${s.existed} skipped=${s.skipped}`,
    );
  }

  const totalInDb = await prisma.track.count();
  console.log(`\n[seed] inserted this run: ${totalInserted}`);
  console.log(`[seed] already existed:   ${totalExisted}`);
  console.log(`[seed] total Track in DB: ${totalInDb}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e: unknown) => {
    console.error('[seed] FAILED:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
