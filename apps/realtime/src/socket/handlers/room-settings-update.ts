import { roomChannel } from '../broadcaster.js';
import { mapRoomErrorToServerError } from '../error-mapping.js';
import type { TypedSocket } from '../types.js';
import type { HandlerContext } from './types.js';

export function registerRoomSettingsUpdateHandler(
  socket: TypedSocket,
  ctx: HandlerContext,
): void {
  socket.on('room:settings:update', (payload, ack) => {
    const code = socket.data.currentRoomCode;
    if (code === null) {
      ack({
        ok: false,
        error: { code: 'NOT_IN_ROOM', message: 'você não está em uma sala.' },
      });
      return;
    }

    const result = ctx.manager.updateSettings(code, socket.data.userId, payload.settings);
    if (!result.ok) {
      ack({ ok: false, error: mapRoomErrorToServerError(result.error) });
      return;
    }

    // Broadcast manual — RoomManager não emite callback de settings.
    socket.to(roomChannel(code)).emit('room:settings:updated', {
      settings: result.room.settings,
    });
    ack({ ok: true });
  });
}
