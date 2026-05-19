import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * SOMS — botão neobrutalist. Anatomia em packages/design-system/ui_kits/web_app/styles.css:
 *   .sm-btn (base)            — borda 3px ink, sombra hard 6/6/0/0, hover empurra +3,+3, active afunda +6,+6
 *   .sm-btn--primary          — bg primary (amarelo), texto ink
 *   .sm-btn--secondary        — bg secondary (rosa), texto branco
 *   .sm-btn--success          — bg success (lima), texto ink
 *   .sm-btn--danger           — bg danger (vermelho), texto branco
 *   .sm-btn--ghost            — sem bg/sombra, hover sublinha
 *   .sm-btn--lg               — padding 18/28 + min-height 60 + sombra 8/8
 *   .sm-btn--block            — width 100%
 *
 * Copy obrigatoriamente UPPERCASE em CTAs (regra da voz). Children são
 * renderizados como-é — o text-transform: uppercase do CSS resolve.
 */
export type SmButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'ghost'
  | 'default';

export type SmButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className'
> & {
  variant?: SmButtonVariant;
  size?: 'md' | 'lg';
  block?: boolean;
  children: ReactNode;
};

export function SmButton({
  variant = 'default',
  size,
  block,
  children,
  type = 'button',
  ...rest
}: SmButtonProps): React.ReactElement {
  const cls = [
    'sm-btn',
    variant !== 'default' && `sm-btn--${variant}`,
    size === 'lg' && 'sm-btn--lg',
    block && 'sm-btn--block',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={cls} type={type} {...rest}>
      {children}
    </button>
  );
}
