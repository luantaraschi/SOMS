/* SOMS — Share card (1080×1080 social) */

const ShareCard = ({ winner, score, stat = "memi chutou Drake em 7 dos 10 rounds." }) => {
  return (
    <div style={{
      width: 540, height: 540,
      background: "var(--special)",
      border: "8px solid var(--ink)",
      borderRadius: 32,
      boxShadow: "16px 16px 0 0 var(--shadow-color)",
      padding: 36,
      position: "relative",
      overflow: "hidden",
      color: "#fff",
      display: "flex", flexDirection: "column",
    }}>
      {/* Confetti pattern */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          radial-gradient(circle at 18% 22%, #FFE600 0 8px, transparent 9px),
          radial-gradient(circle at 84% 14%, #B8FF1A 0 6px, transparent 7px),
          radial-gradient(circle at 92% 58%, #FF3D7F 0 7px, transparent 8px),
          radial-gradient(circle at 8% 78%, #00E5FF 0 6px, transparent 7px),
          radial-gradient(circle at 76% 88%, #FFE600 0 5px, transparent 6px)
        `,
      }} />
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 900,
          fontSize: 28, letterSpacing: "-0.04em", textTransform: "uppercase",
        }}>SOMS</div>
        <div style={{
          background: "var(--surface)", color: "var(--ink)",
          border: "3px solid var(--ink)", borderRadius: 999,
          padding: "4px 12px",
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase",
          boxShadow: "3px 3px 0 0 var(--shadow-color)",
        }}>todo mundo acha que sabe</div>
      </div>

      {/* Center */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 8 }}>
        <div style={{
          background: "var(--primary)",
          color: "var(--ink)",
          border: "5px solid var(--ink)", borderRadius: 24,
          boxShadow: "10px 10px 0 0 var(--shadow-color)",
          padding: "18px 36px",
          transform: "rotate(-3deg)",
          textAlign: "center",
        }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            campeão
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 64, lineHeight: 1, textTransform: "lowercase" }}>
            {winner}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 40, fontVariantNumeric: "tabular-nums" }}>
            {score.toLocaleString("pt-BR")}
          </div>
        </div>
      </div>

      {/* Footer stat */}
      <div style={{
        position: "relative",
        background: "var(--surface)", color: "var(--ink)",
        border: "4px solid var(--ink)", borderRadius: 16,
        boxShadow: "6px 6px 0 0 var(--shadow-color)",
        padding: "14px 18px",
        transform: "rotate(1.5deg)",
        fontFamily: "var(--font-body)",
        fontSize: 17, lineHeight: 1.3, fontWeight: 500,
      }}>
        "{stat}"
      </div>
    </div>
  );
};

Object.assign(window, { ShareCard });
