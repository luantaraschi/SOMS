/**
 * Timer neobrutalist do round. Anatomia replicada de
 * packages/design-system/ui_kits/web_app/GameScreen.jsx (linhas 3-30):
 *   - bloco amarelo/laranja/vermelho conforme ratio
 *   - barra de progresso à direita, mesma cor
 *   - JetBrains Mono tabular-nums
 *
 * Cor por ratio:
 *   ratio > 0.5  → success (lima)
 *   ratio > 0.25 → warm (laranja)
 *   ≤ 0.25       → danger (vermelho)
 */
export type TimerProps = {
  secondsLeft: number;
  total: number;
};

export function Timer({ secondsLeft, total }: TimerProps): React.ReactElement {
  const ratio = total > 0 ? secondsLeft / total : 0;
  const color =
    ratio > 0.5
      ? 'var(--success)'
      : ratio > 0.25
        ? 'var(--warm)'
        : 'var(--danger)';

  return (
    <div className="flex items-center gap-3.5">
      <div
        style={{
          background: color,
          border: '4px solid var(--ink)',
          borderRadius: 16,
          boxShadow: '6px 6px 0 0 var(--shadow-color)',
          padding: '8px 16px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: 32,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 88,
          textAlign: 'center',
        }}
      >
        :{String(Math.max(0, secondsLeft)).padStart(2, '0')}
      </div>
      <div
        style={{
          flex: 1,
          height: 18,
          background: 'var(--surface)',
          border: '3px solid var(--ink)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(100, ratio * 100))}%`,
            height: '100%',
            background: color,
            borderRight: ratio > 0 ? '3px solid var(--ink)' : 'none',
            transition: 'width 0.25s linear',
          }}
        />
      </div>
    </div>
  );
}
