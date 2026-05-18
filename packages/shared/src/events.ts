/**
 * Contratos de eventos WS entre client (`apps/web`) e server (`apps/realtime`).
 *
 * Forma compatível com socket.io:
 *   `EventMap = { 'event:name': (payload, ack?) => void }`
 *
 * Sprint 1 inclui o subset mínimo: criar sala, juntar, sair, iniciar partida,
 * loop de round (countdown → started → guess → reveal) e fim de partida.
 *
 * Eventos do ARCHITECTURE §6 que **não** estão aqui (Sprint 2+):
 *   - room:kick, game:end (encerrar antes do tempo)
 *   - game:scores (placar entre rounds — Sprint 1 só emite score no round:reveal)
 *   - variações de RoundPayload (BLIND_TEST, WHO_SANG, COVER_REVEAL)
 *
 * `room:settings:update` / `room:settings:updated` foram **promovidos a Sprint 1**
 * com a revisão de escopo (Provider Deezer entrou; host precisa selecionar
 * gêneros/décadas no lobby antes de iniciar).
 *
 * Quando entrarem, ampliar os mapas `ClientToServerEvents` e
 * `ServerToClientEvents` aqui — esta é a fonte única de verdade do contrato.
 */

import type { MatchedField } from './matching.js';

// ============================================================
//  ENUMS COMO STRING LITERALS (mantém paridade com Prisma)
// ============================================================

export type RoomMode = 'CLASSIC';
// Sprint 2+ adicionará 'BLIND_TEST' | 'WHO_SANG' | 'PLAYLIST_WARS' | 'COVER_REVEAL' | 'CHAOS'

export type RoomStatus = 'LOBBY' | 'PLAYING' | 'ENDED' | 'CLOSED';

export type GuessResult = 'CORRECT' | 'WRONG' | 'RATE_LIMITED';
// Sprint 2+ adicionará 'CLOSE' quando Levenshtein entrar

export type ErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ROOM_ENDED'
  | 'NOT_HOST'
  | 'INVALID_STATE'
  | 'NICKNAME_INVALID'
  | 'GUESS_RATE_LIMITED'
  | 'UNAUTHORIZED';

// ============================================================
//  TIPOS AUXILIARES (snapshots, payloads compartilhados)
// ============================================================

export type RoomSettings = {
  totalRounds: number;
  roundDurationSeconds: number;
  trackSource: TrackSource;
};

/**
 * Fonte de tracks de uma partida. Sprint 1 só tem `genre_decade`.
 * Sprint 2 adicionará variants `curated` (pool curado) e `playlist` (URL Deezer).
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

export type FirstAnswerer = {
  userId: string;
  field: MatchedField;
  responseTime: number;
};

// ============================================================
//  PAYLOADS DE EVENTOS (entrada e saída tipadas, exportáveis)
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

export type RoomJoinAck =
  | { ok: true }
  | { ok: false; error: ErrorCode; message: string };

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

export type GameCountdownEvent = { secondsLeft: number };

export type GameRoundStartedEvent = {
  roundIndex: number; // 1..totalRounds
  totalRounds: number;
  durationSeconds: number;
  previewUrl: string;
};

export type GameGuessResultEvent = {
  userId: string;
  result: GuessResult;
  score: number; // pontos ganhos com este guess (0 se WRONG/RATE_LIMITED)
  matchedField: MatchedField | null;
};

export type GameRoundRevealEvent = {
  track: TrackReveal;
  scores: ScoreDelta[];
  firstAnswerers: FirstAnswerer[];
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
  'game:countdown': (payload: GameCountdownEvent) => void;
  'game:round:started': (payload: GameRoundStartedEvent) => void;
  'game:guess:result': (payload: GameGuessResultEvent) => void;
  'game:round:reveal': (payload: GameRoundRevealEvent) => void;
  'game:ended': (payload: GameEndedEvent) => void;
  error: (payload: ErrorEvent) => void;
}
