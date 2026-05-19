import type { CSSProperties } from 'react';

/**
 * SOMS — wordmark com tilt e dot rosa "note head".
 *
 * Receita visual replicada de packages/design-system/ui_kits/web_app/
 * HomeScreen.jsx (linhas 11-24). Não existe classe `.sm-brand` em styles.css
 * — o design system só tem o snippet inline lá, então transcrevemos aqui
 * com algumas adaptações:
 *   - typography vem das classes `.t-mega` / `.t-display` já definidas em
 *     tokens.css (responsive clamp em vez de fontSize fixo do snippet)
 *   - dot proporcional ao fontSize via `em` (mantém razão dot/letra constante
 *     entre breakpoints)
 *   - tilt fixo -2° (igual ao snippet)
 *
 * size='lg' (default): `.t-mega` (clamp 64-96px). Use na Home.
 * size='md': `.t-display` (clamp 48-72px). Use no LobbyLoading e em telas
 *            secundárias onde o wordmark aparece mas não é o herói.
 */
export type SmBrandSize = 'lg' | 'md';

export type SmBrandProps = {
  size?: SmBrandSize;
  className?: string;
  style?: CSSProperties;
};

export function SmBrand({
  size = 'lg',
  className,
  style,
}: SmBrandProps): React.ReactElement {
  const sizeClass = size === 'lg' ? 't-mega' : 't-display';
  return (
    <div
      className={['sm-brand', sizeClass, className].filter(Boolean).join(' ')}
      style={{
        display: 'inline-block',
        position: 'relative',
        transform: 'rotate(-2deg)',
        // Tighter que o default das t-* (-0.03 / -0.02) — match com o snippet
        // do kit (-0.04em).
        letterSpacing: '-0.04em',
        ...style,
      }}
    >
      SOMS
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: '0.05em',
          right: '-0.25em',
          width: '0.2em',
          height: '0.2em',
          background: 'var(--secondary)',
          border: '3px solid var(--ink)',
          borderRadius: '999px',
          boxShadow: '3px 3px 0 0 var(--shadow-color)',
        }}
      />
    </div>
  );
}
