import { DISCONNECT_GRACE_MS } from '@soms/shared';
import type { Logger } from 'pino';
import { generateUniqueRoomCode } from './code-generator.js';
import { validateNickname } from './nickname.js';
import type {
  CreateRoomInput,
  JoinRoomInput,
  Player,
  Room,
  RoomError,
  RoomManagerEvents,
  RoomStatus,
} from './types.js';

const HOST_TRANSITIONS: ReadonlySet<string> = new Set(['lobby->countdown', 'ended->lobby']);
const SYSTEM_TRANSITIONS: ReadonlySet<string> = new Set([
  'countdown->playing',
  'playing->reveal',
  'reveal->countdown',
  'reveal->ended',
]);


type Ok<T> = { ok: true } & T;
type Err = { ok: false; error: RoomError };

export class RoomManager {
  static readonly MAX_PLAYERS_PER_ROOM = 20;
  static readonly ABANDONED_DESTROY_MS = 30_000;

  private readonly logger: Logger;
  private readonly events: RoomManagerEvents;
  private readonly rooms: Map<string, Room> = new Map();

  constructor(opts: { logger: Logger; events?: RoomManagerEvents }) {
    this.logger = opts.logger;
    this.events = opts.events ?? {};
  }

  createRoom(input: CreateRoomInput): Ok<{ room: Room }> | Err {
    const nicknameError = validateNickname(input.hostNickname);
    if (nicknameError !== null) return { ok: false, error: nicknameError };

    const code = generateUniqueRoomCode(new Set(this.rooms.keys()));
    const now = Date.now();
    const trimmedNickname = input.hostNickname.trim();

    const host: Player = {
      userId: input.hostUserId,
      nickname: trimmedNickname,
      joinedAt: now,
      isHost: true,
      isConnected: true,
    };

    const players = new Map<string, Player>();
    players.set(input.hostUserId, host);

    const room: Room = {
      code,
      status: 'lobby',
      hostUserId: input.hostUserId,
      players,
      settings: input.settings,
      createdAt: now,
    };

    this.rooms.set(code, room);
    this.logger.info({ code, hostUserId: input.hostUserId }, 'room created');
    this.events.onRoomCreated?.(room);
    return { ok: true, room };
  }

  getRoom(code: string): Room | null {
    return this.rooms.get(code) ?? null;
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  joinRoom(input: JoinRoomInput): Ok<{ room: Room; player: Player }> | Err {
    const room = this.rooms.get(input.code);
    if (!room) return { ok: false, error: { code: 'ROOM_NOT_FOUND' } };

    if (room.status === 'ended') return { ok: false, error: { code: 'ROOM_ENDED' } };
    if (room.status === 'abandoned') return { ok: false, error: { code: 'ROOM_NOT_FOUND' } };
    if (room.status !== 'lobby') return { ok: false, error: { code: 'ROOM_IN_PROGRESS' } };

    if (room.players.has(input.userId)) {
      return { ok: false, error: { code: 'PLAYER_ALREADY_IN_ROOM' } };
    }

    if (room.players.size >= RoomManager.MAX_PLAYERS_PER_ROOM) {
      return {
        ok: false,
        error: { code: 'ROOM_FULL', max: RoomManager.MAX_PLAYERS_PER_ROOM },
      };
    }

    const nicknameError = validateNickname(input.nickname);
    if (nicknameError !== null) return { ok: false, error: nicknameError };

    const trimmedNickname = input.nickname.trim();
    const normalized = trimmedNickname.toLowerCase();
    for (const existing of room.players.values()) {
      if (existing.nickname.toLowerCase() === normalized) {
        return { ok: false, error: { code: 'NICKNAME_TAKEN', nickname: trimmedNickname } };
      }
    }

    const player: Player = {
      userId: input.userId,
      nickname: trimmedNickname,
      joinedAt: Date.now(),
      isHost: false,
      isConnected: true,
    };

    room.players.set(input.userId, player);
    this.logger.info({ code: input.code, userId: input.userId }, 'player joined');
    this.events.onPlayerJoined?.(room, player);
    return { ok: true, room, player };
  }

  leaveRoom(code: string, userId: string): Ok<{ room: Room | null }> | Err {
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: { code: 'ROOM_NOT_FOUND' } };

    const player = room.players.get(userId);
    if (!player) return { ok: false, error: { code: 'PLAYER_NOT_IN_ROOM' } };

    const wasHost = player.isHost;
    room.players.delete(userId);
    this.logger.info({ code, userId, wasHost }, 'player left');
    this.events.onPlayerLeft?.(room, player, 'leave');

    if (wasHost && room.players.size > 0) {
      this.fallbackHost(room, userId);
    }

    if (room.players.size === 0) {
      if (room.status === 'ended') {
        this.rooms.delete(code);
        this.events.onRoomDestroyed?.(code);
        return { ok: true, room: null };
      }
      this.markAbandoned(room, Date.now());
    }

    return { ok: true, room };
  }

  kickPlayer(
    code: string,
    hostUserId: string,
    targetUserId: string,
  ): Ok<{ room: Room }> | Err {
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: { code: 'ROOM_NOT_FOUND' } };
    if (room.hostUserId !== hostUserId) return { ok: false, error: { code: 'NOT_HOST' } };
    if (hostUserId === targetUserId) return { ok: false, error: { code: 'CANNOT_KICK_SELF' } };

    const target = room.players.get(targetUserId);
    if (!target) return { ok: false, error: { code: 'PLAYER_NOT_IN_ROOM' } };

    room.players.delete(targetUserId);
    this.logger.info({ code, hostUserId, targetUserId }, 'player kicked');
    this.events.onPlayerLeft?.(room, target, 'kick');
    return { ok: true, room };
  }

  updateSettings(
    code: string,
    hostUserId: string,
    patch: Partial<import('@soms/shared').RoomSettings>,
  ): Ok<{ room: Room }> | Err {
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: { code: 'ROOM_NOT_FOUND' } };
    if (room.status !== 'lobby') return { ok: false, error: { code: 'ROOM_IN_PROGRESS' } };
    if (room.hostUserId !== hostUserId) return { ok: false, error: { code: 'NOT_HOST' } };

    if (patch.totalRounds !== undefined) room.settings.totalRounds = patch.totalRounds;
    if (patch.roundDurationSeconds !== undefined) {
      room.settings.roundDurationSeconds = patch.roundDurationSeconds;
    }
    if (patch.trackSource !== undefined) {
      room.settings.trackSource = {
        ...room.settings.trackSource,
        ...patch.trackSource,
      };
    }
    this.logger.info({ code, patch }, 'settings updated');
    return { ok: true, room };
  }

  transferHost(
    code: string,
    currentHostUserId: string,
    newHostUserId: string,
  ): Ok<{ room: Room }> | Err {
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: { code: 'ROOM_NOT_FOUND' } };

    if (room.status !== 'lobby') {
      return {
        ok: false,
        error: { code: 'HOST_TRANSFER_NOT_ALLOWED', reason: 'only in lobby' },
      };
    }
    if (room.hostUserId !== currentHostUserId) {
      return { ok: false, error: { code: 'NOT_HOST' } };
    }
    if (currentHostUserId === newHostUserId) {
      return { ok: false, error: { code: 'CANNOT_TRANSFER_TO_SELF' } };
    }

    const newHost = room.players.get(newHostUserId);
    if (!newHost) return { ok: false, error: { code: 'PLAYER_NOT_IN_ROOM' } };

    const oldHost = room.players.get(currentHostUserId);
    if (oldHost) oldHost.isHost = false;
    newHost.isHost = true;
    room.hostUserId = newHostUserId;

    this.logger.info({ code, from: currentHostUserId, to: newHostUserId }, 'host transferred');
    this.events.onHostChanged?.(room, currentHostUserId, newHostUserId, 'manual');
    return { ok: true, room };
  }

  markPlayerDisconnected(code: string, userId: string, now: number): void {
    const room = this.rooms.get(code);
    if (!room) return;
    const player = room.players.get(userId);
    if (!player) return;
    if (!player.isConnected) return;

    player.isConnected = false;
    player.disconnectedAt = now;
    this.logger.info({ code, userId, at: now }, 'player disconnected');
    this.events.onPlayerDisconnected?.(room, player);
  }

  markPlayerReconnected(
    code: string,
    userId: string,
    _now: number,
  ): Ok<{ room: Room; player: Player }> | Err {
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: { code: 'ROOM_NOT_FOUND' } };
    const player = room.players.get(userId);
    if (!player) return { ok: false, error: { code: 'PLAYER_NOT_IN_ROOM' } };

    player.isConnected = true;
    player.disconnectedAt = undefined;
    this.logger.info({ code, userId }, 'player reconnected');
    this.events.onPlayerReconnected?.(room, player);
    return { ok: true, room, player };
  }

  transitionTo(
    code: string,
    requesterUserId: string,
    newStatus: RoomStatus,
  ): Ok<{ room: Room }> | Err {
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: { code: 'ROOM_NOT_FOUND' } };

    if (!HOST_TRANSITIONS.has(`${room.status}->${newStatus}`)) {
      return {
        ok: false,
        error: { code: 'INVALID_STATUS_TRANSITION', from: room.status, to: newStatus },
      };
    }

    if (room.hostUserId !== requesterUserId) {
      return { ok: false, error: { code: 'NOT_HOST' } };
    }

    this.applyTransition(room, newStatus);
    return { ok: true, room };
  }

  systemTransition(code: string, newStatus: RoomStatus): Ok<{ room: Room }> | Err {
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: { code: 'ROOM_NOT_FOUND' } };

    if (!SYSTEM_TRANSITIONS.has(`${room.status}->${newStatus}`)) {
      return {
        ok: false,
        error: { code: 'INVALID_STATUS_TRANSITION', from: room.status, to: newStatus },
      };
    }

    this.applyTransition(room, newStatus);
    return { ok: true, room };
  }

  tick(now: number): void {
    const codesToDestroy: string[] = [];

    for (const room of this.rooms.values()) {
      const toRemove: string[] = [];
      for (const [userId, player] of room.players) {
        if (
          !player.isConnected &&
          player.disconnectedAt !== undefined &&
          now - player.disconnectedAt >= DISCONNECT_GRACE_MS
        ) {
          toRemove.push(userId);
        }
      }

      for (const userId of toRemove) {
        const player = room.players.get(userId);
        if (!player) continue;
        const wasHost = player.isHost;
        room.players.delete(userId);
        this.events.onPlayerLeft?.(room, player, 'disconnect_timeout');
        if (wasHost && room.players.size > 0) {
          this.fallbackHost(room, userId);
        }
      }

      if (room.players.size === 0 && room.status !== 'abandoned') {
        this.markAbandoned(room, now);
      }

      if (
        room.status === 'abandoned' &&
        room.abandonedAt !== undefined &&
        now - room.abandonedAt >= RoomManager.ABANDONED_DESTROY_MS
      ) {
        codesToDestroy.push(room.code);
      }
    }

    for (const code of codesToDestroy) {
      this.rooms.delete(code);
      this.events.onRoomDestroyed?.(code);
    }
  }

  private fallbackHost(room: Room, oldHostUserId: string): void {
    let next: Player | null = null;
    for (const player of room.players.values()) {
      if (next === null || player.joinedAt < next.joinedAt) {
        next = player;
      }
    }
    if (next === null) return;

    next.isHost = true;
    room.hostUserId = next.userId;
    this.logger.info(
      { code: room.code, from: oldHostUserId, to: next.userId },
      'host fallback',
    );
    this.events.onHostChanged?.(room, oldHostUserId, next.userId, 'fallback');
  }

  private markAbandoned(room: Room, now: number): void {
    const from = room.status;
    room.status = 'abandoned';
    room.abandonedAt = now;
    this.logger.info({ code: room.code, from }, 'room abandoned');
    this.events.onStatusChanged?.(room, from, 'abandoned');
    this.events.onRoomAbandoned?.(room);
  }

  private applyTransition(room: Room, newStatus: RoomStatus): void {
    const from = room.status;
    room.status = newStatus;
    this.logger.info({ code: room.code, from, to: newStatus }, 'status transition');
    this.events.onStatusChanged?.(room, from, newStatus);
  }
}

