'use client';

import { Icon, SmCard } from '@/components/primitives';

export function EmptyState({
  title = 'só você por aqui',
  body = 'manda o link da sala pros amigos e segura a ansiedade.',
}: {
  title?: string;
  body?: string;
}): React.ReactElement {
  return (
    <SmCard tilt="r" className="max-w-lg mx-auto">
      <div className="flex items-start gap-3">
        <Icon name="music" className="mt-1" />
        <div>
          <p className="t-h3">{title}</p>
          <p className="t-body mt-1" style={{ color: 'var(--ink-soft)' }}>
            {body}
          </p>
        </div>
      </div>
    </SmCard>
  );
}
