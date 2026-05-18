# Tech Debt

Lista curta de débitos técnicos conhecidos. Cada item tem: gatilho, ação, prazo.

---

## Prisma 7: migrar de v6 para v7

- **Status atual:** Prisma 7.x já está **GA** (7.8.0 disponível em 2026-05-18). Estamos em `^6.0.0` resolvendo para 6.19.3.
- **Onde:** [`packages/db/package.json`](../../packages/db/package.json) — campo `"prisma": { "seed": "tsx seed.ts" }` + devDeps `prisma` e `@prisma/client`.
- **Aviso atual:** `prisma format` (Prisma 6) imprime deprecation warning sobre o campo `package.json#prisma` (vira erro em Prisma 7).
- **Decisão:** **migração adiada para DEPOIS do MVP funcional** — não "quando der". Razão: major recém-lançada, queremos esperar **~6 semanas de patches** antes de migrar (alvo aproximado: final de junho/2026) para não gastar tempo debugando bugs early-major.
- **O que precisa ser feito quando migrar:**
  1. Criar `packages/db/prisma.config.ts` movendo a config do seed (`seed: 'tsx seed.ts'`).
  2. Remover o campo `prisma` de `package.json`.
  3. Revisar breaking changes em queries — checar release notes oficiais (https://pris.ly/d/major-version-upgrade), procurar uso de APIs removidas/alteradas em `packages/db/src/index.ts`, `packages/db/seed.ts`, e qualquer query feita por `apps/realtime` ou `apps/web`.
  4. Atualizar `prisma` e `@prisma/client` para `^7.0.0` no `package.json` de `@soms/db`.
  5. Rodar `pnpm install` + `prisma generate` + `prisma migrate dev` para validar.
  6. Rodar `pnpm -w typecheck` e suite de testes completa.

---

## Detecção de `previewUrl` mortas no cache Deezer

- **Onde:** todo `Track.previewUrl` cacheado em [`packages/db/prisma/schema.prisma`](../../packages/db/prisma/schema.prisma) (provider Deezer).
- **Risco:** URLs de preview do Deezer podem caducar; partida iniciar com previews 404 quebra o `<audio>` no client e bloqueia o round.
- **Gatilho:** primeiro relato de "som não tocou" em partida real.
- **Ação proposta:** HEAD check em ~5% das tracks selecionadas por partida (sampling). Tracks com 404 marcadas para re-fetch via Deezer Provider. Possivelmente também job assíncrono periódico revalidando o cache inteiro.
- **Por que adiar:** Sprint 1 não trata. Custo de implementar HEAD-check de antemão > custo provável do bug. Esperar evidência empírica.
