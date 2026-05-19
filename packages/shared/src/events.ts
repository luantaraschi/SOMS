/**
 * Contratos de eventos WS entre client (`apps/web`) e server (`apps/realtime`).
 *
 * Forma compatível com socket.io: `EventMap = { 'event:name': (payload, ack?) => void }`
 *
 * Sprint 1: inclui o subset mínimo do loop principal — criar/juntar sala,
 * iniciar partida (com pre-load de tracks — ver `ARCHITECTURE.md §5.4`),
 * countdown, round started, guess accepted (private) + slot filled (broadcast),
 * round reveal, partida fim.
 *
 * Modelo de slots (substitui o velho `GuessResult`):
 *   - Cada track tem N slots ('title', 'artist', N×'feat' — ver slots.ts).
 *   - Cada guess é classificado em um de 4 outcomes (ver `GuessOutcome`).
 *   - Round encerra quando todos os slots têm winners E janela de empate
 *     fechou (ver round-state.ts → `shouldEndRound`).
 *   - Ver ARCHITECTURE.md §9 para spec completa.
 *
 * Eventos do ARCHITECTURE §6 **não** incluídos aqui (Sprint 2+):
 *   - room:kick, game:end (encerrar antes do tempo)
 *   - variações de RoundPayload (BLIND_TEST, WHO_SANG, COVER_REVEAL)
 */

import type { SlotKind } from './slots.js';

// ============================================================
//  ENUMS COMO STRING LITERALS (paridade com Prisma)
// ============================================================

export type RoomMode = 'CLASSIC';
// Sprint 2+ adicionará 'BLIND_TEST' | 'WHO_SANG' | 'PLAYLIST_WARS' | 'COVER_REVEAL' | 'CHAOS'

export type RoomStatus = 'LOBBY' | 'PLAYING' | 'ENDED' | 'CLOSED';

export type ErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ROOM_ENDED'
  | 'NOT_HOST'
  | 'INVALID_STATE'
  | 'NICKNAME_INVALID'
  | 'GUESS_RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'INSUFFICIENT_TRACKS'
  | 'DEEZER_UNAVAILABLE_FOR_START';

// ============================================================
//  GUESS OUTCOME — discriminated union (private ao guesser)
// ============================================================

/**
 * Resultado de um guess. Comunicado **privadamente** ao autor via
 * `game:guess:accepted`. Broadcasts públicos vão por `game:slot:filled`.
 */
export type GuessOutcome =
  /** Acertou um slot livre — ganhou pontos (base + speed). */
  | {
      kind: 'hit';
      slot: { kind: SlotKind; display: string };
      points: number;
      /** True se este guess caiu na tie window de um slot já com 1+ winner. */
      isTie: boolean;
    }
  /** Slot já preenchido e janela de empate fechou — sem pontos. */
  | {
      kind: 'too_late';
      slot: { kind: SlotKind; display: string };
      /** Quem(s) pegou primeiro. */
      winners: { nickname: string }[];
    }
  /** Não bateu em nenhum slot. */
  | { kind: 'miss' }
  /** Excedeu `GUESS_RATE_LIMIT_MS` — guess descartado. */
  | { kind: 'rate_limited' };

// ============================================================
//  TIPOS AUXILIARES (snapshots e shapes compartilhados)
// ============================================================

export type RoomSettings = {
  totalRounds: number;
  roundDurationSeconds: number;
  trackSource: TrackSource;
};

/**
 * Fonte de tracks de uma partida. Sprint 1 só tem `genre_decade`.
 * Sprint 2 adicionará `curated` (pool) e `playlist` (Deezer URL).
 */
export type TrackSource = {
  type: 'genre_decade';
  genres: string[]; // GenreKey[] do GENRES map em ./genres
  decades: number[]; // subset de DECADES em ./constants
};

export type Player = {
  id: string;
  nickname: string;
  isHost: boolean;
  isConnected: boolean;
};

export type RoomSnapshot = {
  id: string;
  code: string;
  status: RoomStatus;
  mode: RoomMode;
  settings: RoomSettings;
};

export type RoundPayload = {
  previewUrl: string;
};

export type ScoreSnapshot = {
  userId: string;
  nickname: string;
  total: number;
};

export type ScoreDelta = {
  userId: string;
  delta: number;
  total: number;
};

export type TrackReveal = {
  title: string;
  artists: string[];
  album: string | null;
  coverUrl: string | null;
  releaseYear: number | null;
};

export type PodiumEntry = {
  rank: 1 | 2 | 3;
  userId: string;
  nickname: string;
  score: number;
};

/** Winner identificado publicamente em `game:slot:filled` e `game:round:reveal`. */
export type SlotWinnerPublic = {
  userId: string;
  nickname: string;
  pointsAwarded: number;
  tIntoRoundMs: number;
};

/** Estado de um slot ao final do round, usado no reveal. */
export type SlotFillPublic = {
  kind: SlotKind;
  /** Valor revelado (ex: "Pop", "Harry Styles"). */
  display: string;
  /** Winners do slot (1 = sem empate; >1 = empates dentro da TIE_WINDOW). Pode ser `[]` se ninguém acertou. */
  winners: SlotWinnerPublic[];
};

// ============================================================
//  PAYLOADS DE EVENTOS
// ============================================================

export type RoomCreatePayload = {
  mode: RoomMode;
  settings: RoomSettings;
};

export type RoomCreateAck = { code: string };

export type RoomJoinPayload = {
  code: string;
  nickname: string;
};

export type RoomJoinAck = { ok: true } | { ok: false; error: ErrorCode; message: string };

export type GameGuessPayload = {
  text: string;
};

// room:settings:update — host edita gêneros/décadas no lobby (status=LOBBY).
export type RoomSettingsUpdatePayload = {
  genres: string[];
  decades: number[];
};

// room:settings:updated — server broadcast pra todos os players da sala.
export type RoomSettingsUpdatedEvent = {
  settings: RoomSettings;
};

export type RoomJoinedEvent = {
  room: RoomSnapshot;
  players: Player[];
  you: Player;
};

export type RoomPlayerJoinedEvent = { player: Player };
export type RoomPlayerLeftEvent = { userId: string };
export type RoomHostChangedEvent = { newHostId: string };

/**
 * `game:preparing` — emitido em `room:start`, **antes do countdown**, enquanto
 * o pre-load de URLs frescas roda (ver ARCHITECTURE.md §5.4 / SPRINT_1.md B5).
 * UX no cliente: "Preparando partida...".
 */
export type GamePreparingEvent = { totalRounds: number };

export type GameCountdownEvent = { secondsLeft: number };

export type GameRoundStartedEvent = {
  roundIndex: number; // 1..totalRounds
  totalRounds: number;
  durationSeconds: number;
  previewUrl: string; // URL fresca via pre-load
};

/** `game:guess:accepted` — **PRIVADO** ao autor. Confirmação + outcome. */
export type GameGuessAcceptedEvent = {
  outcome: GuessOutcome;
};

/**
 * `game:slot:filled` — **BROADCAST**. Slot recém-preenchido OU novo winner
 * dentro da tie window. Cliente atualiza placar e mostra animação de acerto.
 */
export type GameSlotFilledEvent = {
  slotKind: SlotKind;
  /** Valor revelado (ex: "Pop"). */
  slotDisplay: string;
  /** Winners deste broadcast — 1 elemento se `isFirstFill=true` (sem empate), 1+ se empate. */
  winners: SlotWinnerPublic[];
  /** True na 1ª vez que o slot é preenchido; false = winner(s) adicional(is) dentro da tie window. */
  isFirstFill: boolean;
};

export type GameRoundRevealEvent = {
  track: TrackReveal;
  /** Estado final dos slots da track. Slots sem winners aparecem com `winners: []`. */
  slotFills: SlotFillPublic[];
  /** Total acumulado + delta deste round, por player. */
  scores: ScoreDelta[];
};

export type GameEndedEvent = {
  podium: PodiumEntry[];
  ranking: ScoreSnapshot[];
};

export type ErrorEvent = {
  code: ErrorCode;
  message: string;
};

// ============================================================
//  MAPAS DE EVENTOS (compatíveis com socket.io v4)
// ============================================================

export interface ClientToServerEvents {
  'room:create': (payload: RoomCreatePayload, ack: (res: RoomCreateAck) => void) => void;
  'room:join': (payload: RoomJoinPayload, ack: (res: RoomJoinAck) => void) => void;
  'room:leave': () => void;
  'room:settings:update': (payload: RoomSettingsUpdatePayload) => void;
  'room:start': () => void;
  'game:guess': (payload: GameGuessPayload) => void;
  'game:ready_next': () => void;
}

export interface ServerToClientEvents {
  'room:joined': (payload: RoomJoinedEvent) => void;
  'room:player:joined': (payload: RoomPlayerJoinedEvent) => void;
  'room:player:left': (payload: RoomPlayerLeftEvent) => void;
  'room:host:changed': (payload: RoomHostChangedEvent) => void;
  'room:settings:updated': (payload: RoomSettingsUpdatedEvent) => void;
  'game:preparing': (payload: GamePreparingEvent) => void;
  'game:countdown': (payload: GameCountdownEvent) => void;
  'game:round:started': (payload: GameRoundStartedEvent) => void;
  /** Privado — só o guesser recebe. */
  'game:guess:accepted': (payload: GameGuessAcceptedEvent) => void;
  /** Broadcast — slot preenchido ou empate dentro da tie window. */
  'game:slot:filled': (payload: GameSlotFilledEvent) => void;
  'game:round:reveal': (payload: GameRoundRevealEvent) => void;
  'game:ended': (payload: GameEndedEvent) => void;
  error: (payload: ErrorEvent) => void;
}
