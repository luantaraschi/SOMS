// Diagnóstico: HEAD em todos os Track.previewUrl cacheados.
//
// Uso:
//   pnpm db:verify-cache
//   (ou: pnpm --filter @soms/db exec tsx scripts/verify-cache-health.ts)
//
// Sprint 1: as URLs Deezer expiram em ~30min (Akamai HDN). Resultado deste
// script é esperado degradar com o tempo — depois de ~1h do seed, 60-80% das
// URLs retornam HTTP 403. Isso é normal. O game loop (Bloco B / B5) re-fetcha
// URLs frescas no room:start, então o cache aqui é informativo, não authoritative.
//
// Use para: validar conectividade Deezer, debugar reports de "som não tocou",
// comparar cache-vs-runtime fresh-fetch.
//
// Ver ARCHITECTURE.md §5.4 e TECH_DEBT.md ("✅ RESOLVIDO — previewUrl efêmera").

import { prisma } from '../src/index.js';

const HEAD_TIMEOUT_MS = 5000;

type HeadResult = { ok: true; status: number } | { ok: false; detail: string };

async function headCheck(url: string): Promise<HeadResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEAD_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    return res.ok ? { ok: true, status: res.status } : { ok: false, detail: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, detail: (e as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

type DeadEntry = { title: string; artist: string; detail: string };

async function main(): Promise<void> {
  const tracks = await prisma.track.findMany({
    select: { id: true, title: true, artists: true, previewUrl: true },
  });

  console.log(`[verify-cache] checking ${tracks.length} tracks (HEAD, timeout=${HEAD_TIMEOUT_MS}ms)...`);

  let alive = 0;
  const dead: DeadEntry[] = [];

  for (const t of tracks) {
    const artist = t.artists[0] ?? '(?)';
    if (!t.previewUrl) {
      dead.push({ title: t.title, artist, detail: 'no previewUrl in DB' });
      continue;
    }
    const result = await headCheck(t.previewUrl);
    if (result.ok) {
      alive += 1;
    } else {
      dead.push({ title: t.title, artist, detail: result.detail });
    }
  }

  console.log(`\n[verify-cache] ${alive}/${tracks.length} alive`);
  if (dead.length > 0) {
    console.log(`[verify-cache] dead tracks (${dead.length}):`);
    for (const d of dead) {
      console.log(`  ✗ ${d.title} — ${d.artist} [${d.detail}]`);
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e: unknown) => {
    console.error('[verify-cache] FAILED:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
