import type { PlayerSnapshot, RoomSnapshot } from '@soms/shared';
import type { Player, Room } from '../rooms/types.js';

export function toPlayerSnapshot(player: Player): PlayerSnapshot {
  return {
    userId: player.userId,
    nickname: player.nickname,
    joinedAt: player.joinedAt,
    isHost: player.isHost,
    isConnected: player.isConnected,
  };
}

export function buildRoomSnapshot(room: Room, yourUserId: string): RoomSnapshot {
  return {
    code: room.code,
    status: room.status,
    hostUserId: room.hostUserId,
    players: Array.from(room.players.values()).map(toPlayerSnapshot),
    settings: room.settings,
    yourUserId,
  };
}
