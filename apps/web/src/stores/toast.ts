import { create } from 'zustand';

/**
 * Toast store global — usado pelo `<ToastStack>` em pontos como PlayingScreen
 * pra dar feedback efêmero de acertos/erros do guess. Sem lib externa.
 *
 * FIFO max 3. Cada toast tem um `id` único (timestamp + counter) pra evitar
 * que duas chamadas no mesmo ms colidam.
 */
export type ToastVariant = 'success' | 'warm' | 'danger' | 'info';

export type Toast = {
  id: string;
  text: string;
  variant: ToastVariant;
  /** ms de exibição até auto-dismiss. */
  ttlMs: number;
};

const MAX = 3;
const DEFAULT_TTL = 2_000;

let counter = 0;

type ToastStore = {
  toasts: Toast[];
  show: (opts: { text: string; variant?: ToastVariant; ttlMs?: number }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  show: ({ text, variant = 'info', ttlMs = DEFAULT_TTL }) => {
    counter += 1;
    const id = `${Date.now()}-${counter}`;
    set((s) => ({
      toasts: [...s.toasts, { id, text, variant, ttlMs }].slice(-MAX),
    }));
    return id;
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));
