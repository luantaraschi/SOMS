/* SOMS — End / Podium screen with funny stats. */

const PodiumColumn = ({ rank, name, score, color, height, tilt, textColor }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
    <SmAvatar initial={name[0].toUpperCase()} size="lg" color={color} textColor={textColor || "var(--ink)"} />
    <div style={{
      background: color,
      color: textColor || "var(--ink)",
      border: "4px solid var(--ink)",
      borderRadius: 20,
      boxShadow: rank === 1 ? "12px 12px 0 0 var(--shadow-color)" : "8px 8px 0 0 var(--shadow-color)",
      padding: "20px 22px",
      transform: `rotate(${tilt}deg)`,
      width: rank === 1 ? 200 : 160,
      textAlign: "center",
    }}>
      <div style={{
        fontFamily: "var(--font-display)", fontWeight: 900,
        fontSize: rank === 1 ? 60 : 44, lineHeight: 1,
      }}>{rank}º</div>
      <div style={{
        fontFamily: "var(--font-display)", fontWeight: 800,
        fontSize: rank === 1 ? 22 : 18, textTransform: "lowercase",
        margin: "6px 0 2px",
      }}>{name}</div>
      <div style={{
        fontFamily: "var(--font-mono)", fontWeight: 700,
        fontSize: rank === 1 ? 28 : 22,
        fontVariantNumeric: "tabular-nums",
      }}>{score.toLocaleString("pt-BR")}</div>
    </div>
    {rank === 1 && (
      <div style={{ marginTop: -4 }}>
        <SmBadge variant="special"><Icon name="trophy" size={12} strokeWidth={3} /> Vencedor</SmBadge>
      </div>
    )}
  </div>
);

const StatCard = ({ stat, color, tilt }) => (
  <div style={{
    background: color || "var(--surface)",
    border: "3px solid var(--ink)",
    borderRadius: 16,
    boxShadow: "6px 6px 0 0 var(--shadow-color)",
    padding: "16px 18px",
    transform: `rotate(${tilt}deg)`,
  }}>
    <div className="sm-label" style={{ marginBottom: 6 }}>{stat.title}</div>
    <div style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.35 }}>
      {stat.text}
    </div>
  </div>
);

const EndScreen = ({ podium = [], rest = [], stats = [], onRematch }) => {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 24px 80px" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div className="sm-label">fim de partida</div>
        <h1 style={{
          margin: "8px 0 0",
          fontFamily: "var(--font-display)", fontWeight: 900,
          fontSize: 64, letterSpacing: "-0.03em",
          textTransform: "uppercase", lineHeight: 1,
          transform: "rotate(-1.5deg)", display: "inline-block",
        }}>
          Pódio
        </h1>
      </div>

      {/* Podium */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 36, marginBottom: 48 }}>
        {podium[1] && <PodiumColumn rank={2} {...podium[1]} color="var(--secondary)" tilt={2} textColor="#fff" />}
        {podium[0] && <PodiumColumn rank={1} {...podium[0]} color="var(--primary)" tilt={-2} />}
        {podium[2] && <PodiumColumn rank={3} {...podium[2]} color="var(--info)" tilt={-1.5} />}
      </div>

      {/* Rest */}
      {rest.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <div className="sm-label" style={{ marginBottom: 12 }}>resto do ranking</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {rest.map((p, i) => (
              <div key={p.name} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "var(--surface)", border: "3px solid var(--ink)", borderRadius: 12,
                boxShadow: "4px 4px 0 0 var(--shadow-color)",
                padding: "10px 14px",
              }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16, width: 32 }}>{i + 4}º</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, textTransform: "lowercase", flex: 1 }}>{p.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16, fontVariantNumeric: "tabular-nums" }}>
                  {p.score.toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Funny stats */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ margin: "0 0 18px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
          Estatísticas engraçadas
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {stats.map((s, i) => (
            <StatCard
              key={i}
              stat={s}
              color={["var(--success)", "var(--warm)", "var(--info)", "var(--special)"][i % 4]}
              tilt={i % 2 === 0 ? -1 : 1}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
        <SmButton variant="primary" size="lg" onClick={onRematch}>
          <Icon name="play" /> Jogar de novo
        </SmButton>
        <SmButton variant="secondary" size="lg">
          <Icon name="share" /> Compartilhar pódio
        </SmButton>
      </div>
    </div>
  );
};

Object.assign(window, { EndScreen, PodiumColumn, StatCard });
