/**
 * Matching de respostas (Sprint 1 — sem Levenshtein, sem aliases).
 *
 * Sprint 1: comparação por igualdade exata após normalização contra
 * `title` ou `artists[0]`. Segundo artista, feats e variações não são
 * considerados — ARCHITECTURE §8 prevê expansão em Sprint 2+.
 */

const DIACRITICS_RE = /[̀-ͯ]/g;
const MULTI_WS_RE = /\s+/g;

/**
 * Normaliza texto para comparação:
 * - lowercase
 * - remove acentos (NFD + filtro de diacritics)
 * - trim
 * - colapsa whitespace múltiplo para um espaço único
 */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .toLowerCase()
    .trim()
    .replace(MULTI_WS_RE, ' ');
}

export type MatchedField = 'title' | 'artist';

export type MatchResult = {
  matched: boolean;
  field: MatchedField | null;
};

/**
 * Tenta casar `guess` com o `title` ou `artists[0]` do track.
 * Comparação por igualdade após normalize. Sem fuzzy match.
 *
 * Retorna `{ matched: false, field: null }` em qualquer outro caso,
 * incluindo guess vazia e match contra `artists[1+]` (Sprint 1 ignora
 * artistas extras).
 */
export function matchGuess(
  guess: string,
  track: { title: string; artists: string[] },
): MatchResult {
  const guessN = normalize(guess);
  if (!guessN) return { matched: false, field: null };

  if (guessN === normalize(track.title)) {
    return { matched: true, field: 'title' };
  }

  const firstArtist = track.artists[0];
  if (firstArtist !== undefined && guessN === normalize(firstArtist)) {
    return { matched: true, field: 'artist' };
  }

  return { matched: false, field: null };
}
