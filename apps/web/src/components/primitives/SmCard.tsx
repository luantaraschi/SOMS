import type { CSSProperties, ReactNode } from 'react';

/**
 * SOMS — card neobrutalist. Anatomia em design-system/styles.css:
 *   .sm-card        — borda 3px ink, raio 16, sombra 6/6/0/0, padding 24
 *   .sm-card--hero  — borda 4px, raio 24, sombra 12/12/0/0, padding 32
 *
 * **Imperfeição calculada** (DESIGN.md §1.5): cards rotacionam -1.5° ou +1.5°
 * alternando por index. Use a prop `tilt` (`'l' | 'r' | 'll' | 'rr'`) que mapeia
 * pras helper classes `.sm-tilt-*`. Default = sem rotação (use só onde fizer
 * sentido cosmético — não em forms).
 */
export type SmCardTilt = 'l' | 'r' | 'll' | 'rr';

export type SmCardProps = {
  hero?: boolean;
  tilt?: SmCardTilt;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export function SmCard({
  hero,
  tilt,
  className,
  style,
  children,
}: SmCardProps): React.ReactElement {
  const cls = [
    'sm-card',
    hero && 'sm-card--hero',
    tilt && `sm-tilt-${tilt}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}
