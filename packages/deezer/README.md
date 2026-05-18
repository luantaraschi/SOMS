## @soms/deezer

Cliente HTTP minimal para a Deezer Public API. Usado pelo `seed.ts` (cache inicial de tracks) e pelo `apps/realtime` em runtime (refetch de URLs frescas em `room:start` — ver `ARCHITECTURE.md` §5.4).

### Exports

| Símbolo | Função |
|---|---|
| `searchTracks({ query, limit })` | `GET /search?q=...` — retorna candidates |
| `searchTracksMulti(queries, limit)` | N searches em paralelo, dedup por `track.id` |
| `getTrackById(id)` | `GET /track/{id}` — retorna track com `release_date` + preview fresca (~30min TTL) |
| `TokenBucket` | Classe genérica de rate limit |
| `deezerBucket` | Instância default — 8 req/s |
| `DeezerError` | Erro tipado com `status` (HTTP) ou `null` (network) |
| Tipos | `DeezerSearchTrack`, `DeezerTrackDetail`, `DeezerSearchResponse` |

### Política HTTP

- **Timeout:** 5s por request (AbortController).
- **Retry:** até 3 retries em 429 + 5xx com backoff 200ms → 500ms → 1s.
- **4xx (não-429):** falha imediata, sem retry.
- **Rate limit:** token bucket 8 req/s. Limite público Deezer = 50 req/5s; mantemos abaixo.

### Uso típico

```ts
import { searchTracksMulti, getTrackById } from '@soms/deezer';

// Cache inicial (seed): só metadata; URLs vão expirar em ~30min
const candidates = await searchTracksMulti(['mc hariel', 'anitta funk']);

// Runtime (room:start): refetch para URL fresca
const fresh = await getTrackById(123456);
console.log(fresh?.preview); // URL válida por ~30min (Akamai HDN token)
```

Histórico em `ARCHITECTURE.md` §5 (fontes musicais) e §5.4 (Akamai HDN TTL).
