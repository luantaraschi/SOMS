# SOMS

> Web party game musical. Joga em sala, ouve clipes curtos, chuta título/artista/feat antes dos amigos, termina com stats engraçadas, badges e cards compartilháveis.

Monorepo gerenciado com **pnpm workspaces**.

## Estrutura

```
soms/
├── apps/
│   ├── web/         — Next.js 15, Vercel
│   └── realtime/    — Fastify + Socket.IO, Railway
├── packages/
│   ├── db/          — Prisma schema + client (Neon Postgres)
│   ├── shared/      — Tipos, contratos WS, regras puras
│   └── design-system/  — Tokens CSS, assets, UI kit, voz
└── docs/project/    — PRD, ARCHITECTURE, DESIGN, SPRINT_1
```

## Docs

- [PRD](docs/project/PRD.md) — produto, modos de jogo, escopo
- [ARCHITECTURE](docs/project/ARCHITECTURE.md) — stack, schema, protocolo WS
- [DESIGN](docs/project/DESIGN.md) — fonte de verdade visual (tokens, dark mode, componentes)
- [Design system](packages/design-system/README.md) — implementação: voz pt-BR, copy, preview cards, UI kit

## Setup

```bash
pnpm install         # ainda não rode — apps e packages estão como placeholders
```

## Stack

| Camada | Tecnologia | Hospedagem |
|---|---|---|
| Web | Next.js 15 + TS strict + Tailwind v4 + shadcn/ui | Vercel |
| Realtime | Fastify + Socket.IO + Node 22 | Railway |
| DB | Postgres | Neon |
| Cache | Redis | Upstash |
| Auth | Auth.js v5 | — |

Ver [ARCHITECTURE §1](docs/project/ARCHITECTURE.md) para detalhes.
