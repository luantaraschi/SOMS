import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Identity persistida em localStorage. `userId` é gerado uma vez (UUID v4) e
 * preservado entre sessões — bate com o regex de validação no handshake do
 * apps/realtime (auth.ts).
 *
 * setIdentity(nickname): se ainda não há userId, gera um novo. Nickname pode
 * ser trocado livremente sem perder identidade.
 */
type IdentityState = {
  userId: string | null;
  nickname: string | null;
  setIdentity: (nickname: string) => void;
  clear: () => void;
};

export const useIdentity = create<IdentityState>()(
  persist(
    (set, get) => ({
      userId: null,
      nickname: null,
      setIdentity: (nickname) => {
        const existing = get().userId;
        set({
          userId: existing ?? crypto.randomUUID(),
          nickname: nickname.trim(),
        });
      },
      clear: () => {
        set({ userId: null, nickname: null });
      },
    }),
    {
      name: 'soms:identity',
      partialize: (state) => ({
        userId: state.userId,
        nickname: state.nickname,
      }),
      // SSR-safe: pula hidratação automática e deixa o cliente disparar
      // explicitamente via `useIdentity.persist.rehydrate()` em layout.tsx.
      // Evita flash de "nickname vazio" no 1º frame quando a Home renderiza
      // antes do localStorage carregar.
      skipHydration: true,
    },
  ),
);
