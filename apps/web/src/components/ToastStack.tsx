'use client';

import { useEffect } from 'react';
import { useToast, type Toast, type ToastVariant } from '@/stores/toast';

/**
 * Stack de toasts no canto superior direito. Renderiza tudo que está no
 * `useToast` store. Cada toast auto-dismiss após seu `ttlMs`.
 *
 * Estilo neobrutalist alinhado ao design system: card com borda 3px,
 * sombra hard 4/4/0/0, fonte display + mono pra números. Cores semânticas
 * via tokens.
 */
export function ToastStack(): React.ReactElement {
  const toasts = useToast((s) => s.toasts);

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function bgFor(variant: ToastVariant): string {
  switch (variant) {
    case 'success':
      return 'var(--success)';
    case 'warm':
      return 'var(--warm)';
    case 'danger':
      return 'var(--danger)';
    default:
      return 'var(--info)';
  }
}

function textColorFor(variant: ToastVariant): string {
  return variant === 'danger' ? '#fff' : 'var(--ink)';
}

function ToastItem({ toast }: { toast: Toast }): React.ReactElement {
  const dismiss = useToast((s) => s.dismiss);

  useEffect(() => {
    const id = setTimeout(() => dismiss(toast.id), toast.ttlMs);
    return () => clearTimeout(id);
  }, [toast.id, toast.ttlMs, dismiss]);

  return (
    <div
      style={{
        background: bgFor(toast.variant),
        color: textColorFor(toast.variant),
        border: '3px solid var(--ink)',
        borderRadius: 12,
        boxShadow: '4px 4px 0 0 var(--shadow-color)',
        padding: '10px 16px',
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: 16,
        textTransform: 'lowercase',
        animation: 'sm-toast-in 0.18s ease-out',
        pointerEvents: 'auto',
        maxWidth: 320,
      }}
    >
      {toast.text}
      <style>{`
        @keyframes sm-toast-in {
          from { transform: translateX(20px) rotate(1deg); opacity: 0; }
          to   { transform: translateX(0) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
