/* SOMS — Home screen. "Criar sala" / "Entrar". */

const HomeScreen = ({ onCreate, onJoin }) => {
  const [nickname, setNickname] = React.useState("memi");
  const [code, setCode] = React.useState("");

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 24px 80px", display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Wordmark */}
      <div style={{ textAlign: "center", paddingTop: 16 }}>
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 900,
          fontSize: 88, lineHeight: 0.9, letterSpacing: "-0.04em",
          textTransform: "uppercase", display: "inline-block", position: "relative",
          transform: "rotate(-2deg)",
        }}>
          SOMS
          <span style={{
            position: "absolute", top: 4, right: -16,
            width: 18, height: 18, background: "var(--secondary)",
            border: "3px solid var(--ink)", borderRadius: 999,
            boxShadow: "3px 3px 0 0 var(--shadow-color)",
          }} />
        </div>
        <div style={{ marginTop: 14, fontStyle: "italic", color: "var(--ink-soft)", fontSize: 18 }}>
          todo mundo acha que sabe.
        </div>
      </div>

      {/* Form card */}
      <SmCard hero className="sm-tilt-l" style={{ background: "var(--surface)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <SmLabel>Seu apelido</SmLabel>
            <SmInput value={nickname} onChange={setNickname} placeholder="seu apelido..." />
          </div>

          <SmButton variant="primary" size="lg" block onClick={() => onCreate && onCreate(nickname)}>
            <Icon name="sparkles" /> Criar sala
          </SmButton>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 3, background: "var(--ink)" }} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase" }}>ou</span>
            <div style={{ flex: 1, height: 3, background: "var(--ink)" }} />
          </div>

          <div>
            <SmLabel>Código da sala</SmLabel>
            <SmInput value={code} onChange={(v) => setCode(v.toUpperCase().slice(0, 6))} placeholder="ABCD12" mono maxLength={6} />
          </div>
          <SmButton variant="secondary" size="lg" block onClick={() => onJoin && onJoin(nickname, code)}>
            <Icon name="arrow" /> Entrar
          </SmButton>
        </div>
      </SmCard>

      <div style={{ textAlign: "center", color: "var(--ink-soft)", fontSize: 13, marginTop: 8 }}>
        feito pra ouvir com amigos
      </div>
    </div>
  );
};

Object.assign(window, { HomeScreen });
