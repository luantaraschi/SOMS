/**
 * Gêneros musicais expostos pelo SOMS (Sprint 1).
 *
 * - `label`: texto que aparece na UI do picker (pt-BR, lowercase).
 * - `deezerQuery`: string que o Provider Deezer (E1) usa em `?q=` para buscar
 *    tracks. Não confundir com Deezer genre IDs — usamos full-text search por
 *    flexibilidade.
 *
 * **Estratégia: artistas-âncora (string[]).** Para gêneros onde a busca pelo
 * nome do gênero retorna lixo, listamos N artistas representativos como array.
 * Provider/seed faz 1 request por artista e junta candidates (dedup por id).
 *
 * Deezer search com múltiplos termos numa única string é AND fuzzy e pode
 * retornar 0 quando nenhuma track casa com todos os termos — array contorna.
 * (Diagnóstico empírico em 2026-05-18: "racionais filipe ret djonga" como uma
 * query única retornou 0; separados, retornam tracks de cada artista.)
 *
 * Validação 2026-05-18: 4 gêneros (pop, rock, sertanejo, k-pop) funcionam com
 * 1 query genérica; 6 precisaram de array de artistas-âncora.
 *
 * Sprint 2+ pode migrar para Deezer genre IDs (ver SPRINT_2_PREVIEW.md).
 */

export type GenreKey =
  | 'pop'
  | 'rock'
  | 'sertanejo'
  | 'funk'
  | 'pagode'
  | 'mpb'
  | 'hip-hop'
  | 'k-pop'
  | 'eletronica'
  | 'indie';

export type GenreEntry = {
  label: string;
  /**
   * Query Deezer:
   * - `string`: 1 request (quando o nome do gênero entrega mainstream).
   * - `string[]`: N requests (1 por artista-âncora), dedup por track id.
   */
  deezerQuery: string | string[];
};

export const GENRES: Record<GenreKey, GenreEntry> = {
  // Query genérica funciona — Deezer entrega tracks reais e populares.
  pop: { label: 'pop', deezerQuery: 'pop' },
  rock: { label: 'rock', deezerQuery: 'rock' },
  sertanejo: { label: 'sertanejo', deezerQuery: 'sertanejo' },
  'k-pop': { label: 'k-pop', deezerQuery: 'kpop korean pop' },

  // Artistas-âncora (string[]) — uma query por artista, candidates juntados
  // e dedupados por track id. Necessário porque queries com múltiplos nomes
  // próprios em sequência retornam 0 no Deezer (AND fuzzy estrito).
  funk: {
    label: 'funk',
    deezerQuery: ['mc hariel', 'anitta funk', 'mc cabelinho', 'kevin o chris', 'mc daniel'],
  },
  pagode: {
    label: 'pagode',
    deezerQuery: ['thiaguinho', 'ferrugem', 'sorriso maroto'],
  },
  mpb: {
    label: 'mpb',
    deezerQuery: ['chico buarque', 'caetano veloso', 'gilberto gil'],
  },
  'hip-hop': {
    label: 'hip-hop',
    deezerQuery: ['racionais', 'filipe ret', 'djonga'],
  },
  eletronica: {
    label: 'eletrônica',
    deezerQuery: ['calvin harris', 'david guetta', 'tiesto'],
  },
  indie: {
    label: 'indie',
    deezerQuery: ['arctic monkeys', 'bon iver', 'the national'],
  },
};

/** Lista ordenada de todas as chaves de gênero. Útil para default permissivo (β). */
export const GENRE_KEYS: GenreKey[] = Object.keys(GENRES) as GenreKey[];

/** Type guard para validar payloads vindos do client antes de usar. */
export function isGenreKey(value: string): value is GenreKey {
  return value in GENRES;
}
