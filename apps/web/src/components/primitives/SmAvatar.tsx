import type { CSSProperties } from 'react';

/**
 * SOMS — avatar com inicial. Anatomia em design-system/styles.css:
 *   .sm-avatar        — 44x44, borda 3px ink, raio 12, Unbounded 900 22px,
 *                       bg default = primary (amarelo)
 *   .sm-avatar--lg    — 64x64, raio 16, 30px
 *
 * Cor do bg passada por prop (qualquer var CSS — ex: `var(--secondary)`),
 * e textColor por contraste. Para hosts, use `bgColor='var(--special)'` +
 * `textColor='#fff'`, ou prefira o badge .sm-badge--host ao lado da inicial.
 */
export type SmAvatarProps = {
  initial: string;
  bgColor?: string;
  textColor?: string;
  size?: 'md' | 'lg';
  style?: CSSProperties;
};

export function SmAvatar({
  initial,
  bgColor = 'var(--primary)',
  textColor = 'var(--ink)',
  size,
  style,
}: SmAvatarProps): React.ReactElement {
  const cls = ['sm-avatar', size === 'lg' && 'sm-avatar--lg']
    .filter(Boolean)
    .join(' ');
  return (
    <div
      className={cls}
      style={{ background: bgColor, color: textColor, ...style }}
    >
      {initial.slice(0, 1).toUpperCase()}
    </div>
  );
}
