/* SOMS — Reveal screen (between rounds). */

const RevealScreen = ({ track, scores = [], onNext, isHost = true }) => {
  const t = track || { title: "Locked Out of Heaven", artist: "Bruno Mars", year: 2012, cover: null };
  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "32px 24px 100px" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div className="sm-label">Round 3 · revelação</div>
        <h1 style={{ margin: "8px 0 0", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 56, letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 1, transform: "rotate(-1deg)", display: "inline-block" }}>
          A música era…
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 32, alignItems: "start" }}>
        {/* Cover placeholder */}
        <div style={{
          width: 280, height: 280,
          background: "var(--secondary)",
          border: "4px solid var(--ink)", borderRadius: 24,
          boxShadow: "12px 12px 0 0 var(--shadow-color)",
          transform: "rotate(-1.5deg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "repeating-linear-gradient(45deg, #00000022 0 8px, transparent 8px 16px)",
          }} />
          <Icon name="music" size={96} strokeWidth={2.5} style={{ position: "relative" }} />
        </div>

        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 44, lineHeight: 1.05, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
            {t.title}
          </div>
          <div style={{ marginTop: 6, fontFamily: "var(--font-body)", fontSize: 22, color: "var(--ink-soft)" }}>
            {t.artist} · <span style={{ fontFamily: "var(--font-mono)" }}>{t.year}</span>
          </div>

          <div style={{ marginTop: 24 }}>
            <div className="sm-label" style={{ marginBottom: 10 }}>pontos do round</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {scores.map((s, i) => (
                <div key={s.name} style={{
                  background: i === 0 ? "var(--success)" : "var(--surface)",
                  border: "3px solid var(--ink)", borderRadius: 12,
                  boxShadow: "4px 4px 0 0 var(--shadow-color)",
                  padding: "10px 14px",
                  display: "flex", alignItems: "center", gap: 12,
                  transform: `rotate(${i % 2 ? 0.5 : -0.5}deg)`,
                }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16, width: 26 }}>{i + 1}º</span>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, textTransform: "lowercase", flex: 1 }}>{s.name}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, fontVariantNumeric: "tabular-nums" }}>
                    +{s.delta}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--ink-soft)" }}>
                    {s.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isHost && (
        <div style={{ marginTop: 36, display: "flex", justifyContent: "center" }}>
          <SmButton variant="primary" size="lg" onClick={onNext}>
            <Icon name="arrow" /> Próximo round
          </SmButton>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { RevealScreen });
