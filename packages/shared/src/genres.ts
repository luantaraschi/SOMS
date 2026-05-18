/**
 * Gêneros musicais expostos pelo SOMS (Sprint 1).
 *
 * - `label`: texto que aparece na UI do picker (pt-BR, lowercase).
 * - `deezerQuery`: string que o Provider Deezer (E1) usa em `?q=` para buscar
 *    tracks. Não confundir com Deezer genre IDs — usamos full-text search por
 *    flexibilidade (ex: "funk" precisa ser "funk carioca brasileiro" senão a
 *    Deezer retorna funk americano dos anos 70).
 *
 * ⚠️ Os `deezerQuery` aqui são chutes iniciais. Validar empiricamente em E1:
 *    rodar cada query, conferir se as 20 primeiras tracks fazem sentido para o
 *    público brasileiro, ajustar se necessário.
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
  deezerQuery: string;
};

export const GENRES: Record<GenreKey, GenreEntry> = {
  pop: { label: 'pop', deezerQuery: 'pop' },
  rock: { label: 'rock', deezerQuery: 'rock' },
  sertanejo: { label: 'sertanejo', deezerQuery: 'sertanejo' },
  funk: { label: 'funk', deezerQuery: 'funk carioca brasileiro' },
  pagode: { label: 'pagode', deezerQuery: 'pagode brasileiro' },
  mpb: { label: 'mpb', deezerQuery: 'mpb' },
  'hip-hop': { label: 'hip-hop', deezerQuery: 'hip hop rap' },
  'k-pop': { label: 'k-pop', deezerQuery: 'kpop korean pop' },
  eletronica: { label: 'eletrônica', deezerQuery: 'electronic dance edm' },
  indie: { label: 'indie', deezerQuery: 'indie alternative' },
};

/** Lista ordenada de todas as chaves de gênero. Útil para default permissivo (β). */
export const GENRE_KEYS: GenreKey[] = Object.keys(GENRES) as GenreKey[];

/** Type guard para validar payloads vindos do client antes de usar. */
export function isGenreKey(value: string): value is GenreKey {
  return value in GENRES;
}
