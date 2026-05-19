'use client';

import { Icon, type IconName, SmBadge, SmButton, SmCard } from '@/components/primitives';

export type ErrorKind = '404' | 'empty' | 'kicked' | 'down';

export type ErrorScreenProps = {
  kind: ErrorKind;
  onPrimary?: () => void;
  secondaryAction?: { label: string; onClick: () => void } | null;
};

type ScreenConfig = {
  label: string;
  title: string;
  body: string;
  primary: string;
  secondary: string | null;
  badgeVariant: 'warm' | 'info' | 'special';
  primaryVariant: 'primary' | 'secondary' | 'danger' | 'default';
  icon: IconName;
};

const SCREEN_CONFIG: Record<ErrorKind, ScreenConfig> = {
  '404': {
    label: 'erro 404',
    title: 'Essa sala não existe.',
    body: 'ou já encerrou. acontece. cola na próxima.',
    primary: 'Voltar pra home',
    secondary: 'Tentar outro código',
    badgeVariant: 'warm',
    primaryVariant: 'primary',
    icon: 'warning',
  },
  empty: {
    label: 'lobby vazio',
    title: 'Só você por aqui.',
    body: 'manda o código pra galera — sem amigos não tem zoeira.',
    primary: 'Copiar código da sala',
    secondary: 'Compartilhar link',
    badgeVariant: 'info',
    primaryVariant: 'secondary',
    icon: 'music',
  },
  kicked: {
    label: 'você foi removido',
    title: 'O host te chutou.',
    body: 'tenso. respira. tenta outra sala.',
    primary: 'Voltar pra home',
    secondary: null,
    badgeVariant: 'special',
    primaryVariant: 'danger',
    icon: 'kicked',
  },
  down: {
    label: 'algo deu errado',
    title: 'A música parou.',
    body: 'perdemos a conexão com o servidor. tentando de novo...',
    primary: 'Tentar de novo',
    secondary: 'Voltar pra home',
    badgeVariant: 'special',
    primaryVariant: 'primary',
    icon: 'refresh',
  },
};

const ILLO_STACK: Record<ErrorKind, string[]> = {
  '404': ['4', '?', '4'],
  empty: ['♪', '?', ''],
  kicked: ['X', '↗', ''],
  down: ['!', '!', '!'],
};

const CARD_ROTATIONS = ['-4deg', '2deg', '-2deg'] as const;
const CARD_BACKGROUNDS = ['var(--primary)', 'var(--secondary)', 'var(--info)'] as const;
const CARD_TEXT_COLORS = ['var(--ink)', '#fff', 'var(--ink)'] as const;

export function ErrorScreen({
  kind,
  onPrimary,
  secondaryAction = null,
}: ErrorScreenProps): React.ReactElement {
  const config = SCREEN_CONFIG[kind];

  return (
    <main className="paper min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl text-center">
        <ErrorIllustration kind={kind} />

        <div className="mt-8 mb-3">
          <SmBadge variant={config.badgeVariant}>
            <span className="inline-flex items-center gap-1.5">
              <Icon name={config.icon} size={14} strokeWidth={3} />
              {config.label}
            </span>
          </SmBadge>
        </div>

        <h1 className="t-display">{config.title}</h1>
        <p className="t-lg mt-3 mx-auto max-w-xl" style={{ color: 'var(--ink-soft)' }}>
          {config.body}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <SmButton variant={config.primaryVariant} size="lg" onClick={onPrimary}>
            {config.primary}
          </SmButton>
          {resolveSecondaryLabel(config.secondary, secondaryAction) ? (
            <SmButton variant="ghost" onClick={secondaryAction?.onClick}>
              {resolveSecondaryLabel(config.secondary, secondaryAction)}
            </SmButton>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function ErrorIllustration({ kind }: { kind: ErrorKind }): React.ReactElement {
  const stack = ILLO_STACK[kind];
  return (
    <div className="flex justify-center items-center gap-4 sm:gap-5 py-2">
      {stack.map((char, index) =>
        char ? (
          <SmCard
            key={`${kind}-${index}`}
            className="w-[92px] h-[92px] sm:w-[110px] sm:h-[110px] !p-0 flex items-center justify-center"
            style={{
              background: CARD_BACKGROUNDS[index],
              color: CARD_TEXT_COLORS[index],
              borderWidth: '4px',
              borderRadius: '20px',
              boxShadow: 'var(--shadow-lg)',
              transform: `rotate(${CARD_ROTATIONS[index]})`,
            }}
          >
            <span
              className="t-display"
              style={{ lineHeight: 1, fontSize: 'clamp(42px, 6vw, 64px)' }}
            >
              {char}
            </span>
          </SmCard>
        ) : null,
      )}
    </div>
  );
}

function resolveSecondaryLabel(
  fallback: string | null,
  override: { label: string; onClick: () => void } | null,
): string | null {
  if (override) return override.label;
  return fallback;
}
