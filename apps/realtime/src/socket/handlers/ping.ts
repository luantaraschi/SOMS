import type { TypedSocket } from '../types.js';

export function registerPingHandler(socket: TypedSocket): void {
  socket.on('ping', (ack) => {
    ack({ serverTime: Date.now() });
  });
}
