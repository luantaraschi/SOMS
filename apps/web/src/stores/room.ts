import type {
  PlayerSnapshot,
  RoomSnapshot,
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
  setSnapshot: (s: RoomSnapshot) => void;
  updateStatus: (status: RoomStatus) => void;
  upsertPlayer: (p: PlayerSnapshot) => void;
  removePlayer: (userId: string) => void;
  setHost: (userId: string) => void;
  clear: () => void;
};

export const useRoom = create<RoomState>((set) => ({
  snapshot: null,

  setSnapshot: (snapshot) => {
    set({ snapshot });
  },

  updateStatus: (status) => {
    set((s) => (s.snapshot ? { snapshot: { ...s.snapshot, status } } : s));
  },

  upsertPlayer: (p) => {
    set((s) => {
      if (!s.snapshot) return s;
      const others = s.snapshot.players.filter((x) => x.userId !== p.userId);
      return { snapshot: { ...s.snapshot, players: [...others, p] } };
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

  setHost: (userId) => {
    set((s) => {
      if (!s.snapshot) return s;
      return {
        snapshot: {
          ...s.snapshot,
          hostUserId: userId,
          players: s.snapshot.players.map((p) => ({
            ...p,
            isHost: p.userId === userId,
          })),
        },
      };
    });
  },

  clear: () => {
    set({ snapshot: null });
  },
}));
