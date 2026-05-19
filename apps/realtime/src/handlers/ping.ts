import type { Socket } from 'socket.io';

export function registerPingHandler(socket: Socket): void {
  socket.on('ping', () => {
    socket.emit('pong', { serverTime: Date.now() });
  });
}
