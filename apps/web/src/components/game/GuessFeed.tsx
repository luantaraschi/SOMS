'use client';

import { useGame } from '@/stores/game';
import { GuessFeedItem } from './GuessFeedItem';

const VISIBLE_LIMIT = 10;

export function GuessFeed(): React.ReactElement {
  const feed = useGame((s) => s.feed);
  const visible = feed.slice(0, VISIBLE_LIMIT);

  return (
    <div>
      <div className="sm-label" style={{ marginBottom: 10 }}>
        respostas ao vivo
      </div>
      <div className="flex flex-col gap-2.5">
        {visible.length === 0 ? (
          <p
            className="t-caption italic"
            style={{ color: 'var(--ink-soft)' }}
          >
            ainda ninguém arriscou. solta um chute aí.
          </p>
        ) : (
          visible.map((entry, i) => (
            <GuessFeedItem key={entry.id} entry={entry} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
