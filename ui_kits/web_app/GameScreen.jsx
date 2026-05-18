/* SOMS — Game / In-Round screen. Timer, waveform, input, live feed. */

const Timer = ({ secondsLeft = 8, total = 30 }) => {
  const ratio = secondsLeft / total;
  const color = ratio > 0.5 ? "var(--success)" : ratio > 0.25 ? "var(--warm)" : "var(--danger)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{
        background: color,
        border: "4px solid var(--ink)", borderRadius: 16,
        boxShadow: "6px 6px 0 0 var(--shadow-color)",
        padding: "8px 16px",
        fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 32, lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
        minWidth: 88, textAlign: "center",
      }}>
        :{String(secondsLeft).padStart(2, "0")}
      </div>
      <div style={{ flex: 1, height: 18, background: "var(--surface)", border: "3px solid var(--ink)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          width: `${Math.max(0, ratio * 100)}%`,
          height: "100%",
          background: color,
          borderRight: "3px solid var(--ink)",
          transition: "width 0.5s linear",
        }} />
      </div>
    </div>
  );
};

const Waveform = ({ playing = true }) => {
  const bars = Array.from({ length: 32 }, (_, i) => i);
  return (
    <div style={{
      background: "var(--info)",
      border: "4px solid var(--ink)", borderRadius: 24,
      boxShadow: "12px 12px 0 0 var(--shadow-color)",
      padding: "32px 28px",
      transform: "rotate(-0.6deg)",
      display: "flex", alignItems: "center", gap: 18,
    }}>
      <div style={{
        width: 64, height: 64,
        background: "var(--ink)", color: "var(--bg)",
        border: "3px solid var(--ink)", borderRadius: 999,
        display: "flex", alignItems: "center", justifyContent: "center",
        flex: "none",
      }}>
        <Icon name={playing ? "pause" : "play"} size={28} strokeWidth={3} />
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4, height: 80 }}>
        {bars.map((b) => {
          const h = 20 + Math.abs(Math.sin((b + 1) * 0.7)) * 60;
          return (
            <div key={b} style={{
              flex: 1,
              height: `${h}%`,
              background: "var(--ink)",
              borderRadius: 2,
              animation: playing ? `wave-${b % 4} 0.${4 + (b % 4)}s ease-in-out infinite alternate` : "none",
            }} />
          );
        })}
      </div>
    </div>
  );
};

const GuessFeedItem = ({ guess, index }) => {
  const tilt = index % 2 === 0 ? -0.6 : 0.6;
  const bg = guess.result === "correct" ? "var(--success)" :
             guess.result === "close"   ? "var(--warm)" : "var(--surface)";
  return (
    <div style={{
      transform: `rotate(${tilt}deg)`,
      background: bg,
      border: "3px solid var(--ink)", borderRadius: 12,
      boxShadow: "4px 4px 0 0 var(--shadow-color)",
      padding: "10px 14px",
      display: "flex", alignItems: "center", gap: 10,
      fontFamily: "var(--font-body)", fontSize: 14,
    }}>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "lowercase" }}>{guess.who}:</span>
      <span style={{ flex: 1 }}>{guess.text}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13,
                     color: guess.result === "wrong" ? "var(--ink-soft)" : "var(--ink)" }}>
        {guess.result === "correct" ? `+${guess.score}` :
         guess.result === "close"   ? "quase"           : "errou"}
      </span>
    </div>
  );
};

const GameScreen = ({ round = 3, total = 10, secondsLeft = 8, feed = [] }) => {
  const [answer, setAnswer] = React.useState("");
  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 24px 80px", display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Top bar: round + timer */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SmBadge variant="special"><Icon name="zap" size={11} strokeWidth={3} /> Round {round}/{total}</SmBadge>
          <SmBadge>Clássico Turbinado</SmBadge>
        </div>
        <Timer secondsLeft={secondsLeft} total={30} />
      </div>

      {/* Waveform / preview */}
      <Waveform playing />

      {/* Answer input */}
      <SmCard style={{ padding: 16, background: "var(--surface)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
          <input
            className="sm-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="acerte o som..."
            style={{ flex: 1, fontSize: 20, minHeight: 60, boxShadow: "none" }}
          />
          <SmButton variant="primary" size="lg" onClick={() => setAnswer("")}>
            <Icon name="send" /> Enviar
          </SmButton>
        </div>
      </SmCard>

      {/* Live feed */}
      <div>
        <div className="sm-label" style={{ marginBottom: 10 }}>respostas ao vivo</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {feed.map((g, i) => <GuessFeedItem key={i} guess={g} index={i} />)}
        </div>
      </div>

      <style>{`
        @keyframes wave-0 { from { transform: scaleY(0.4); } to { transform: scaleY(1.0); } }
        @keyframes wave-1 { from { transform: scaleY(0.7); } to { transform: scaleY(0.3); } }
        @keyframes wave-2 { from { transform: scaleY(0.5); } to { transform: scaleY(0.9); } }
        @keyframes wave-3 { from { transform: scaleY(0.3); } to { transform: scaleY(0.8); } }
      `}</style>
    </div>
  );
};

Object.assign(window, { GameScreen, Timer, Waveform, GuessFeedItem });
