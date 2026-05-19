/**
 * Estado server-authoritative de um round em andamento.
 *
 * Sprint 1: mantido em memória no RoomManager (sem Redis ainda). Inclui
 * regras de encerramento antecipado e janela de empate temporal.
 *
 * Ver ARCHITECTURE.md §9 (Pontuação e regras de round) para a especificação.
 */

import { DISCONNECT_GRACE_MS, TIE_WINDOW_MS } from './constants.js';
import type { Slot, SlotKind } from './slots.js';

export type SlotWinner = {
  userId: string;
  /** ms desde `startedAt` em que o jogador acertou. */
  tIntoRoundMs: number;
  /** Pontos efetivamente atribuídos (base + speed). */
  pointsAwarded: number;
};

export type SlotFill = {
  slotKind: SlotKind;
  winners: SlotWinner[];
  /** `tIntoRoundMs` do primeiro fill (= `winners[0].tIntoRoundMs`). */
  filledAt: number;
};

export type RoundState = {
  trackId: string;
  /** Slots da track (estrutura constante por round). */
  slots: Slot[];
  /** Slots já preenchidos. `fills[i].slotKind` corresponde ao kind de algum `slots[j]`. */
  fills: SlotFill[];
  /** Timestamp absoluto (Date.now()) do início do round. */
  startedAt: number;
  /** Duração total em ms (geralmente `ROUND_DURATION_MS`). */
  durationMs: number;
  /** Timestamp absoluto do fim. `undefined` se ainda ativo. */
  endedAt?: number;
};

/**
 * Snapshot mínimo de player para `shouldEndRound` e `getActivePlayers`.
 * Não inclui nickname etc. — só basta saber se ele ainda "conta" para o round.
 */
export type RoundPlayerSnapshot = {
  userId: string;
  isConnected: boolean;
  /** Timestamp da última desconexão. Combinado com `isConnected=false` decide se ainda está na grace. */
  lastDisconnectAt?: number;
};

/**
 * `true` se o candidato (acerto em `candidateTIntoMs`) caiu dentro da janela
 * de empate (`TIE_WINDOW_MS` após o primeiro fill).
 *
 * Empates ganham os MESMOS pontos do primeiro fill — não bônus, não penalidade.
 */
export function isWithinTieWindow(
  candidateTIntoMs: number,
  firstFillTIntoMs: number,
): boolean {
  return candidateTIntoMs - firstFillTIntoMs <= TIE_WINDOW_MS;
}

/**
 * Determina se o round deve encerrar antecipadamente.
 *
 * Critério: TODOS os slots têm pelo menos 1 winner E para cada slot já passou
 * mais de `TIE_WINDOW_MS` desde o primeiro fill (janela fechada).
 *
 * Round encerra por **timeout** quando `now - startedAt >= durationMs` —
 * isso fica no game loop, não aqui. Essa função só responde "tudo preenchido,
 * janelas fechadas?".
 *
 * Jogadores desconectados há ≥ `DISCONNECT_GRACE_MS` são considerados
 * inativos. Eles **não bloqueiam** o critério aqui (o critério é sobre slots).
 * O param `_activePlayers` é mantido na assinatura para futura extensão
 * (ex: "auto-encerrar se 0 active") sem quebrar consumidores.
 *
 * @param now timestamp absoluto atual (`Date.now()`), injetado para testes.
 */
export function shouldEndRound(
  roundState: RoundState,
  _activePlayers: RoundPlayerSnapshot[],
  now: number = Date.now(),
): boolean {
  if (roundState.endedAt !== undefined) return true;

  // (a) Todos os slots têm pelo menos 1 fill?
  if (roundState.fills.length < roundState.slots.length) return false;

  // (b) Para cada fill, janela de empate fechou?
  const tNow = now - roundState.startedAt;
  for (const fill of roundState.fills) {
    if (tNow - fill.filledAt <= TIE_WINDOW_MS) return false;
  }

  return true;
}

/**
 * Filtra players para os que estão "ativos": conectados OU desconectados há
 * menos de `DISCONNECT_GRACE_MS`.
 *
 * Usado pelo game loop para decidir "ainda tem alguém pra jogar?" ou pra
 * mostrar lista de ativos no client.
 */
export function getActivePlayers(
  players: RoundPlayerSnapshot[],
  now: number = Date.now(),
): RoundPlayerSnapshot[] {
  return players.filter((p) => {
    if (p.isConnected) return true;
    if (p.lastDisconnectAt === undefined) return false;
    return now - p.lastDisconnectAt < DISCONNECT_GRACE_MS;
  });
}
