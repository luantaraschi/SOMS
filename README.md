# SOMS

Party game musical em tempo real onde os jogadores competem para adivinhar primeiro o título, o artista e as participações especiais de trechos de áudio.

[Estudo de caso](https://luantaraschi.dev/projeto-soms.html)

![SOMS Interface](docs/soms.webp)

## Como funciona

O SOMS é estruturado como um monorepo pnpm dividido em duas aplicações principais: o frontend web em Next.js e a API em tempo real desenvolvida com Fastify e Socket.IO.

O servidor de realtime gerencia o estado da sala, o relógio da partida e a fila de faixas musicais (`apps/realtime/src/game/round-runner.ts`). O mecanismo de pré-carregamento envia os metadados e os trechos de áudio antecipadamente aos clientes, garantindo sincronia milimétrica no início de cada rodada sem travamentos por buffering.

O armazenamento de histórico, salas e pontuações é gerenciado via Prisma ORM conectado a um banco de dados PostgreSQL.

## Rodar local

Dependências de ambiente (Docker para PostgreSQL):

```bash
docker compose up -d
```

Instalação e execução do monorepo:

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

## Estado

O projeto está configurado para execução local via Docker e pnpm. Não há servidor de demonstração público hospedado no momento.

## Licença

AGPL-3.0
