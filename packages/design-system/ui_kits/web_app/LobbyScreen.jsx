/* SOMS — Lobby. Room code, player grid, settings. */

const PlayerCard = ({ player, index }) => {
  const tilt = index % 2 === 0 ? -1.5 : 1.5;
  return (
    <div style={{
      transform: `rotate(${tilt}deg)`,
      background: "var(--surface)",
      border: "3px solid var(--ink)",
      borderRadius: 16,
      boxShadow: "6px 6px 0 0 var(--shadow-color)",
      padding: "12px 14px",
      display: "flex", alignItems: "center", gap: 12,
      minHeight: 76,
    }}>
      <SmAvatar initial={player.name[0].toUpperCase()} color={player.color} textColor={player.textColor || "var(--ink)"} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18,
          textTransform: "lowercase", letterSpacing: "-0.01em",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          {player.name}
          {player.host && (
            <SmBadge variant="host" style={{ padding: "2px 7px", fontSize: 9, boxShadow: "1.5px 1.5px 0 0 var(--shadow-color)" }}>
              <Icon name="crown" size={11} strokeWidth={3} /> Host
            </SmBadge>
          )}
        </div>
        {player.status && <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{player.status}</div>}
      </div>
    </div>
  );
};

const LobbyScreen = ({ code = "ABCD12", players = [], mode = "Clássico Turbinado", onStart, isHost = true }) => {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 24px 100px" }}>
      {/* Hero room code */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
        <SmCard hero style={{
          background: "var(--primary)",
          textAlign: "center",
          transform: "rotate(-1deg)",
          padding: "24px 56px",
        }}>
          <div style={{
            fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12,
            letterSpacing: "0.22em", textTransform: "uppercase",
            color: "var(--ink-soft)", marginBottom: 4,
          }}>
            código da sala
          </div>
          <div style={{
            fontFamily: "var(--font-mono)", fontWeight: 700,
            fontSize: 72, lineHeight: 1, letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
          }}>
            {code}
          </div>
          <button
            className="sm-btn sm-btn--ghost"
            style={{ marginTop: 8, padding: "6px 12px", minHeight: 0, fontSize: 12, gap: 6 }}
            onClick={() => navigator.clipboard && navigator.clipboard.writeText(code)}
          >
            <Icon name="copy" size={14} /> Copiar
          </button>
        </SmCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 280px", gap: 32, alignItems: "start" }}>
        {/* Players */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
              Jogadores
            </h2>
            <SmBadge>
              <Icon name="users" size={12} strokeWidth={3} /> {players.length}/20
            </SmBadge>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {players.map((p, i) => <PlayerCard key={p.name} player={p} index={i} />)}
          </div>
        </div>

        {/* Settings */}
        <SmCard style={{ background: "var(--surface)" }}>
          <div className="sm-label" style={{ marginBottom: 12 }}>Configurações</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: "var(--font-body)", fontSize: 14 }}>
            <SettingsRow label="Modo" value={mode} />
            <SettingsRow label="Rounds" value="10" />
            <SettingsRow label="Duração" value="30s" />
            <SettingsRow label="Tolerância" value="média" />
            <SettingsRow label="Regras especiais" value="leve" />
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <SmBadge variant="special">
              <Icon name="skull" size={12} strokeWidth={3} /> Caótica
            </SmBadge>
            <SmBadge>Casual</SmBadge>
            <SmBadge>Hardcore</SmBadge>
          </div>
        </SmCard>
      </div>

      {/* Start CTA — sticky bottom for mobile, normal for desktop */}
      {isHost && (
        <div style={{ position: "sticky", bottom: 16, marginTop: 48, display: "flex", justifyContent: "center" }}>
          <SmButton variant="primary" size="lg" onClick={onStart}>
            <Icon name="play" /> Iniciar partida
          </SmButton>
        </div>
      )}
    </div>
  );
};

const SettingsRow = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1.5px dashed #0a0a0a22" }}>
    <span style={{ color: "var(--ink-soft)" }}>{label}</span>
    <span style={{ fontWeight: 700 }}>{value}</span>
  </div>
);

Object.assign(window, { LobbyScreen, PlayerCard });
