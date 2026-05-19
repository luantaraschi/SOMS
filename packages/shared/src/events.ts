/**
 * Contratos de eventos WS entre client (`apps/web`) e server (`apps/realtime`).
 *
 * Forma compatível com socket.io: `EventMap = { 'event:name': (payload, ack?) => void }`.
 *
 * **Status:** lowercase com 6 valores, mesmo set usado pelo `RoomManager` interno
 * em `apps/realtime`. Sem mapeamento — o cliente recebe o estado interno cru, porque
 * precisa diferenciar `countdown` de `playing` de `reveal` pra UI.
 *
 * Esses 6 estados são o que circula via WS. A persistência (Prisma) usa um
 * subset uppercase (`LOBBY/PLAYING/ENDED/CLOSED`) — mapeamento DB acontece em
 * B4 só nos pontos de persistência.
 */

import type { SlotKind } from './slots.js';

// ============================================================
//  ENUMS COMO STRING LITERALS
// ============================================================

export type RoomMode = 'CLASSIC';
// Sprint 2+ adicionará 'BLIND_TEST' | 'WHO_SANG' | 'PLAYLIST_WARS' | 'COVER_REVEAL' | 'CHAOS'

export type RoomStatus =
  | 'lobby'
  | 'countdown'
  | 'playing'
  | 'reveal'
  | 'ended'
  | 'abandoned';

// ============================================================
//  ERROS DO SERVIDOR
// ============================================================

export type ServerErrorCode =
  // Vindos do RoomManager (mapeados 1:1 do RoomError em apps/realtime)
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'NICKNAME_TAKEN'
  | 'NICKNAME_INVALID'
  | 'ROOM_IN_PROGRESS'
  | 'ROOM_ENDED'
  | 'NOT_HOST'
  | 'PLAYER_NOT_IN_ROOM'
  | 'PLAYER_ALREADY_IN_ROOM'
  | 'INVALID_STATUS_TRANSITION'
  | 'HOST_TRANSFER_NOT_ALLOWED'
  | 'CANNOT_KICK_SELF'
  | 'CANNOT_TRANSFER_TO_SELF'
  // Específicos da camada socket
  | 'NOT_IN_ROOM'
  | 'UNAUTHENTICATED'
  | 'RATE_LIMITED'
  // Game (B4/B5)
  | 'INSUFFICIENT_TRACKS'
  | 'DEEZER_UNAVAILABLE_FOR_START'
  // Fallback
  | 'INTERNAL_ERROR';

export type ServerError = {
  code: ServerErrorCode;
  /** Mensagem em pt-BR, lowercase (voz SOMS). */
  message: string;
  details?: Record<string, unknown>;
};

// ============================================================
//  TIPOS AUXILIARES
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
  genres: string[];
  decades: number[];
};

export type PlayerSnapshot = {
  userId: string;
  nickname: string;
  joinedAt: number;
  isHost: boolean;
  isConnected: boolean;
};

export type RoomSnapshot = {
  code: string;
  status: RoomStatus;
  hostUserId: string;
  players: PlayerSnapshot[];
  settings: RoomSettings;
  yourUserId: string;
  /** Estado de jogo em andamento (presente quando status != lobby/ended/abandoned). */
  gameState?: GameStateSnapshot;
};

export type PlayerScoreSnapshot = {
  userId: string;
  totalPoints: number;
  /** Pontos por round (mesma ordem dos rounds completados). */
  roundPoints: number[];
};

export type CurrentRoundSnapshot = {
  index: number;
  totalRounds: number;
  startedAt: number;
  durationMs: number;
  previewUrl: string;
  slots: { kind: SlotKind; basePoints: number }[];
  /** Slots já preenchidos quando o cliente reconectou. */
  fills: SlotFillPublic[];
  decade: number;
};

export type LastRevealSnapshot = {
  roundIndex: number;
  track: TrackReveal;
  fills: SlotFillPublic[];
};

export type GameStateSnapshot = {
  currentRoundIndex: number;
  totalRounds: number;
  scores: PlayerScoreSnapshot[];
  currentRound?: CurrentRoundSnapshot;
  lastReveal?: LastRevealSnapshot;
};

// ============================================================
//  GUESS / GAME PAYLOADS (esqueletos pra B4/B5)
// ============================================================

/**
 * Resultado de um guess. Comunicado **privadamente** ao autor via
 * `game:guess:accepted`. Broadcasts públicos vão por `game:slot:filled`.
 */
export type GuessOutcome =
  | {
      kind: 'hit';
      slot: { kind: SlotKind; display: string };
      points: number;
      isTie: boolean;
    }
  | {
      kind: 'too_late';
      slot: { kind: SlotKind; display: string };
      winners: { nickname: string }[];
    }
  | { kind: 'miss' }
  | { kind: 'rate_limited' };

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

export type SlotWinnerPublic = {
  userId: string;
  nickname: string;
  pointsAwarded: number;
  tIntoRoundMs: number;
};

export type SlotFillPublic = {
  kind: SlotKind;
  display: string;
  winners: SlotWinnerPublic[];
};

// ============================================================
//  PAYLOADS DE EVENTOS — ROOM
// ============================================================

export type RoomCreatePayload = { settings: RoomSettings };

export type RoomCreateAck =
  | { ok: true; code: string; snapshot: RoomSnapshot }
  | { ok: false; error: ServerError };

export type RoomJoinPayload = { code: string };

export type RoomJoinAck =
  | { ok: true; snapshot: RoomSnapshot }
  | { ok: false; error: ServerError };

export type RoomLeaveAck = { ok: boolean };

export type RoomKickPayload = { targetUserId: string };
export type RoomKickAck = { ok: boolean; error?: ServerError };

export type RoomTransferHostPayload = { newHostUserId: string };
export type RoomTransferHostAck = { ok: boolean; error?: ServerError };

export type RoomSettingsUpdatePayload = { settings: Partial<RoomSettings> };
export type RoomSettingsUpdateAck = { ok: boolean; error?: ServerError };

// Broadcast events (server → cliente)
export type RoomPlayerJoinedEvent = { player: PlayerSnapshot };
export type RoomPlayerLeftEvent = {
  userId: string;
  reason: 'leave' | 'disconnect_timeout' | 'kick';
};
export type RoomPlayerDisconnectedEvent = { userId: string };
export type RoomPlayerReconnectedEvent = { userId: string };
export type RoomHostChangedEvent = {
  oldHostUserId: string;
  newHostUserId: string;
  reason: 'manual' | 'fallback';
};
export type RoomSettingsUpdatedEvent = { settings: RoomSettings };
export type RoomStatusChangedEvent = { from: RoomStatus; to: RoomStatus };
export type RoomDestroyedEvent = { code: string };

// ============================================================
//  PAYLOADS DE EVENTOS — GAME (esqueletos)
// ============================================================

export type GameStartAck = { ok: boolean; error?: ServerError };

export type GameGuessPayload = { text: string };

export type GameReadyNextRoundAck = { ok: boolean; error?: ServerError };

export type GamePreparingEvent = { totalRounds: number };

export type GameCountdownEvent = {
  secondsLeft: number;
  /** Timestamp absoluto (ms) em que o round vai começar. Cliente calcula remaining. */
  startsAt: number;
};

export type GameRoundStartedEvent = {
  roundIndex: number;
  totalRounds: number;
  /** Timestamp absoluto (ms) do início. Cliente calcula remaining = startedAt + durationMs - Date.now(). */
  startedAt: number;
  durationMs: number;
  previewUrl: string;
  /** Slots disponíveis (sem revelar `value`/`display`). */
  slots: { kind: SlotKind; basePoints: number }[];
  decade: number;
};

export type GameGuessAcceptedEvent = { outcome: GuessOutcome };

export type GameSlotFilledEvent = {
  slotKind: SlotKind;
  /** Não revela `display` enquanto o round está em curso — só na reveal. */
  winners: { userId: string; points: number }[];
  isFirstFill: boolean;
};

export type GameRoundRevealEvent = {
  roundIndex: number;
  track: TrackReveal;
  fills: SlotFillPublic[];
  scoresSnapshot: { userId: string; totalPoints: number }[];
  endedReason: 'timeout' | 'early';
};

export type GameRankingEntry = {
  userId: string;
  totalPoints: number;
  position: number;
};

export type GameEndedEvent = {
  ranking: GameRankingEntry[];
  totalRounds: number;
  durationMs: number;
};

// ============================================================
//  UTILITÁRIO — ping
// ============================================================

export type PingAck = { serverTime: number };

// ============================================================
//  MAPAS DE EVENTOS (socket.io v4)
// ============================================================

export interface ClientToServerEvents {
  // Sala
  'room:create': (payload: RoomCreatePayload, ack: (res: RoomCreateAck) => void) => void;
  'room:join': (payload: RoomJoinPayload, ack: (res: RoomJoinAck) => void) => void;
  'room:leave': (ack: (res: RoomLeaveAck) => void) => void;
  'room:kick': (payload: RoomKickPayload, ack: (res: RoomKickAck) => void) => void;
  'room:transfer_host': (
    payload: RoomTransferHostPayload,
    ack: (res: RoomTransferHostAck) => void,
  ) => void;
  'room:settings:update': (
    payload: RoomSettingsUpdatePayload,
    ack: (res: RoomSettingsUpdateAck) => void,
  ) => void;

  // Jogo (esqueletos)
  'game:start': (ack: (res: GameStartAck) => void) => void;
  'game:guess': (payload: GameGuessPayload) => void;
  'game:ready_next_round': (ack: (res: GameReadyNextRoundAck) => void) => void;

  // Utilitário
  ping: (ack: (res: PingAck) => void) => void;
}

export interface ServerToClientEvents {
  // Reconexão / snapshot inicial
  'room:snapshot': (snapshot: RoomSnapshot) => void;

  // Sala — broadcasts
  'room:player:joined': (payload: RoomPlayerJoinedEvent) => void;
  'room:player:left': (payload: RoomPlayerLeftEvent) => void;
  'room:player:disconnected': (payload: RoomPlayerDisconnectedEvent) => void;
  'room:player:reconnected': (payload: RoomPlayerReconnectedEvent) => void;
  'room:host:changed': (payload: RoomHostChangedEvent) => void;
  'room:settings:updated': (payload: RoomSettingsUpdatedEvent) => void;
  'room:status:changed': (payload: RoomStatusChangedEvent) => void;
  'room:destroyed': (payload: RoomDestroyedEvent) => void;

  // Jogo (esqueletos)
  'game:preparing': (payload: GamePreparingEvent) => void;
  'game:countdown': (payload: GameCountdownEvent) => void;
  'game:round:started': (payload: GameRoundStartedEvent) => void;
  'game:guess:accepted': (payload: GameGuessAcceptedEvent) => void;
  'game:slot:filled': (payload: GameSlotFilledEvent) => void;
  'game:round:reveal': (payload: GameRoundRevealEvent) => void;
  'game:ended': (payload: GameEndedEvent) => void;

  // Erros
  error: (payload: ServerError) => void;
}
