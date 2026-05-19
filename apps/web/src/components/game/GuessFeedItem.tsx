import type { FeedEntry } from '@/stores/game';

/**
 * Item do feed de respostas. Replicado de GameScreen.jsx (70-93):
 *   - tilt alterna -0.6° / +0.6° por index
 *   - bg success se hit, warm se too_late, surface se miss
 *   - "+pts" verde (hit) | "tarde demais" (too_late) | "errou" (miss em cinza)
 *
 * Para hit, a cor verde é forte demais quando muitos seguidos chegam. Por
 * agora, só os hits em verde mesmo — ajuste é polimento posterior.
 */
export type GuessFeedItemProps = {
  entry: FeedEntry;
  index: number;
};

function pointsFor(slotKind?: string): number | null {
  if (slotKind === 'title') return 100;
  if (slotKind === 'artist') return 60;
  if (slotKind === 'feat') return 40;
  return null;
}

export function GuessFeedItem({
  entry,
  index,
}: GuessFeedItemProps): React.ReactElement {
  const tilt = index % 2 === 0 ? -0.6 : 0.6;
  const bg =
    entry.outcome === 'hit'
      ? 'var(--success)'
      : entry.outcome === 'too_late'
        ? 'var(--warm)'
        : 'var(--surface)';

  // points: cálculo aproximado pro display. O server-authoritative score
  // está em scores Map (chega só no reveal). Aqui só é cosmético.
  const approxPoints = pointsFor(entry.slotKind);

  let rightText: React.ReactNode;
  if (entry.outcome === 'hit') {
    rightText = approxPoints !== null ? `+${approxPoints}` : '+';
  } else if (entry.outcome === 'too_late') {
    rightText = 'tarde demais';
  } else {
    rightText = 'errou';
  }

  return (
    <div
      style={{
        transform: `rotate(${tilt}deg)`,
        background: bg,
        border: '3px solid var(--ink)',
        borderRadius: 12,
        boxShadow: '4px 4px 0 0 var(--shadow-color)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontFamily: 'var(--font-body)',
        fontSize: 14,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          textTransform: 'lowercase',
        }}
      >
        {entry.nickname}:
      </span>
      <span style={{ flex: 1 }}>{entry.text}</span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: 13,
          color:
            entry.outcome === 'miss'
              ? 'var(--ink-soft)'
              : 'var(--ink)',
        }}
      >
        {rightText}
      </span>
    </div>
  );
}
