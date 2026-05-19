import type { RoomSettings } from '@soms/shared';

/**
 * Estados internos da sala no RoomManager.
 *
 * Distinto do `RoomStatus` over-the-wire em `@soms/shared`
 * (que é `'LOBBY' | 'PLAYING' | 'ENDED' | 'CLOSED'`). O mapeamento
 * pra rede acontece na camada de eventos (B3).
 */
export type RoomStatus =
  | 'lobby'
  | 'countdown'
  | 'playing'
  | 'reveal'
  | 'ended'
  | 'abandoned';

export type Player = {
  userId: string;
  nickname: string;
  joinedAt: number;
  isHost: boolean;
  isConnected: boolean;
  disconnectedAt?: number;
};

export type Room = {
  code: string;
  status: RoomStatus;
  hostUserId: string;
  players: Map<string, Player>;
  settings: RoomSettings;
  createdAt: number;
  abandonedAt?: number;
};

export type CreateRoomInput = {
  hostUserId: string;
  hostNickname: string;
  settings: RoomSettings;
};

export type JoinRoomInput = {
  code: string;
  userId: string;
  nickname: string;
};

export type RoomError =
  | { code: 'ROOM_NOT_FOUND' }
  | { code: 'ROOM_FULL'; max: number }
  | { code: 'NICKNAME_TAKEN'; nickname: string }
  | { code: 'NICKNAME_INVALID'; reason: string }
  | { code: 'ROOM_IN_PROGRESS' }
  | { code: 'ROOM_ENDED' }
  | { code: 'NOT_HOST' }
  | { code: 'PLAYER_NOT_IN_ROOM' }
  | { code: 'PLAYER_ALREADY_IN_ROOM' }
  | { code: 'INVALID_STATUS_TRANSITION'; from: RoomStatus; to: RoomStatus }
  | { code: 'HOST_TRANSFER_NOT_ALLOWED'; reason: string }
  | { code: 'CANNOT_KICK_SELF' }
  | { code: 'CANNOT_TRANSFER_TO_SELF' };

export type RoomManagerEvents = {
  onRoomCreated?: (room: Room) => void;
  onPlayerJoined?: (room: Room, player: Player) => void;
  onPlayerLeft?: (
    room: Room,
    player: Player,
    reason: 'leave' | 'disconnect_timeout' | 'kick',
  ) => void;
  onHostChanged?: (
    room: Room,
    oldHostUserId: string,
    newHostUserId: string,
    reason: 'manual' | 'fallback',
  ) => void;
  onStatusChanged?: (room: Room, from: RoomStatus, to: RoomStatus) => void;
  onPlayerReconnected?: (room: Room, player: Player) => void;
  onPlayerDisconnected?: (room: Room, player: Player) => void;
  onRoomAbandoned?: (room: Room) => void;
  onRoomDestroyed?: (code: string) => void;
};
