/**
 * Waveform decorativa. NÃO usa o audio real — só dá vida à tela.
 * Anatomia: card cyan, tilt -0.6°, ícone play/pause à esquerda, 32 barras
 * com animação de scaleY oscilando. Quando `playing=false`, barras paradas
 * no estado base.
 *
 * Replicado de packages/design-system/ui_kits/web_app/GameScreen.jsx (32-67),
 * com lucide-react no lugar do `<Icon>` do kit.
 */
import { Pause, Play } from 'lucide-react';

const BARS = Array.from({ length: 32 }, (_, i) => i);

export function Waveform({
  playing = true,
}: {
  playing?: boolean;
}): React.ReactElement {
  return (
    <>
      <div
        style={{
          background: 'var(--info)',
          border: '4px solid var(--ink)',
          borderRadius: 24,
          boxShadow: '12px 12px 0 0 var(--shadow-color)',
          padding: '32px 28px',
          transform: 'rotate(-0.6deg)',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            background: 'var(--ink)',
            color: 'var(--bg)',
            border: '3px solid var(--ink)',
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          {playing ? (
            <Pause size={28} strokeWidth={3} />
          ) : (
            <Play size={28} strokeWidth={3} />
          )}
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            height: 80,
          }}
        >
          {BARS.map((b) => {
            const h = 20 + Math.abs(Math.sin((b + 1) * 0.7)) * 60;
            return (
              <div
                key={b}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  background: 'var(--ink)',
                  borderRadius: 2,
                  animation: playing
                    ? `wave-${b % 4} 0.${4 + (b % 4)}s ease-in-out infinite alternate`
                    : 'none',
                }}
              />
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes wave-0 { from { transform: scaleY(0.4); } to { transform: scaleY(1.0); } }
        @keyframes wave-1 { from { transform: scaleY(0.7); } to { transform: scaleY(0.3); } }
        @keyframes wave-2 { from { transform: scaleY(0.5); } to { transform: scaleY(0.9); } }
        @keyframes wave-3 { from { transform: scaleY(0.3); } to { transform: scaleY(0.8); } }
      `}</style>
    </>
  );
}
