import { Trophy } from 'lucide-react';
import { SmAvatar, SmBadge } from '@/components/primitives';

/**
 * Coluna do pódio (1º/2º/3º). Replicado de EndScreen.jsx (3-38):
 *   - 1º maior (200px largura, 60px rank, sombra 12/12)
 *   - 2º/3º menor (160px largura, 44px rank, sombra 8/8)
 *   - tilt e cor diferentes por rank
 *   - rank 1 ganha badge "vencedor" com troféu abaixo
 */
export type PodiumColumnProps = {
  rank: 1 | 2 | 3;
  name: string;
  score: number;
  color: string;
  tilt: number;
  textColor?: string;
};

export function PodiumColumn({
  rank,
  name,
  score,
  color,
  tilt,
  textColor = 'var(--ink)',
}: PodiumColumnProps): React.ReactElement {
  const initial = (name[0] ?? '?').toUpperCase();
  return (
    <div className="flex flex-col items-center gap-3">
      <SmAvatar
        initial={initial}
        size="lg"
        bgColor={color}
        textColor={textColor}
      />
      <div
        style={{
          background: color,
          color: textColor,
          border: '4px solid var(--ink)',
          borderRadius: 20,
          boxShadow:
            rank === 1
              ? '12px 12px 0 0 var(--shadow-color)'
              : '8px 8px 0 0 var(--shadow-color)',
          padding: '20px 22px',
          transform: `rotate(${tilt}deg)`,
          width: rank === 1 ? 200 : 160,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: rank === 1 ? 60 : 44,
            lineHeight: 1,
          }}
        >
          {rank}º
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: rank === 1 ? 22 : 18,
            textTransform: 'lowercase',
            margin: '6px 0 2px',
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: rank === 1 ? 28 : 22,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {score.toLocaleString('pt-BR')}
        </div>
      </div>
      {rank === 1 ? (
        <div style={{ marginTop: -4 }}>
          <SmBadge variant="special">
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Trophy size={12} strokeWidth={3} /> vencedor
            </span>
          </SmBadge>
        </div>
      ) : null}
    </div>
  );
}
