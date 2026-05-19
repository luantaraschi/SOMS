# ARCHITECTURE: SOMS

Documento técnico complementar ao PRD. Consolida as decisões de arquitetura, stack, estrutura, schema, protocolo de tempo real e máquina de estados antes do início da implementação.

**Status:** v1 — decisões fixadas para o MVP.

---

## 1. Stack consolidada

### Frontend (`apps/web`)

- **Next.js 15** (App Router, React 19, Server Components).
- **TypeScript** com `strict: true`.
- **Tailwind CSS v4** + **shadcn/ui** para componentes base.
- **Auth.js v5** (NextAuth) para autenticação.
- **socket.io-client** para WS.
- **Zustand** para estado de partida no cliente (placar local, fila de respostas, animações).
- **Zod** para validação compartilhada com backend.

### Servidor de tempo real (`apps/realtime`)

- **Node.js 22+** com **Fastify** + **Socket.IO**.
- Compartilha schema/cliente Prisma com o Next via `packages/db`.
- Mantém estado de salas ativas em **Upstash Redis** (TTL agressivo).
- Persiste no Postgres apenas no fim de cada round e no fim da partida.

### Banco e cache

- **Postgres no Neon** — dados persistentes (User, Room, Game, Round, Track, Guess, conquistas, cosméticos).
- **Upstash Redis** — estado efêmero de salas ativas (timers, presença, respostas em buffer). Tudo recuperável a partir do Postgres se cair.

### Hospedagem

| Componente | Onde | Por quê |
|---|---|---|
| `apps/web` | Vercel | Next.js, edge, CDN, `@vercel/og` |
| `apps/realtime` | Railway | WS persistente, deploy simples, scale vertical fácil |
| Postgres | Neon | Free tier real, branching para preview |
| Redis | Upstash | Serverless, free tier, HTTP API compatível com edge |

### Por que **não** WS na Vercel

Serverless e Edge Functions da Vercel não mantêm conexões TCP longas. Existem workarounds (Vercel Realtime, Pusher, Ably, Partykit), todos com custo crescente ou trade-offs. Para um MVP, um Fastify + Socket.IO num droplet Railway custa ~U$5/mês quando passa do free tier e dá controle total.

---

## 2. Estrutura do monorepo

```
soms/
├── apps/
│   ├── web/                    # Next.js (Vercel)
│   │   ├── src/
│   │   │   ├── app/            # App Router
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── server/         # Server Actions, API routes
│   │   └── package.json
│   └── realtime/               # Servidor WS (Railway)
│       ├── src/
│       │   ├── index.ts        # Bootstrap Fastify + Socket.IO
│       │   ├── rooms/          # Room manager, state machine
│       │   ├── game/           # Game loop, scoring, matching
│       │   ├── providers/      # Deezer, MusicBrainz, CoverArt
│       │   └── lib/            # Redis client, Prisma client
│       └── package.json
├── packages/
│   ├── db/                     # Prisma schema + client compartilhado
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── src/index.ts
│   │   └── package.json
│   └── shared/                 # Tipos e contratos
│       ├── src/
│       │   ├── events.ts       # Tipos de eventos WS (client↔server)
│       │   ├── scoring.ts      # Regras puras de pontuação
│       │   ├── matching.ts     # Lógica de normalização/match
│       │   └── constants.ts
│       └── package.json
├── pnpm-workspace.yaml
├── turbo.json                  # opcional, para cache de build
└── .env.example
```

---

## 3. Schema do banco (Prisma)

Versão consolidada e enxuta. Tudo em `packages/db/prisma/schema.prisma`.

```prisma
// Auth.js v5 standard tables
model Account { /* padrão Auth.js */ }
model Session { /* padrão Auth.js */ }
model VerificationToken { /* padrão Auth.js */ }

model User {
  id              String   @id @default(cuid())
  nickname        String
  avatar          String?  // url ou key de cosmético
  email           String?  @unique
  emailVerified   DateTime?
  image           String?
  isGuest         Boolean  @default(true)
  coins           Int      @default(0)
  equippedTitle   String?
  equippedBadge   String?
  createdAt       DateTime @default(now())
  lastSeenAt      DateTime @updatedAt

  accounts        Account[]
  sessions        Session[]
  hostedRooms     Room[]   @relation("RoomHost")
  guesses         Guess[]
  achievements    UserAchievement[]
  cosmetics       UserCosmetic[]
  playlists       ImportedPlaylist[]
}

model Room {
  id        String     @id @default(cuid())
  code      String     @unique  // ex: "ABKM" — 4 chars, alfabeto A-HJ-NP-Z (sem I/O)
  hostId    String
  host      User       @relation("RoomHost", fields: [hostId], references: [id])
  mode      RoomMode
  status    RoomStatus @default(LOBBY)
  settings  Json       // ver seção 7
  createdAt DateTime   @default(now())
  closedAt  DateTime?

  games     Game[]

  @@index([code])
  @@index([status])
}

enum RoomMode {
  CLASSIC
  BLIND_TEST
  WHO_SANG
  PLAYLIST_WARS   // pós-MVP
  COVER_REVEAL    // pós-MVP
  CHAOS           // preset = CLASSIC + chaos rules
}

enum RoomStatus {
  LOBBY
  PLAYING
  ENDED
  CLOSED
}

model Game {
  id           String   @id @default(cuid())
  roomId       String
  room         Room     @relation(fields: [roomId], references: [id])
  mode         RoomMode
  totalRounds  Int
  currentRound Int      @default(0)
  status       GameStatus @default(WAITING)
  startedAt    DateTime?
  endedAt      DateTime?
  rounds       Round[]
  finalStats   Json?    // estatísticas engraçadas calculadas no fim

  @@index([roomId])
}

enum GameStatus {
  WAITING
  IN_PROGRESS
  ENDED
}

model Round {
  id              String    @id @default(cuid())
  gameId          String
  game            Game      @relation(fields: [gameId], references: [id])
  index           Int       // 1..N
  trackId         String
  track           Track     @relation(fields: [trackId], references: [id])
  mode            RoomMode  // mesmo da Game na maioria dos casos
  specialRule     String?   // ex: "ONLY_ARTIST", "FEAT_DOUBLE"
  startedAt       DateTime?
  endedAt         DateTime?
  durationSeconds Int       // 5, 15, 30 etc.
  guesses         Guess[]

  @@index([gameId])
}

model Track {
  id               String   @id @default(cuid())
  provider         String   // "deezer" | "musicbrainz"
  providerTrackId  String
  title            String
  artists          String[] // array de artistas principais
  feats            String[] // array de feats
  album            String?
  coverUrl         String?
  previewUrl       String?
  duration         Int?     // segundos
  releaseYear      Int?
  genres           String[] // GenreKey[] de @soms/shared/genres — driver de busca/cache
  deezerGenres     String[] @default([]) // gêneros da metadata Deezer (Sprint 2+)
  decade           Int?     // 2000, 2010, 2020...
  aliases          Json?    // { title: [...], artists: {...} } para matching
  createdAt        DateTime @default(now())

  rounds           Round[]
  playlists        PlaylistTrack[]
  curatedPools     TrackPool[]

  @@unique([provider, providerTrackId])
  @@index([decade])
}

model Guess {
  id             String   @id @default(cuid())
  roundId        String
  round          Round    @relation(fields: [roundId], references: [id])
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  rawText        String
  normalizedText String
  result         GuessResult
  matchedField   String?  // "title" | "artist" | "feat" | null
  score          Int      @default(0)
  responseTime   Int      // ms desde o início do round
  submittedAt    DateTime @default(now())

  @@index([roundId])
  @@index([userId])
}

enum GuessResult {
  CORRECT
  CLOSE
  WRONG
  RATE_LIMITED
}

// Catálogo curado por mim (~200 faixas pra começar)
model TrackPool {
  id        String   @id @default(cuid())
  name      String   // ex: "BR Pop Anos 2010", "Funk Carioca", "K-Pop Hits"
  tags      String[] // gêneros, décadas, etc.
  tracks    Track[]
  createdAt DateTime @default(now())
}

// Playlists importadas por hosts (Deezer/Spotify URL)
model ImportedPlaylist {
  id          String   @id @default(cuid())
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  source      String   // "deezer" | "spotify"
  sourceUrl   String
  title       String
  trackCount  Int
  importedAt  DateTime @default(now())
  tracks      PlaylistTrack[]

  @@index([ownerId])
}

model PlaylistTrack {
  playlistId String
  trackId    String
  position   Int
  playlist   ImportedPlaylist @relation(fields: [playlistId], references: [id])
  track      Track            @relation(fields: [trackId], references: [id])

  @@id([playlistId, trackId])
}

model Achievement {
  id          String   @id        // slug, ex: "first-sound"
  name        String
  description String
  criteria    Json
  rewardCoins Int      @default(0)
  isTitle     Boolean  @default(false)
  isBadge     Boolean  @default(true)

  unlockedBy  UserAchievement[]
}

model UserAchievement {
  userId        String
  achievementId String
  unlockedAt    DateTime @default(now())

  user          User        @relation(fields: [userId], references: [id])
  achievement   Achievement @relation(fields: [achievementId], references: [id])

  @@id([userId, achievementId])
}

model Cosmetic {
  id     String  @id     // slug
  type   String           // "avatar" | "frame" | "effect" | "theme" | "sticker"
  name   String
  price  Int
  rarity String           // "common" | "rare" | "epic" | "legendary"

  owners UserCosmetic[]
}

model UserCosmetic {
  userId     String
  cosmeticId String
  acquiredAt DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id])
  cosmetic   Cosmetic @relation(fields: [cosmeticId], references: [id])

  @@id([userId, cosmeticId])
}
```

---

## 4. Autenticação: convidado + login opcional

**Estratégia:** sessão de convidado por cookie HTTP-only é criada na primeira visita; usuário pode "promover" pra conta logada depois.

### Fluxo

1. Usuário entra em `soms.app/sala/ABCD12` sem login → cria `User` com `isGuest=true`, `nickname=` o que ele digitar, cookie `soms_session` com JWT.
2. Joga normalmente. Coins, badges, histórico vinculados a esse user.
3. Em qualquer momento clica em "salvar progresso" → fluxo Auth.js Google/Discord.
4. Após login: se o user logado é novo, **migrar** os dados do guest user pro user logado (mesma transação no Prisma) e deletar o guest.
5. Se já existe conta logada com aquele provider e o guest tem dados, mesclar (manter coins do guest + coins existentes, etc).

### Providers (Auth.js v5)

- Google
- Discord
- Credentials customizado para guest (apenas para criar/recuperar sessão de convidado; não tem senha)

### Token entre Next.js e Realtime

O servidor de WS valida o JWT do cookie no `connect`. Mesma secret JWT que o Auth.js usa. Se inválido → desconecta. Implementação: middleware Socket.IO que lê `socket.handshake.auth.token` ou parseia cookie.

---

## 5. Fontes musicais (as 3 opções escolhidas)

### 5.1 Pool curado — **Sprint 2** *(revisão pós-A3 de Sprint 1)*

- Você cadastra ~200 faixas via script de seed (`packages/db/seed.ts`).
- Cada faixa entra como `Track` + relação com `TrackPool` (tags de gênero/década).
- ⚠️ Em Sprint 1, o `seed.ts` ainda existe mas com **apenas 10 tracks** e papel reduzido a **fallback offline** quando o Deezer Provider estiver indisponível. Pool curado completo (~200 faixas) + modelo `TrackPool` entram em Sprint 2.

### 5.2 Gênero/década com sorteio do Deezer — **Sprint 1** ✅

- Host escolhe `{ genres: ["funk", "pop"], decades: [2010, 2020] }` (defaults permissivos: todos selecionados).
- Servidor consulta Deezer search com query construída, filtra por preview disponível, sorteia N faixas.
- Cacheia em `Track` (provider="deezer") na primeira aparição → próxima vez não chama a API.
- **Tags de gênero ao cachear:**
  - `Track.genres`: array com a `GenreKey` usada na busca (ex: `["funk"]`); o `selectTracksForGame` consulta esse campo.
  - `Track.deezerGenres`: gêneros que a metadata do Deezer reporta para a track (resolvido via `genre_id`). Pode ser vazio. Não usado em Sprint 1; reservado para matching avançado em Sprint 2.
- **Rotação por slot:** quando `settings.trackSource.genres` tem múltiplos valores, `selectTracksForGame` sorteia 1 gênero por slot de track. Evita que "todos os gêneros" colapse em só pop.
- **Filtro de década (estratégia C):** ao mapear a track no provider, derivar `decade = floor(year / 10) * 10` do `release_date`. Filtrar `decade ∈ settings.trackSource.decades` antes do upsert.
- **Rate limit:** API pública Deezer ≈ 50 req / 5s por IP. Provider implementa token bucket simples (max 8 req/s, fila FIFO) para nunca disparar 429.

### 5.3 Link de playlist — **Sprint 2**

- Host cola URL de playlist Deezer (formato `https://www.deezer.com/playlist/123`).
- Worker chama Deezer API, importa tracks com preview disponível, cria `ImportedPlaylist` + `PlaylistTrack`.
- Mostra ao host: "X músicas importadas, Y sem preview foram descartadas".
- **Spotify fica de fora do MVP.** OAuth + scopes é trabalho não trivial; deixa pra fase 3.

### 5.4 Frescor de URLs — Akamai HDN Token Auth — **Sprint 1** ✅

**Problema:** as URLs de preview do Deezer (`https://cdnt-preview.dzcdn.net/...?hdnea=exp=<unix>~acl=...~hmac=...`) são assinadas via Akamai HDN Token Authentication com **expiração embutida** no parâmetro `exp`. TTL observado empiricamente: **~30 minutos**.

Cachear `previewUrl` no Postgres por mais que o TTL = URL morre antes do uso. Validação 2026-05-18: 12 de 20 tracks (60%) retornaram HTTP 403 após 40min do cache.

**Solução (Bloco B):** **re-fetch em batch no `room:start`**, antes do countdown.

1. RoomManager seleciona N tracks do banco via `selectTracksForGame` (§5.2) — **metadata-only**, `previewUrl` ignorado.
2. N requests paralelos: `GET https://api.deezer.com/track/{providerTrackId}`, sob token bucket 8 req/s.
3. Para cada response, extrai `.preview` (URL fresca, ~30min TTL).
4. Constrói queue em memória: `[{ trackId, freshPreviewUrl, title, artists, decade }, ...]`.
5. Se algum track retorna sem `preview` (removido do Deezer): descarta, busca substituta no banco.
6. Latência esperada: 300ms–2s para 3–10 rounds.

**UX durante o pre-load:**

- Server emite `game:preparing` → cliente mostra "Preparando partida..." (UX explica a espera).
- Quando queue pronta: emit `game:countdown` (3, 2, 1) normalmente.
- Se Deezer indisponível e TODAS tracks falham: erro `DEEZER_UNAVAILABLE_FOR_START`. Sala volta para `LOBBY` com mensagem clara — não há fallback automático para cache (URLs cacheadas vencem rápido; ver TECH_DEBT.md).

**`Track.previewUrl` no banco** continua existindo:

- Populado pelo seed (last-known URL ao momento do seed).
- Útil para debug e diagnóstico (`pnpm db:verify-cache`).
- **NÃO usar em runtime de partida.** Schema vai ganhar comentário explícito.

**Bonus:** essa estratégia também resolve "track removida do Deezer" — se `/track/{id}` retorna 404 ou sem `preview`, descartamos e buscamos substituta. Sem essa etapa, partida ficaria com round vazio.

**Sprint 2+ (ISRC-first):** o pipeline proposto em [`SPRINT_2_PREVIEW.md`](./SPRINT_2_PREVIEW.md) já assume re-fetch a cada uso (via `/track/isrc:{ISRC}`), mantendo esse comportamento naturalmente.

---

### Validação anti-vazio

Antes de iniciar a partida, garantir que o número de tracks disponíveis ≥ `totalRounds`. Senão, bloquear start com mensagem clara.

---

## 6. Protocolo de tempo real

Todos os eventos tipados em `packages/shared/src/events.ts`. Cliente e servidor importam do mesmo lugar — uma fonte de verdade.

### Cliente → Servidor

| Evento | Payload | Quem |
|---|---|---|
| `room:create` | `{ mode, settings }` | qualquer user logado/guest |
| `room:join` | `{ code, nickname }` | qualquer user |
| `room:leave` | — | em sala |
| `room:kick` | `{ userId }` | host |
| `room:settings:update` | `{ partial settings }` | host, status=LOBBY |
| `room:start` | — | host, status=LOBBY |
| `game:guess` | `{ text }` | em round |
| `game:ready_next` | — | host, status=REVEAL |
| `game:end` | — | host, qualquer hora |

> **Sprint 1 (revisado pós-A3) implementa:** `room:create`, `room:join`, `room:leave`, `room:settings:update`, `room:start`, `game:guess`, `game:ready_next`.
> **Fora do Sprint 1:** `room:kick` (Sprint 2), `game:end` (Sprint 2). Promoção de `room:settings:update` para Sprint 1 é decorrente do Provider Deezer entrar (host precisa selecionar gêneros/décadas no lobby).

### Servidor → Cliente

| Evento | Payload |
|---|---|
| `room:joined` | `{ room, players, you }` |
| `room:player:joined` | `{ player }` |
| `room:player:left` | `{ userId }` |
| `room:player:kicked` | `{ userId }` |
| `room:settings:updated` | `{ settings }` |
| `room:host:changed` | `{ newHostId }` (se host sai) |
| `game:countdown` | `{ secondsLeft }` (3, 2, 1) |
| `game:round:started` | `{ roundIndex, totalRounds, mode, specialRule, durationSeconds, payload }` * |
| `game:guess:result` | `{ userId, result, matchedField, score, isPublic }` |
| `game:round:reveal` | `{ track, scores: [{userId, delta, total}], firstAnswerers }` |
| `game:scores` | `{ ranking: [{userId, total}] }` |
| `game:ended` | `{ podium, stats, achievementsUnlocked, cards }` |
| `error` | `{ code, message }` |

> **Sprint 1 (revisado pós-A3) implementa:** `room:joined`, `room:player:joined`, `room:player:left`, `room:host:changed`, `room:settings:updated` (novo), `game:countdown`, `game:round:started`, `game:guess:result`, `game:round:reveal`, `game:ended`, `error`.
> **Fora do Sprint 1:** `game:scores` (placar entre rounds — Sprint 1 só emite score no `round:reveal`).

\* `payload` varia por modo:
- CLASSIC / BLIND_TEST / CHAOS: `{ previewUrl, startAt }`
- WHO_SANG: `{ previewUrl, startAt, choices: [a, b, c, d] }`
- COVER_REVEAL: `{ revealStrategy: "mosaic", coverUrl, audio?: previewUrl }`

### Notas de implementação

- Cada sala é uma **room do Socket.IO** (`io.to(code).emit(...)`).
- Timers de round vivem **no servidor**, jamais no cliente.
- Cliente envia respostas; servidor valida, pontua, broadcast resultado. Cliente nunca calcula score.
- `responseTime` é medido no servidor: `submitTimestamp - roundStartTimestamp`. Ignora drift de relógio.
- Reconexão: cliente reenvia `room:join` com mesma sessão; servidor reentrega snapshot do estado atual.

---

## 7. Máquina de estados da sala

```
                      room:create
                          │
                          ▼
                      ┌───────┐
        room:start    │ LOBBY │  ←─── (player joins/leaves)
        ──────────►   └───────┘
                          │
                          ▼
                    ┌───────────┐
                    │ COUNTDOWN │  3...2...1
                    └───────────┘
                          │
                          ▼          ┌─────────┐
                    ┌─────────┐  N+1 │         │
                    │ PLAYING │ ────►│  ENDED  │
                    └─────────┘      │         │
                          │          └─────────┘
                          ▼                │
                    ┌────────┐             ▼
                    │ REVEAL │       room:start (rematch)
                    └────────┘             │
                          │                ▼
                          │           (LOBBY again)
              ready_next  │
                          ▼
                  (próximo round →
                   COUNTDOWN ou ENDED se foi o último)
```

### Configurações da sala (`Room.settings` JSON)

```ts
type RoomSettings = {
  mode: RoomMode;
  totalRounds: number;          // default 10
  roundDurationSeconds: number; // default 30 (5 ou 3 ou 1 em blind test)
  trackSource: {
    type: "curated" | "genre_decade" | "playlist";
    poolId?: string;            // curated
    genres?: string[];          // genre_decade
    decades?: number[];         // genre_decade
    playlistId?: string;        // playlist
  };
  allowFeats: boolean;          // default true
  allowHints: boolean;          // default false
  approxAnswers: boolean;       // default true
  tolerance: "low" | "medium" | "high"; // default medium
  specialRules: "off" | "light" | "chaos"; // default off
  showCoverOnReveal: boolean;   // default true
  generateShareCards: boolean;  // default true
};
```

---

## 8. Sistema de respostas (matching)

Tudo em `packages/shared/src/matching.ts`. Função pura, testável, mesma lógica no servidor.

### Pipeline

1. **Normalização**
   - lowercase
   - remover acentos (`á → a`)
   - remover pontuação
   - colapsar whitespace
   - trim
2. **Expansão de aliases**: aplicar tabela de aliases do `Track.aliases` + tabela global de aliases comuns (`feat`, `ft`, `feat.`, etc.).
3. **Match por campo**:
   - tenta título exato → CORRECT
   - tenta artista exato → CORRECT (matchedField=artist)
   - tenta feat exato → CORRECT (matchedField=feat)
   - se nenhum bater, calcular distância de Levenshtein contra cada candidato
     - distância ≤ threshold → CORRECT com penalidade leve (-10% score)
     - distância levemente acima do threshold → CLOSE (sem pontos, mas feedback)
     - acima → WRONG
4. **Threshold por tolerância:**
   | Tolerância | Distância máx para CORRECT | Para CLOSE |
   |---|---:|---:|
   | low | 1 | 2 |
   | medium | 2 | 4 |
   | high | 3 | 6 |
   - Aplicado proporcionalmente ao tamanho da string (`min(threshold, len*0.25)`).

### Anti-abuso

- Stopwords (love, amor, baby, hit, song, music, the, a, o, you, eu) NUNCA pontuam sozinhas.
- Resposta com 1 palavra só pontua se tem ≥ 4 chars e não está na stoplist.
- Rate limit: **1 resposta a cada 400ms por jogador**. Excedente → `result: RATE_LIMITED`, sem pontuar, sem feedback público.

### Aliases

Seed inicial: você cadastra junto com as 200 faixas curadas. Estrutura:

```json
{
  "title": ["nome alternativo 1", "abreviação"],
  "artists": {
    "Kanye West": ["kanye", "ye"],
    "Charlie Brown Jr.": ["charlie brown junior", "charlie brown", "cbjr"]
  }
}
```

Pra músicas do Deezer importadas, começa sem aliases. Pós-MVP: ferramenta de admin para adicionar aliases observando os "quase" recorrentes.

---

## 9. Pontuação e regras de round (Clássico Turbinado)

Lógica server-authoritative em [`packages/shared`](../../packages/shared/) — `slots.ts`, `round-state.ts`, `scoring.ts`. Constantes em `constants.ts`.

### Modelo de slots

Cada track tem N slots de resposta:

- **1 slot `title`** (`POINTS_TITLE` = 100 pts base)
- **1 slot `artist`** para `artists[0]` (`POINTS_ARTIST` = 60 pts base)
- **N slots `feat`** para `artists[1+]` (`POINTS_FEAT` = 40 pts base cada)

Sprint 1 popula `feats: []` no seed, então tracks têm 2 slots; modelo está pronto pra feats em Sprint 2+.

### Speed bonus

Bônus linear decrescente de `SPEED_BONUS_MAX` (50) a 0 ao longo do round:

```
bonus = SPEED_BONUS_MAX × max(0, 1 − tIntoRoundMs / ROUND_DURATION_MS)
total = slot.basePoints + round(bonus)
```

`ROUND_DURATION_MS` = 30000 (30s).

### Empate temporal

Quando jogador A acerta um slot em `t = X`, **abre uma janela** de `TIE_WINDOW_MS` = 200ms.

- Jogadores que acertem o **mesmo valor** dentro de [X, X+200ms] **ganham os mesmos pontos que A** (sem bônus de "primeiro", sem penalidade).
- Após a janela: slot trava de vez. Tentativas posteriores no mesmo valor recebem `GuessOutcome.too_late` com a lista de winners.

`isWithinTieWindow(candidateT, firstFillT)` em `round-state.ts` é o predicado canônico.

### Encerramento antecipado

Round encerra **antes** do timeout quando:

1. TODOS os slots têm pelo menos 1 winner, **E**
2. Para cada slot, passou mais de `TIE_WINDOW_MS` desde o primeiro fill (janela fechada).

Caso contrário: round encerra por **timeout** quando `tIntoRoundMs >= ROUND_DURATION_MS`.

`shouldEndRound(roundState, activePlayers, now)` em `round-state.ts` é o predicado canônico.

### Jogador desconectado

- Considerado **inativo** após `DISCONNECT_GRACE_MS` (10s) sem reconectar.
- **Não bloqueia** encerramento antecipado (o critério é sobre slots, não sobre jogadores presentes).
- Pontos já marcados se mantêm — não perde score por sair.
- Reconectar dentro da grace: retoma normalmente, server reenvia snapshot do round.

`getActivePlayers(players, now)` filtra a lista para os ainda dentro da grace.

### Sem bônus de "complete"

Cada slot vale só ele mesmo (base + speed). **Não há** bônus extra por um mesmo jogador acertar múltiplos slots (título + artista) no mesmo round. Cada acerto é independente.

### NÃO implementado no Sprint 1

- streak multiplier
- mode multiplier (Blind Test 1.5×/2×)
- approx penalty (sem Levenshtein → todos os matches são exact)
- playlist owner delay (Playlist Wars é Sprint 2+)

---

## 10. Variáveis de ambiente

`.env.example` (raiz do monorepo):

```bash
# Compartilhado
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...           # Neon: direct (sem pooler) pra Prisma migrate
REDIS_URL=https://...upstash.io
REDIS_TOKEN=...

# JWT compartilhado entre web e realtime
AUTH_SECRET=...

# apps/web
NEXTAUTH_URL=https://soms.app
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
NEXT_PUBLIC_REALTIME_URL=https://soms-realtime.up.railway.app

# apps/realtime
PORT=8080
WEB_ORIGIN=https://soms.app          # CORS
DEEZER_API_BASE=https://api.deezer.com
MUSICBRAINZ_USER_AGENT=SOMS/0.1 (contato@soms.app)
```

---

## 11. ADRs leves (decisões importantes registradas)

| # | Decisão | Por quê |
|---|---|---|
| ADR-01 | Monorepo pnpm | Tipos compartilhados entre web/realtime sem dor |
| ADR-02 | Realtime separado em Railway | Vercel não suporta WS persistente |
| ADR-03 | Socket.IO em vez de ws nativo | Reconexão automática, rooms nativas, mais barato em DX |
| ADR-04 | Auth.js v5 com guest provider | Convidado + login opcional sem reinventar sessão |
| ADR-05 | Estado de sala em Redis, persistência só em milestones | Reduz I/O, recuperável do Postgres |
| ADR-06 | Server-side scoring e timers | Anticheat e elimina drift de relógio |
| ADR-07 | Spotify fora do MVP | OAuth + scopes é trabalho desproporcional pra import-only |
| ADR-08 | Levenshtein + threshold proporcional | Lib simples, sem ML, suficiente pro MVP |

---

## 12. Fora do escopo deste documento

- Design visual (cores, tipografia, mood). Tratar separadamente em `DESIGN.md` quando for hora.
- Política de moderação de nicknames além de regex básica.
- Internacionalização. MVP é só **pt-BR**.
- Acessibilidade detalhada. MVP segue boas práticas do shadcn/ui mas não é foco.
- Analytics. Pós-validação do loop principal.
