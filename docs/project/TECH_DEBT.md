# Tech Debt

Lista curta de débitos técnicos conhecidos. Cada item tem: gatilho, ação, prazo.

---

## Prisma 7: migrar `package.json#prisma` → `prisma.config.ts`

- **Onde:** [`packages/db/package.json`](../../packages/db/package.json) — campo `"prisma": { "seed": "tsx seed.ts" }`
- **Aviso atual:** `prisma format` (Prisma 6) imprime deprecation warning sobre este campo.
- **Gatilho:** quando Prisma 7 sair **GA** (não release candidate).
- **Ação:** criar `packages/db/prisma.config.ts`, mover a config do seed, remover o campo do `package.json`.
- **Por que adiar:** funciona em todo Prisma 6 GA; antes do v7 sair não há ganho real. Pinar versão exata seria mais ruído do que o warning.
