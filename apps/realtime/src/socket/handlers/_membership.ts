import type { RoomManager } from '../../rooms/room-manager.js';
import { roomChannel } from '../broadcaster.js';
import type { TypedSocket } from '../types.js';

/**
 * Garante que o socket esteja "livre" pra iniciar uma nova ação de
 * room:create / room:join.
 *
 * Aplica:
 *  1. Tree de 4 casos sobre `socket.data.currentRoomCode` (stale code):
 *     - sala fantasma (não existe mais) → limpa, prossegue
 *     - sala existe mas userId não está nela → limpa, prossegue
 *     - sala existe com userId único + host → leaveRoom, prossegue
 *       (provável bug de ack perdido — usuário recria a "sua" sala)
 *     - sala existe com outros players → BLOQUEIA (legítimo: 2ª aba)
 *  2. Scan global pra capturar caso de "nova aba sem stale" (socket fresh
 *     cujo `userId` já é player em alguma outra sala).
 *
 * Retorna 'ok' se chamador pode prosseguir, 'blocked' se chamador deve ack
 * com PLAYER_ALREADY_IN_ROOM e retornar.
 */
export function ensureNotInAnotherRoom(
  socket: TypedSocket,
  manager: RoomManager,
): 'ok' | 'blocked' {
  const userId = socket.data.userId;
  const stale = socket.data.currentRoomCode;

  if (stale !== null) {
    const room = manager.getRoom(stale);

    if (!room) {
      // Caso 1: sala fantasma
      socket.data.currentRoomCode = null;
    } else if (!room.players.has(userId)) {
      // Caso 2: userId não está mais na sala (removido por tick após grace)
      socket.data.currentRoomCode = null;
      void socket.leave(roomChannel(stale));
    } else if (room.players.size === 1 && room.hostUserId === userId) {
      // Caso 3: sala solitária do próprio user — provável ack perdido,
      //          desfaz pra recriar/entrar em nova
      manager.leaveRoom(stale, userId);
      socket.data.currentRoomCode = null;
      void socket.leave(roomChannel(stale));
    } else {
      // Caso 4: legítimo — userId em sala com outros players
      return 'blocked';
    }
  }

  // Pass extra: nova aba sem stale, mas userId aparece em alguma outra sala
  for (const r of manager.getAllRooms()) {
    if (r.players.has(userId)) return 'blocked';
  }

  return 'ok';
}
