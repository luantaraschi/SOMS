# SPRINT 1: Protótipo jogável

Primeira fase do roadmap do PRD (seção 24 → "Fase 1: Protótipo jogável"), destrinchada em tarefas ordenadas com critério de aceite.

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
- [ ] Script `seed.ts` que insere **10 tracks de teste** (pode ser hardcoded com previewUrl de fontes públicas tipo Free Music Archive ou tracks Deezer já validadas; ver A3)

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
- [ ] `createRoom({ hostId, mode, settings })` → gera code de 6 chars único
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

**Aceite:** consigo conectar 2 clientes simulados (script Node) numa mesma sala e ver um o outro entrar.

#### B4. Game loop (Clássico Turbinado simplificado)
- [ ] Ao `room:start`: server seleciona N tracks aleatórias do banco
- [ ] Loop por round:
  - emit `game:countdown` (3, 2, 1, com setTimeout)
  - emit `game:round:started` com `{ roundIndex, previewUrl, durationSeconds: 20 }`
  - timer de 20s
  - durante o timer: aceita `game:guess`, valida via `shared.normalize` + match por igualdade contra title/artist[0], emite `game:guess:result` privado pro autor e broadcast quando CORRECT
  - ao fim: emit `game:round:reveal` com track info e ranking parcial
  - aguarda 5s ou `game:ready_next` do host
- [ ] Após último round: emit `game:ended` com ranking final
- [ ] Persistir Game e Rounds no Postgres ao fim

**Aceite:** dois clientes simulados jogam uma partida de 3 rounds e cada um recebe `game:ended` com ranking correto.

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
  - botão "Iniciar partida" (só visível pro host)
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
