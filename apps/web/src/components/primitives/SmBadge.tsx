import type { CSSProperties, ReactNode } from 'react';

/**
 * SOMS — badge neobrutalist. Anatomia em design-system/styles.css:
 *   .sm-badge          — base: borda 2px ink, raio 999 (pill), sombra 2/2/0/0,
 *                        font-display 11px uppercase tracking 0.04em
 *   .sm-badge--host    — bg special (roxo), texto branco (host indicator)
 *   .sm-badge--special — bg primary (amarelo), texto ink
 *   .sm-badge--info    — bg info (cyan), texto ink
 *   .sm-badge--warm    — bg warm (laranja), texto ink
 *
 * **Re-escopo de ink em dark mode**: tokens.css define rules pra cada variant
 * forçando `--ink: #0A0A0A` (preto) em badges com bg "claro" e `--ink: #fff`
 * em badges com bg "escuro" — funciona mesmo em dark mode porque os seletores
 * fixam o ink no container. Ver tokens.css §INK SCOPE RULES + linhas 276-279
 * dos `.sm-badge--*` específicos. NÃO inventar variant nova sem adicionar a
 * regra de re-escopo correspondente.
 */
export type SmBadgeVariant = 'host' | 'special' | 'info' | 'warm' | 'default';

export type SmBadgeProps = {
  variant?: SmBadgeVariant;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export function SmBadge({
  variant = 'default',
  className,
  style,
  children,
}: SmBadgeProps): React.ReactElement {
  const cls = [
    'sm-badge',
    variant !== 'default' && `sm-badge--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={cls} style={style}>
      {children}
    </span>
  );
}
