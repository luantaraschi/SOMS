import type {
  PlayerSnapshot,
  RoomSnapshot,
  RoomSettings,
  RoomStatus,
} from '@soms/shared';
import { create } from 'zustand';

/**
 * Estado da sala atual — NÃO persistido (zera quando recarrega).
 *
 * `snapshot` é hidratado pelo ack de room:create / room:join ou pelo evento
 * room:snapshot (reconexão). Os updaters são granulares pra evitar substituir
 * o snapshot inteiro a cada player join/left.
 */
type RoomState = {
  snapshot: RoomSnapshot | null;
  connectionStatus: ConnectionStatus;
  setSnapshot: (s: RoomSnapshot) => void;
  setConnectionStatus: (s: ConnectionStatus) => void;
  updateStatus: (status: RoomStatus) => void;
  updateSettings: (settings: RoomSettings) => void;
  upsertPlayer: (p: PlayerSnapshot) => void;
  removePlayer: (userId: string) => void;
  markPlayerDisconnected: (userId: string) => void;
  markPlayerReconnected: (userId: string) => void;
  changeHost: (newHostUserId: string) => void;
  clear: () => void;
};

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export const useRoom = create<RoomState>((set) => ({
  snapshot: null,
  connectionStatus: 'idle',

  setSnapshot: (snapshot) => {
    set({ snapshot });
  },

  setConnectionStatus: (connectionStatus) => {
    set({ connectionStatus });
  },

  updateStatus: (status) => {
    set((s) => (s.snapshot ? { snapshot: { ...s.snapshot, status } } : s));
  },

  updateSettings: (settings) => {
    set((s) => (s.snapshot ? { snapshot: { ...s.snapshot, settings } } : s));
  },

  upsertPlayer: (p) => {
    set((s) => {
      if (!s.snapshot) return s;
      const existingIndex = s.snapshot.players.findIndex((x) => x.userId === p.userId);
      if (existingIndex < 0) {
        return { snapshot: { ...s.snapshot, players: [...s.snapshot.players, p] } };
      }

      const players = [...s.snapshot.players];
      players[existingIndex] = p;
      return { snapshot: { ...s.snapshot, players } };
    });
  },

  removePlayer: (userId) => {
    set((s) => {
      if (!s.snapshot) return s;
      return {
        snapshot: {
          ...s.snapshot,
          players: s.snapshot.players.filter((p) => p.userId !== userId),
        },
      };
    });
  },

  markPlayerDisconnected: (userId) => {
    set((s) => {
      if (!s.snapshot) return s;
      return {
        snapshot: {
          ...s.snapshot,
          players: s.snapshot.players.map((p) =>
            p.userId === userId ? { ...p, isConnected: false } : p,
          ),
        },
      };
    });
  },

  markPlayerReconnected: (userId) => {
    set((s) => {
      if (!s.snapshot) return s;
      return {
        snapshot: {
          ...s.snapshot,
          players: s.snapshot.players.map((p) =>
            p.userId === userId ? { ...p, isConnected: true } : p,
          ),
        },
      };
    });
  },

  changeHost: (newHostUserId) => {
    set((s) => {
      if (!s.snapshot) return s;
      return {
        snapshot: {
          ...s.snapshot,
          hostUserId: newHostUserId,
          players: s.snapshot.players.map((p) => ({
            ...p,
            isHost: p.userId === newHostUserId,
          })),
        },
      };
    });
  },

  clear: () => {
    set({ snapshot: null, connectionStatus: 'idle' });
  },
}));
