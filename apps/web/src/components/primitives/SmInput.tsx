import type { InputHTMLAttributes } from 'react';

/**
 * SOMS — input neobrutalist. Anatomia em design-system/styles.css:
 *   .sm-input         — borda 3px ink, sombra hard 4/4/0/0, focus afunda +3,+3
 *   .sm-input--mono   — JetBrains Mono uppercase tracking 0.06em center 22px
 *                       (usado pra room code e timer).
 *
 * Use `<SmLabel>` ao lado se precisar de label visível (`.sm-label`
 * é text-transform: uppercase + tracking 0.18em).
 */
export type SmInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className'
> & {
  mono?: boolean;
};

export function SmInput({
  mono,
  type = 'text',
  ...rest
}: SmInputProps): React.ReactElement {
  const cls = ['sm-input', mono && 'sm-input--mono'].filter(Boolean).join(' ');
  return <input className={cls} type={type} {...rest} />;
}

export function SmLabel({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <span className="sm-label">{children}</span>;
}
