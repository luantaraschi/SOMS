# SPRINT 1: Protótipo jogável

> ⚠️ **Documento revisado em 2026-05-18 pós-A3.** Ver [Alteração de escopo](#alteração-de-escopo-revisão-pós-a3) logo abaixo antes de seguir os blocos. Marcações inline no corpo apontam o que mudou em A2, B3, B4 e C2.

Primeira fase do roadmap do PRD (seção 24 → "Fase 1: Protótipo jogável"), destrinchada em tarefas ordenadas com critério de aceite.

---

## Alteração de escopo (revisão pós-A3)

> **Decisão tomada em 2026-05-18:** Sprint 1 passa a incluir o **Provider Deezer real** (busca em runtime por gênero/década). Pool curado e importer de playlist saem do Sprint 1 — ver [`SPRINT_2_PREVIEW.md`](./SPRINT_2_PREVIEW.md).

### Diff de escopo

| Item | Antes | Agora |
|---|---|---|
| **Provider Deezer (busca por gênero/década)** | Sprint 2 | ✅ **Sprint 1** |
| **Pool curado de ~200 faixas** | Sprint 1 (10 tracks seedadas como caminho principal) | Sprint 2 |
| **Importer de playlist Deezer** | já estava fora | Sprint 2 (sem mudança) |
| **10 tracks hardcoded em `seed.ts`** | caminho principal de track-selection | **fallback offline** para quando Deezer falhar / sem internet |
| **Lobby UI** | botão "Iniciar partida" só | **+ picker de gêneros e décadas** antes de iniciar |

### Bloco novo: E — Provider Deezer

Inserido entre Bloco B e Bloco C. Game loop (B4) passa a depender de E1 para selecionar tracks.

#### E1. HTTP client Deezer + search por gênero/década
- [ ] `apps/realtime/src/providers/deezer.ts` com cliente fetch tipado
- [ ] Função `searchTracks({ genres, decades, limit })` → consulta `https://api.deezer.com/search` montando query com `genre:"..." year:"..."`
- [ ] Filtra resposta: aceita só tracks com `preview` field não-nulo (Deezer já entrega só previews válidas, mas defensivo)
- [ ] Mapeia Deezer track shape → nosso `Track` shape (provider='deezer', providerTrackId=`String(deezerId)`, etc.)
- [ ] Trata 429 com backoff exponencial (3 retries, jitter, max 5s); falha após esgotar → exception tipada `DeezerUnavailable`

**Aceite:** teste de integração (com mock de fetch) cobrindo: busca por 1 gênero/década retorna N tracks tipadas, busca vazia retorna `[]`, 429 retentado, esgotamento retorna `DeezerUnavailable`.

#### E2. Cache no Postgres
- [ ] Persistir tracks novas via `prisma.track.upsert` com chave `provider_providerTrackId` (já é `@@unique` no schema)
- [ ] Não re-fetch se já existir no banco (cache forever no Sprint 1; TTL e re-validação ficam para Sprint 2)
- [ ] Helper `selectTracksForGame({ genres, decades, count })` em `apps/realtime/src/game/track-selection.ts`:
  - Busca no banco primeiro
  - Se `tracksDisponíveis < count`, chama Deezer Provider (E1) com `count - disponíveis` extra de buffer
  - Cacheia novos no banco antes de retornar
  - Retorna lista randomizada

**Aceite:** teste de integração com DB real cobrindo: 1ª chamada toca Deezer; 2ª chamada (mesmos params) é só do banco.

#### E3. Fallback offline
- [ ] Em `selectTracksForGame`, se `DeezerUnavailable` lançada **E** banco tem ≥ `count` tracks com `provider='deezer'`, usar essas (inclui as seedadas em A2)
- [ ] Se mesmo o fallback der `< count`, emitir `error: { code: 'INSUFFICIENT_TRACKS', message }` ao host. Sala não inicia.
- [ ] Log estruturado em todos os fallbacks (pino) para visibilidade em dev.

**Aceite:** teste cobrindo: Deezer up → usa Deezer; Deezer down + banco com tracks suficientes → usa banco; Deezer down + banco sem tracks → erro pro host.

### Bloco B impactado

- **B3** ganha um WS event novo: `room:settings:update` (só host, status=LOBBY). Payload `{ genres: string[], decades: number[] }`. Broadcast `room:settings:updated` pra todos os players.
- **B4** (game loop) passa a chamar `selectTracksForGame()` (E2) em vez de "selecionar N tracks aleatórias do banco".

### Bloco C impactado

- **C2 Lobby** ganha um **picker de gêneros e décadas** (multi-select). Host edita → emite `room:settings:update` → server broadcast `room:settings:updated` → todos os clients atualizam o snapshot de settings.
- Picker é desabilitado para non-hosts (visível, read-only).
- Lista de gêneros disponíveis: hardcoded inicial em `@soms/shared/constants.ts` (~10 opções pt-BR cobrindo pop, rock, sertanejo, funk, k-pop, eletrônico, hip-hop, indie, mpb, internacional). Mapeamento para Deezer genre query strings fica no provider.
- Lista de décadas: `[1990, 2000, 2010, 2020]`.

### Decisões consolidadas (3.1–3.6 + bônus)

> Decisões tomadas em 2026-05-18. Ficam fixadas a partir daqui — não reabrir sem motivo concreto.

#### 3.1 Lista de gêneros final (10)

Em [`packages/shared/src/genres.ts`](../../packages/shared/src/genres.ts) como `GENRES`:

`pop · rock · sertanejo · funk · pagode · mpb · hip-hop · k-pop · eletronica · indie`

Cada entrada tem `{ label, deezerQuery }`. Os `deezerQuery` são chutes iniciais a serem validados empiricamente em E1 (rodar a query, conferir 20 primeiros resultados, ajustar). Helpers: `GENRE_KEYS` (array ordenado), `isGenreKey()` (type guard para validar payloads do client).

#### 3.2 Filtro de década — estratégia C

- **Não** usar query Lucene `year:[A TO B]` no Deezer (frágil).
- Buscar broader no Deezer; ao mapear track no provider, derivar `decade = Math.floor(year / 10) * 10` a partir de `release_date`.
- Filtrar décadas no `upsert` para Postgres — só persiste tracks dentro de `settings.trackSource.decades`.
- Índice `@@index([decade])` no schema já existe (A2).

#### 3.3 Defaults permissivos (β) + rotação

- `room:create` cria sala com `settings.trackSource = { type: 'genre_decade', genres: [...GENRE_KEYS], decades: [...DECADES] }`.
- Host pode iniciar partida sem mexer no picker.
- **Rotação obrigatória em `selectTracksForGame` (E2)**: para cada slot de track da partida:
  1. Sorteia 1 gênero aleatório do conjunto `settings.trackSource.genres`.
  2. Busca cache do banco filtrando por aquele gênero ∩ qualquer das `decades` selecionadas.
  3. Se cache `< 1` para esse gênero/década, chama Deezer Provider (E1) para popular.
  4. Sorteia 1 track elegível ainda não usada na partida.
- Sem rotação, "todos os gêneros" pode degenerar em só pop. Bug explícito a evitar.

#### 3.4 ~~Flag `SOMS_OFFLINE`~~ — **descontinuada em pre-B**

A premissa era cachear `Track.previewUrl` no banco e usar em runtime quando Deezer estivesse offline. Validação empírica em 2026-05-18 (`pnpm db:verify-cache`): 60% das URLs morrem em <1h por Akamai HDN TTL ~30min. Cache de URLs **não é authoritative** em momento algum, então não há "modo offline" coerente.

**Substituído por:** erro `DEEZER_UNAVAILABLE_FOR_START` quando o pre-load em `room:start` falha. Sala volta para LOBBY. Para CI/E2E offline futuro (Sprint 3+), implementar fixture: snapshot de respostas Deezer mockadas + resolver injetado nos testes. Ver [`TECH_DEBT.md`](./TECH_DEBT.md).

#### 3.5 Mensagens de `INSUFFICIENT_TRACKS`

Em [`packages/shared/src/messages.ts`](../../packages/shared/src/messages.ts):

| Função | Quando | Saída |
|---|---|---|
| `insufficientTracksMessage(count)` | Sprint 1 / Bloco E3 (Deezer retornou < `totalRounds` tracks válidos) | varia por `count`: 0 / 1 / N |

Frases sem emoji, lowercase, secas. Sem ponto de exclamação.

> ⚠️ `insufficientTracksOfflineMessage` foi removida junto com `SOMS_OFFLINE` (ver 3.4).

#### 3.6 `Track.deezerGenres` (campo novo no schema)

Em [`packages/db/prisma/schema.prisma`](../../packages/db/prisma/schema.prisma):

```prisma
genres        String[]              // GenreKey[] usadas na busca/cache (consultado por selectTracksForGame)
deezerGenres  String[] @default([]) // gêneros que Deezer reporta na metadata; Sprint 2+
```

- `Track.genres` (já existia): driver do match e do cache. Recebe a `GenreKey` usada na busca (ex: `["funk"]`).
- `Track.deezerGenres` (novo): metadata do Deezer (resolvido via `genre_id`). Pode ficar vazio se Deezer não informar. Sprint 1 grava se vier, **não usa** para matching. Sprint 2 explorará para matching avançado.

Migration acontece em A4 (junto com `init`). Não migrar agora — banco ainda não existe.

#### Bônus (I) — Rate limit Deezer

- API pública do Deezer: ~50 req / 5s por IP.
- Em E1, implementar **token bucket simples**: max 8 req/s, fila FIFO. Esperar quando exceder (sem disparar 429).
- `logger.warn(...)` (pino) quando fila enfileira para visibilidade em dev.

#### Bônus (II) — Detecção de `previewUrl` mortas

Não tratado em Sprint 1. Anotado em [`TECH_DEBT.md`](./TECH_DEBT.md): HEAD check em ~5% das tracks selecionadas por partida, marcar 404 para re-fetch. Aguardar bug aparecer empiricamente antes de implementar.

### Estimativa atualizada

- Antes da revisão: **5–9 dias**
- Depois (com Bloco E, Lobby picker, settings update event, rate limit, offline flag): **7–12 dias** focados

Os ~2–3 dias extras se distribuem em: provider HTTP + cache + rotação (~1d), settings update + broadcast (~0.5d), lobby picker UI (~0.5d), integração com game loop + testes + rate limit (~1d).

### O que NÃO muda

- Sem matching aproximado (Levenshtein continua em Sprint 2)
- Sem auth real (guest hardcoded com nickname+localStorage)
- Sem stats engraçadas, badges, títulos, coins, cards compartilháveis
- Sem Redis (RoomManager continua em memória)
- Schema Prisma já está pronto: `Track.provider`, `Track.providerTrackId`, `Track.genres`, `Track.decade` foram criados em A2 antecipando isso
- Apenas modo `CLASSIC`

---

**Objetivo do sprint:** ter uma sala onde um host cria, um amigo entra por código, toca 3 previews de música, jogadores enviam respostas digitadas, sistema valida e pontua, ranking final aparece. Sem auth real ainda. Sem cosméticos. Sem estatísticas engraçadas. Sem cards. **Só o loop.**

**Não-objetivos deste sprint:**
- Login Google/Discord (usar guest hardcoded por enquanto)
- Mais de um modo (só Clássico Turbinado simplificado)
- Respostas aproximadas com Levenshtein (igualdade exata + normalização básica)
- Estatísticas engraçadas, badges, títulos, coins, cards
- Importação de playlist
- Deploy em produção (rodar local)

Quando este sprint estiver fechado, a Fase 2 do PRD começa.

---

## Ordem de execução

### Bloco A — Fundação (1-2 dias)

#### A1. Bootstrap do monorepo
- [ ] `pnpm init`, `pnpm-workspace.yaml` com `apps/*` e `packages/*`
- [ ] `tsconfig.base.json` na raiz com paths
- [ ] `.gitignore`, `.editorconfig`, `.prettierrc`
- [ ] `eslint.config.js` flat config compartilhado
- [ ] README curto explicando como rodar

**Aceite:** `pnpm install` na raiz funciona; workspaces detectados.

#### A2. Pacote `packages/db`
- [ ] Prisma instalado, `schema.prisma` apenas com User, Room, Game, Round, Track, Guess (versão enxuta, sem cosméticos/achievements ainda)
- [ ] `prisma generate`, `prisma migrate dev --name init`
- [ ] Cliente exportado em `packages/db/src/index.ts`
- [ ] Script `seed.ts` que insere **10 tracks Deezer pré-validadas** (HEAD 200 antes de gravar). ⚠️ **Após revisão de escopo (ver topo):** este seed deixa de ser o caminho principal de track-selection e passa a servir apenas como **fallback offline** para Bloco E3 quando Deezer estiver indisponível. Estrutura tipada e TODOs já entregues em A2.

**Aceite:** consigo importar `import { prisma } from "@soms/db"` de outro app e fazer um `prisma.user.create`.

#### A3. Pacote `packages/shared`
- [ ] Tipos de eventos WS (versão mínima: room:join, room:start, game:guess, game:round:started, game:round:reveal, game:guess:result, game:ended)
- [ ] Função `normalize(text: string): string` (lowercase, remove acentos, trim, colapsa espaços)
- [ ] Função `scoreGuess(args): number` simples (acerto título=100, acerto artista=60, bônus velocidade decrescente)
- [ ] Constantes: ROUND_DURATION_DEFAULT, MAX_GUESS_RATE_MS

**Aceite:** test unitários básicos passando para `normalize` e `scoreGuess` (Vitest).

#### A4. Banco rodando local
- [ ] Postgres local via Docker Compose OU instância Neon dev branch
- [ ] `.env` configurado
- [ ] `prisma db push` aplicado
- [ ] Seed rodado, 10 tracks no banco

**Aceite:** `pnpm db:studio` abre Prisma Studio mostrando os tracks.

---

### Bloco B — Servidor realtime (2-3 dias)

#### B1. Bootstrap `apps/realtime`
- [ ] Fastify + Socket.IO, TypeScript, `tsx` pra dev
- [ ] Healthcheck `GET /health` → 200
- [ ] CORS configurado pra `localhost:3000`
- [ ] Logger pino básico

**Aceite:** `pnpm --filter realtime dev` sobe na porta 8080, `curl localhost:8080/health` responde.

#### B2. Room manager em memória
- [ ] Classe `RoomManager` (em memória, sem Redis ainda — Redis fica pra sprint 2)
- [ ] `createRoom({ hostId, mode, settings })` → gera code de 4 chars único
- [ ] `joinRoom(code, user)` → adiciona player
- [ ] `leaveRoom(code, userId)`
- [ ] Cada sala tem state machine: LOBBY → COUNTDOWN → PLAYING → REVEAL → ENDED

**Aceite:** testes unitários da `RoomManager` cobrindo: criar sala, juntar player, sair, host sair (transfere host), não permitir join em sala ENDED.

#### B3. Eventos WS principais
- [ ] Middleware de auth que aceita um query param `?guestId=...&nickname=...` por enquanto (sem JWT ainda)
- [ ] `room:create` → cria sala, server retorna `room:joined` para o socket
- [ ] `room:join` → valida code, adiciona, broadcast `room:player:joined` pra sala
- [ ] `disconnect` → marca player como ausente, broadcast `room:player:left`
- [ ] `room:start` (só se sender == host) → muda status, dispara game loop (B4)
- [ ] ⚠️ **Pós-revisão:** `room:settings:update` (só host, status=LOBBY) payload `{ genres, decades }` → broadcast `room:settings:updated`. Necessário para o picker do Lobby (C2) feed-ar as queries do Provider Deezer (E1).

**Aceite:** consigo conectar 2 clientes simulados (script Node) numa mesma sala e ver um o outro entrar; host atualiza settings e o outro client recebe broadcast.

#### B4. Game loop (Clássico Turbinado simplificado)
- [ ] Ao `room:start`: server chama `selectTracksForGame({ genres, decades, count: totalRounds })` do Bloco **E2** → passa as N tracks selecionadas para **`preloadRoundQueue()` (B5)** que re-fetcha URLs frescas → resultado é a queue em memória. Validação anti-vazio: se queue resultar em `< totalRounds`, abortar com `INSUFFICIENT_TRACKS` ou `DEEZER_UNAVAILABLE_FOR_START` (ver B5).
- [ ] Loop por round (consome da queue de B5, **não** acessa `Track.previewUrl` diretamente):
  - emit `game:countdown` (3, 2, 1, com setTimeout)
  - emit `game:round:started` com `{ roundIndex, previewUrl, durationSeconds: 20 }`
  - timer de 20s
  - durante o timer: aceita `game:guess`, valida via `shared.normalize` + match por igualdade contra title/artist[0], emite `game:guess:result` privado pro autor e broadcast quando CORRECT
  - ao fim: emit `game:round:reveal` com track info e ranking parcial
  - aguarda 5s ou `game:ready_next` do host
- [ ] Após último round: emit `game:ended` com ranking final
- [ ] Persistir Game e Rounds no Postgres ao fim

**Aceite:** dois clientes simulados jogam uma partida de 3 rounds e cada um recebe `game:ended` com ranking correto.

#### B5. Pre-load de tracks — pré-requisito de B4 (URLs efêmeras do Deezer)

> Decorrente da descoberta empírica de URLs Akamai HDN expirando em ~30min. Ver [`TECH_DEBT.md`](./TECH_DEBT.md) (entry "✅ RESOLVIDO — previewUrl efêmera") e [`ARCHITECTURE.md §5.4`](./ARCHITECTURE.md).

- [ ] Função `preloadRoundQueue({ tracks, totalRounds })` em `apps/realtime/src/game/preload.ts`:
  - Recebe N tracks selecionadas em E2 (metadata; `previewUrl` cacheado é ignorado).
  - Dispara `GET https://api.deezer.com/track/{providerTrackId}` para cada, em paralelo, via token bucket 8 req/s (reutiliza o helper Deezer do provider — mesma classe usada no `seed.ts`).
  - Extrai `.preview` (URL fresca) e monta entradas `{ trackId, freshPreviewUrl, title, artists, decade }`.
  - Se algum track retorna sem preview (404 ou `preview === ""`): descarta, busca substituta no banco (re-invoca E2 com `count=1`, exclui IDs já na queue).
- [ ] Antes do countdown: server emit `game:preparing` para o socket. UX no client: "Preparando partida...".
- [ ] Se Deezer indisponível e **todas** as N tracks falham: emit `error: { code: 'DEEZER_UNAVAILABLE_FOR_START' }`. Sala volta para `LOBBY`. **Não há fallback automático para cache** — URLs cacheadas vencem em ~30min, e Sprint 1 não tem fixture system pra E2E offline (ver TECH_DEBT.md).

**Aceite:** teste de integração com fetch mockado — (a) 3 tracks no banco, 2 retornam preview válido + 1 vem sem preview → queue final tem 3 tracks (1 substituída via E2); (b) 0 retornam válidos → erro `DEEZER_UNAVAILABLE_FOR_START`.

---

### Bloco C — Frontend mínimo (2-3 dias)

#### C1. Bootstrap `apps/web`
- [ ] `pnpm create next-app`, TypeScript, App Router, Tailwind, ESLint
- [ ] shadcn/ui instalado, componentes Button, Input, Card, Toast
- [ ] Cliente Socket.IO em `lib/socket.ts` apontando pra `localhost:8080`
- [ ] Store Zustand pra estado da sala no client

**Aceite:** `pnpm --filter web dev` sobe na 3000 com homepage placeholder.

#### C2. Telas
- [ ] **Home** (`/`): input pra nickname (salva em localStorage), botão "Criar sala", input "Entrar por código" + botão
- [ ] **Lobby** (`/sala/[code]`):
  - lista de players conectados
  - badge de "host" no host
  - ⚠️ **Pós-revisão:** picker de gêneros (multi-select, ~10 opções pt-BR) + picker de décadas (`[1990, 2000, 2010, 2020]`). Só host edita; non-hosts veem read-only. Edição emite `room:settings:update`.
  - botão "Iniciar partida" (só visível pro host) — desabilitado se `genres.length === 0` ou `decades.length === 0`
  - se status virar PLAYING, redireciona pra `/sala/[code]/jogar`
- [ ] **Partida** (`/sala/[code]/jogar`):
  - reproduz o `previewUrl` recebido em `game:round:started` (HTML5 `<audio>` com autoplay; tratar bloqueio de autoplay com prompt no primeiro round)
  - timer visível
  - input de resposta com submit
  - feed de respostas: "Fulano acertou o artista!" / "Beltrano acertou a música!"
  - placar lateral
  - na tela de reveal: capa, título, artistas, pontos ganhos por player
- [ ] **Final** (`/sala/[code]/fim`): pódio simples (top 3 + lista completa), botão "Jogar de novo" (host) e "Sair"

**Aceite:** consigo abrir 2 abas anônimas, criar sala numa, entrar pelo código na outra, jogar 3 rounds, ver ranking final, voltar pro lobby.

#### C3. Identidade temporária
- [ ] Sem Auth.js ainda
- [ ] Ao entrar na home: gera `guestId` (`crypto.randomUUID()`) e salva em localStorage junto com nickname
- [ ] Socket conecta com esses dados via `socket.io-client` auth payload
- [ ] Banco cria User com `isGuest: true` no primeiro `room:join`

**Aceite:** dois browsers diferentes geram dois Users distintos no banco.

---

### Bloco D — Polimento mínimo (1 dia)

#### D1. UX básico
- [ ] Feedback visual de "respondeu certo" (animação Tailwind simples)
- [ ] Som curto de acerto/erro (opcional)
- [ ] Texto explicativo no primeiro acesso ("Digite o nome da música ou do artista")
- [ ] Tela de erro pra: sala não existe, sala cheia, sala já terminou

#### D2. Reconexão básica
- [ ] Se o socket cair durante a partida, reconectar automaticamente (Socket.IO já faz por padrão)
- [ ] Ao reconectar: server reenvia snapshot do estado atual do round se ainda em PLAYING

**Aceite:** posso fechar e reabrir a aba durante um round e cair na partida em andamento sem perder o lugar.

---

## Marcos verificáveis (vão pro Claude Code como checkpoints)

1. **Após Bloco A** → `pnpm test` na raiz roda os testes do `shared` e passam.
2. **Após Bloco B** → script `apps/realtime/scripts/sim-game.ts` que simula 2 clientes jogando uma partida termina sem erro e printa o ranking final.
3. **Após Bloco C** → uso real no browser, dois usuários, 3 rounds, sem console errors.
4. **Após Bloco D** → consigo gravar um vídeo de 2min mostrando o loop completo e nada quebra.

---

## Estimativa total

Entre **5 e 9 dias** de trabalho focado, dependendo de quanto cada bloco escala.
Não tente paralelizar blocos B e C. O frontend precisa do servidor estável pra não retrabalhar contratos.

---

## O que entra na Sprint 2 (pra não esquecer)

- Modo Blind Test Extremo
- Modo Quem Cantou Isso
- Auth.js Google + Discord, migração de guest pra user logado
- Respostas aproximadas com Levenshtein
- Redis em Upstash pra estado de sala
- Provider Deezer real (substitui as 10 tracks hardcoded)
- Provider MusicBrainz pra metadados
- Estatísticas engraçadas básicas (top 3 frases ao fim)
- Deploy: web na Vercel, realtime no Railway, Postgres em Neon prod
