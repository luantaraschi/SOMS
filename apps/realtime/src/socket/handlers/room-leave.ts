import { roomChannel } from '../broadcaster.js';
import type { TypedSocket } from '../types.js';
import type { HandlerContext } from './types.js';

export function registerRoomLeaveHandler(
  socket: TypedSocket,
  ctx: HandlerContext,
): void {
  socket.on('room:leave', (ack) => {
    const code = socket.data.currentRoomCode;
    if (code === null) {
      ack({ ok: false });
      return;
    }

    void socket.leave(roomChannel(code));
    socket.data.currentRoomCode = null;
    const result = ctx.manager.leaveRoom(code, socket.data.userId);
    ack({ ok: result.ok });
  });
}
