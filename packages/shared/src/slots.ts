/**
 * Modelo de slots de resposta para o Clássico Turbinado.
 *
 * Cada track tem N slots:
 *   - 1 slot 'title' (POINTS_TITLE base)
 *   - 1 slot 'artist' para artists[0] (POINTS_ARTIST base)
 *   - N slots 'feat' para artists[1+] (POINTS_FEAT base cada)
 *
 * Round encerra quando todos os slots têm pelo menos 1 winner E a janela de
 * empate fechou para cada um (ver round-state.ts → `shouldEndRound`).
 *
 * Sprint 1: tracks no banco têm `artists: [único_artista]` (sem feats). Modelo
 * já suporta feats para Sprint 2+ sem mudar nada.
 */

import { POINTS_ARTIST, POINTS_FEAT, POINTS_TITLE } from './constants.js';
import { normalize } from './matching.js';

export type SlotKind = 'title' | 'artist' | 'feat';

export type Slot = {
  kind: SlotKind;
  /** Valor normalizado (lowercase, sem acentos) usado para matching. */
  value: string;
  /** Valor original para exibir na UI. */
  display: string;
  /** Pontos base do slot (sem bônus de velocidade). */
  basePoints: number;
};

/**
 * Constrói os slots de uma track. `artists[0]` é o principal; `artists[1+]`
 * são feats.
 */
export function buildSlotsForTrack(track: {
  title: string;
  artists: string[];
}): Slot[] {
  const slots: Slot[] = [];

  slots.push({
    kind: 'title',
    value: normalize(track.title),
    display: track.title,
    basePoints: POINTS_TITLE,
  });

  const mainArtist = track.artists[0];
  if (mainArtist !== undefined && mainArtist.trim() !== '') {
    slots.push({
      kind: 'artist',
      value: normalize(mainArtist),
      display: mainArtist,
      basePoints: POINTS_ARTIST,
    });
  }

  for (let i = 1; i < track.artists.length; i += 1) {
    const feat = track.artists[i];
    if (feat === undefined || feat.trim() === '') continue;
    slots.push({
      kind: 'feat',
      value: normalize(feat),
      display: feat,
      basePoints: POINTS_FEAT,
    });
  }

  return slots;
}

/**
 * Classifica um guess contra os slots ainda disponíveis. Retorna o slot que
 * bate, ou `null` se nenhum bate (ou se guess está vazio).
 *
 * Sprint 1: igualdade exata após normalize. Sem Levenshtein.
 *
 * O caller é responsável por filtrar `availableSlots` — passar somente os que
 * ainda não foram filled (ou os filled cuja janela de empate ainda está aberta).
 */
export function classifyGuess(
  guess: string,
  availableSlots: Slot[],
): { slot: Slot } | null {
  const guessN = normalize(guess);
  if (!guessN) return null;

  for (const slot of availableSlots) {
    if (slot.value === guessN) {
      return { slot };
    }
  }
  return null;
}
