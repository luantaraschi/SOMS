# Tech Debt

Lista curta de débitos técnicos conhecidos. Cada item tem: gatilho, ação, prazo.

---

## `ROOM_CODE_LENGTH` reduzido de 6 → 4 em C2

- **Onde:** [`packages/shared/src/constants.ts`](../../packages/shared/src/constants.ts) → `ROOM_CODE_LENGTH = 4`.
- **Decisão:** code de 4 chars (alfabeto 24 letras = 331.776 combinações) é suficiente pra qualquer escala prevista do produto. Reduzido do original 6 (191M combinações) por restrição visual — não cabia em `t-mega t-mono` no card hero em `/test-design`.
- **Quando voltar pra 5 ou 6:** se um dia houver risco real de colisão (>10k lobbies simultâneos no servidor — bem além do MVP), ou se medirmos taxa de "code já existe" no `generateUniqueRoomCode`. O alphabet collision rate em 5k salas concorrentes = ~1.5%; em 10k = ~3% (paradoxo do aniversário). Aceitável até lá.
- **Como reverter:** `ROOM_CODE_LENGTH = 6` em constants.ts, ajustar regex em `room-code.ts`, atualizar 8 hardcodes nos testes (já catalogados). Nenhuma migração de dados — codes em memória apenas.

---

## Transferência manual de host restrita a `lobby` (Sprint 1)

- **Onde:** [`apps/realtime/src/rooms/room-manager.ts`](../../apps/realtime/src/rooms/room-manager.ts) → `transferHost()` — check `if (room.status !== 'lobby')` → `HOST_TRANSFER_NOT_ALLOWED`.
- **Decisão:** transferência manual ("passar host") só permitida no status `'lobby'`. Fallback automático de host (quando host sai/desconecta) continua ativo em qualquer status.
- **Por quê:** escolha de produto pra Sprint 1 — evita confusão de UX durante partida (host muda durante round → quem controla o `room:next_round`?). Mais simples conceitualmente pro MVP.
- **Como reabrir:** se houver feedback real de uso ("queria ter passado o host no meio do jogo porque preciso sair"), remover o check de status em `transferHost()` é trivial (1 linha + ajustar 1 teste). Sem mudança de protocolo nem schema.

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

## ✅ RESOLVIDO — `previewUrl` efêmera (Akamai HDN Token Auth)

- **Resolução (Sprint 1, Bloco B):** re-fetch de `previewUrl` em batch no `room:start`, via `GET /track/{providerTrackId}` para cada track. Queue de rounds construída em memória. Ver [`ARCHITECTURE.md` §5.4](./ARCHITECTURE.md).
- **`Track.previewUrl` no banco:** preservado como informativo (last-known URL). **NÃO usar em runtime de partida** — sempre re-buscar.
- **Validação empírica (2026-05-18):** rodando `pnpm db:verify-cache` em 20 tracks após 40min do seed retornou 12/20 mortas (HTTP 403). Tokens `?hdnea=exp=<unix>~acl=...~hmac=...` (Akamai HDN) têm TTL ~30min.
- **Note histórica:** entry original previa "esperar bug aparecer" e sampling HEAD-check. Evidência empírica em 1h promoveu de tech debt para decisão arquitetural Sprint 1.

---

## Refinar `deezerQuery` de gêneros borderline (Sprint 1 → futuro)

- **Onde:** [`packages/shared/src/genres.ts`](../../packages/shared/src/genres.ts)
- **Sintomas observados em 2026-05-18:**
  - `rock` retorna tracks com "rock" no título mas que não são rock canon (Post Malone "rockstar", MJ "Rock with You").
  - `pagode` retorna Felipe Araújo (mais sertanejo do que pagode).
- **Decisão:** aceitar pro MVP — tracks reconhecíveis o suficiente para o loop básico do jogo, não vale afinar mais agora.
- **Ação futura:** considerar Deezer genre IDs ou pipeline ISRC-first proposto em [`SPRINT_2_PREVIEW.md`](./SPRINT_2_PREVIEW.md) (seção "Refatoração do provider Deezer").

---

## `deezerSearchMulti` prioriza o 1º artista de cada array

- **Onde:** [`packages/db/seed.ts`](../../packages/db/seed.ts) → `deezerSearchMulti()` + loop em `seedGenre()`.
- **Sintoma:** `Promise.all` preserva ordem do array, dedup só por `track.id`, loop quebra ao atingir `TRACKS_PER_GENRE`. Resultado: hip-hop pegou 2x Racionais, indie pegou 2x Arctic Monkeys, etc. — sempre o 1º artista da lista.
- **Decisão:** funcional para MVP, tracks são canônicas dos artistas-âncora. Aceito.
- **Ação futura:** quando o pool crescer ou virar provider real em E1 (Sprint 2), considerar **round-robin entre buckets** (pegar 1 de cada artista alternadamente) em vez de concat ordenado. Aumenta variedade sem custo extra de request.

---

## SOMS_OFFLINE descontinuado em pre-B

- **Status:** removido em [commit pre-B] de `.env`, `.env.example`, `ARCHITECTURE.md` §10/§5.4, `SPRINT_1.md` B5.
- **Por que:** premissa de cache permanente de `previewUrl` era inválida — tokens Akamai HDN têm TTL ~30min (60% mortas em <1h em dev). "Modo offline com cache" não é coerente porque o cache nunca é authoritative.
- **Substituído por:** `DEEZER_UNAVAILABLE_FOR_START` quando Deezer cai no `room:start` → sala volta pra LOBBY com erro explícito.
- **Quando precisar de modo offline (CI/E2E sem internet):** implementar via **fixture** — snapshot de respostas Deezer válidas + resolver mockado no Vitest (vi.mock do `@soms/deezer`). Provavelmente Sprint 3+ junto com testes E2E reais do `apps/realtime`.
