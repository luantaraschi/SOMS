# Sprint 2 — Preview de escopo

> Snapshot do que ficou pra Sprint 2 a partir da revisão pós-A3 do Sprint 1. Vai ser refinado em `SPRINT_2.md` quando a fase atual fechar. Aqui só lista os itens, não detalha critério de aceite.

---

## O que entra na Sprint 2

### Catálogo musical avançado

- **Pool curado de ~200 faixas** com categorização por gênero, década e tags livres
  - Script `packages/db/seed.ts` evolui de fallback dev (Sprint 1) para fonte principal
  - Modelo `TrackPool` entra no Prisma (relação N:N com `Track`, lista de tags por pool)
  - Host pode escolher "fonte: pool curado" + selecionar um pool específico na criação da sala
- **Importer de playlist Deezer via URL pública**
  - Modelos `ImportedPlaylist` + `PlaylistTrack` entram no Prisma
  - Worker assíncrono: cola URL → busca via API Deezer → filtra previews disponíveis → salva no banco
  - UI mostra "X músicas importadas, Y descartadas por falta de preview" antes de iniciar
- **Cover Art Archive** para capas de alta qualidade
  - Substitui `cover_xl` do Deezer (até 1000x1000) por imagens do Cover Art Archive
  - Lookup por MBID (MusicBrainz ID) → fallback para `cover_xl` se inexistente
  - Já considerado no `Track.coverUrl` (campo único, troca de fonte é transparente)

### Matching mais inteligente

- **Levenshtein + aliases**
  - Função `matchGuess()` em `@soms/shared/matching` ganha pipeline: igualdade → aliases → Levenshtein com threshold proporcional ao tamanho da string
  - Estados de resposta passam de `CORRECT | WRONG | RATE_LIMITED` (Sprint 1) para incluir `CLOSE` (sem pontos, com feedback público)
  - Tabela de aliases lê de `Track.aliases` (Json) + tabela global de "ft", "feat", "part", apelidos comuns de artistas
  - Match contra `artists[1..]` e `feats[]` (Sprint 1 só compara `artists[0]`)
  - Configurável por sala: `tolerance: 'low' | 'medium' | 'high'`

### Autenticação

- **Auth.js v5 + providers Google e Discord**
  - Models `Account`, `Session`, `VerificationToken` entram no Prisma
  - Estratégia: JWT (sessão sem DB lookup, compartilhada com `apps/realtime`)
  - Middleware Socket.IO valida JWT no `connect` usando mesma `AUTH_SECRET`
- **Migração de guest → user logado**
  - Quando guest faz login, mesclar `coins`, `achievements`, `cosmetics` no user logado
  - Deletar o guest user após merge bem-sucedido
  - Transação Prisma garante atomicidade

### Estado e infraestrutura

- **Redis (Upstash) para estado de sala**
  - `RoomManager` deixa de ser em memória → estado persiste entre restarts do realtime
  - TTL agressivo (1h após `endedAt`)
  - Permite scale horizontal de `apps/realtime` futuramente

### Modos de jogo

- **Blind Test Extremo** — preview de 1s / 3s / 5s, multiplicador de pontos por dificuldade
- **Quem Cantou Isso?** — múltipla escolha de 4 artistas, uma resposta por jogador, errar trava

### Pós-partida engajamento

- **Estatísticas engraçadas** com templates fixos
  - Engine de regras: detecta padrões em `Guess[]` (artista mais chutado, primeiro acerto, "quase" recorrentes, streaks)
  - Templates em pt-BR ("memi chutou Drake em 7 dos 10 rounds", "ninguém acertou o feat de nenhuma música")
  - Salva em `Game.finalStats` (Json) e é emitido em `game:ended`
- **Cards compartilháveis via `@vercel/og`**
  - Server endpoint `/api/og/podium/[gameId]` retorna PNG 1080×1080 e 1080×1920
  - Layout segue tokens do `@soms/design-system` (cores chapadas, sem gradiente, score em Unbounded)
  - Botão "Compartilhar pódio" no `EndScreen`

### Auth dos providers musicais

- Confirmar credenciais Deezer (App ID/Secret) e MusicBrainz User-Agent em `.env.example`
- Documentar rate-limits e estratégia de backoff em ARCHITECTURE

---

## O que continua fora de Sprint 2 (pós-MVP)

- Modos `PLAYLIST_WARS`, `COVER_REVEAL`, `CHAOS` (preset)
- Cosméticos, loja, moedas funcionais (`Cosmetic`, `UserCosmetic`, `Achievement`, `UserAchievement` entram no schema mas sem UI de loja ainda)
- Spotify (importer ou playback) — adiado conforme ADR-07 do ARCHITECTURE
- Streamer mode, party mode presencial, torneios, eventos sazonais
- Ranking semanal, times avançados

---

## Estimativa preliminar

Sprint 2 é maior que Sprint 1 — provavelmente **12–18 dias** de trabalho focado, dependendo de quanto Auth.js + migração de guest pegam. Vai ser quebrado em sub-sprints quando virar `SPRINT_2.md`.
