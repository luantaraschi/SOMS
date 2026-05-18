/* SOMS — Room Settings (host-only). Modos, presets, regras especiais, tolerância. */

const _Section = ({ title, children, tilt = 0 }) => (
  <div style={{
    background: "var(--surface)",
    border: "3px solid var(--ink)", borderRadius: 16,
    boxShadow: "6px 6px 0 0 var(--shadow-color)",
    padding: "20px 22px",
    transform: tilt ? `rotate(${tilt}deg)` : undefined,
    marginBottom: 22,
  }}>
    <div className="sm-label" style={{ marginBottom: 14 }}>{title}</div>
    {children}
  </div>
);

const _Choice = ({ value, label, selected, onClick, color = "var(--surface)", textColor = "var(--ink)" }) => (
  <button
    onClick={() => onClick && onClick(value)}
    style={{
      padding: "10px 14px",
      minHeight: 44,
      background: selected ? color : "transparent",
      color: selected ? textColor : "var(--ink)",
      border: "3px solid var(--ink)",
      borderRadius: 999,
      boxShadow: selected ? "3px 3px 0 0 var(--shadow-color)" : "none",
      fontFamily: "var(--font-display)",
      fontWeight: 800, fontSize: 13,
      letterSpacing: "0.02em", textTransform: "uppercase",
      cursor: "pointer",
      transition: "all 100ms",
    }}
  >
    {label}
  </button>
);

const _Stepper = ({ value, min = 1, max = 30, step = 1, onChange, suffix }) => {
  const dec = () => onChange && onChange(Math.max(min, value - step));
  const inc = () => onChange && onChange(Math.min(max, value + step));
  return (
    <div style={{ display: "inline-flex", alignItems: "stretch", border: "3px solid var(--ink)", borderRadius: 12, boxShadow: "4px 4px 0 0 var(--shadow-color)", overflow: "hidden", background: "var(--surface)" }}>
      <button onClick={dec} style={{ width: 44, background: "var(--surface)", border: "none", borderRight: "3px solid var(--ink)", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, cursor: "pointer" }}>−</button>
      <div style={{ minWidth: 88, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, fontVariantNumeric: "tabular-nums" }}>
        {value}{suffix && <span style={{ marginLeft: 2, fontSize: 14, color: "var(--ink-soft)" }}>{suffix}</span>}
      </div>
      <button onClick={inc} style={{ width: 44, background: "var(--primary)", border: "none", borderLeft: "3px solid var(--ink)", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, cursor: "pointer" }}>+</button>
    </div>
  );
};

const _Toggle = ({ on, onChange, label, hint }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1.5px dashed #0a0a0a22" }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: "-0.005em" }}>{label}</div>
      {hint && <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{hint}</div>}
    </div>
    <button
      onClick={() => onChange && onChange(!on)}
      style={{
        width: 56, height: 32,
        background: on ? "var(--success)" : "var(--surface)",
        border: "3px solid var(--ink)",
        borderRadius: 999,
        boxShadow: "3px 3px 0 0 var(--shadow-color)",
        position: "relative",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <span style={{
        position: "absolute",
        top: 2, left: on ? 26 : 2,
        width: 22, height: 22,
        background: "var(--ink)",
        borderRadius: 999,
        transition: "left 120ms",
      }} />
    </button>
  </div>
);

const SettingsScreen = () => {
  const [mode, setMode] = React.useState("CLASSIC");
  const [preset, setPreset] = React.useState("custom");
  const [rounds, setRounds] = React.useState(10);
  const [duration, setDuration] = React.useState(30);
  const [tolerance, setTolerance] = React.useState("medium");
  const [chaos, setChaos] = React.useState("off");
  const [feats, setFeats] = React.useState(true);
  const [approx, setApprox] = React.useState(true);
  const [cards, setCards] = React.useState(true);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 100px" }}>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="sm-label">configurações da sala</div>
          <h1 style={{ margin: "6px 0 0", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 40, lineHeight: 1, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
            Como vão jogar?
          </h1>
        </div>
        <SmBadge variant="host"><Icon name="crown" size={12} strokeWidth={3} /> Host</SmBadge>
      </div>

      {/* Presets */}
      <_Section title="presets">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <_Choice value="casual"   label="Casual"    selected={preset === "casual"}    onClick={setPreset} color="var(--primary)" />
          <_Choice value="hardcore" label="Hardcore"  selected={preset === "hardcore"}  onClick={setPreset} color="var(--secondary)" textColor="#fff" />
          <_Choice value="blind"    label="Blind Test"selected={preset === "blind"}     onClick={setPreset} color="var(--info)" />
          <_Choice value="who-sang" label="Quem Cantou" selected={preset === "who-sang"} onClick={setPreset} color="var(--warm)" />
          <_Choice value="chaos"    label="Sala Caótica" selected={preset === "chaos"} onClick={setPreset} color="var(--special)" textColor="#fff" />
          <_Choice value="custom"   label="Custom"    selected={preset === "custom"}    onClick={setPreset} color="var(--surface)" />
        </div>
      </_Section>

      {/* Mode */}
      <_Section title="modo" tilt={-0.4}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <_Choice value="CLASSIC"    label="Clássico Turbinado" selected={mode === "CLASSIC"}    onClick={setMode} color="var(--primary)" />
          <_Choice value="BLIND_TEST" label="Blind Test"         selected={mode === "BLIND_TEST"} onClick={setMode} color="var(--info)" />
          <_Choice value="WHO_SANG"   label="Quem Cantou Isso?"  selected={mode === "WHO_SANG"}   onClick={setMode} color="var(--success)" />
        </div>
      </_Section>

      {/* Rounds + duration */}
      <_Section title="estrutura" tilt={0.5}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 6, fontWeight: 600 }}>rounds</div>
            <_Stepper value={rounds} min={3} max={30} onChange={setRounds} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 6, fontWeight: 600 }}>duração por round</div>
            <_Stepper value={duration} min={5} max={60} step={5} suffix="s" onChange={setDuration} />
          </div>
        </div>
      </_Section>

      {/* Special rules */}
      <_Section title="regras especiais" tilt={-0.3}>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <_Choice value="off"   label="desligado" selected={chaos === "off"}   onClick={setChaos} color="var(--surface)" />
          <_Choice value="light" label="leve"       selected={chaos === "light"} onClick={setChaos} color="var(--warm)" />
          <_Choice value="chaos" label="caótico"    selected={chaos === "chaos"} onClick={setChaos} color="var(--special)" textColor="#fff" />
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.4 }}>
          algumas rodadas (ou todas) ganham regras extras: "só vale artista", "feat vale dobrado", "áudio só 3 segundos", etc.
        </p>
      </_Section>

      {/* Tolerance */}
      <_Section title="tolerância nas respostas" tilt={0.4}>
        <div style={{ display: "flex", gap: 10 }}>
          <_Choice value="low"    label="baixa"  selected={tolerance === "low"}    onClick={setTolerance} color="var(--surface)" />
          <_Choice value="medium" label="média"  selected={tolerance === "medium"} onClick={setTolerance} color="var(--success)" />
          <_Choice value="high"   label="alta"   selected={tolerance === "high"}   onClick={setTolerance} color="var(--info)" />
        </div>
      </_Section>

      {/* Toggles */}
      <_Section title="extras">
        <_Toggle on={feats}  onChange={setFeats}  label="aceitar feat"          hint="quem acertar o feat também pontua" />
        <_Toggle on={approx} onChange={setApprox} label="respostas aproximadas" hint="aceita pequenos erros de digitação" />
        <_Toggle on={cards}  onChange={setCards}  label="cards compartilháveis" hint="gerar imagens pra mandar no chat no fim" />
      </_Section>

      {/* Save */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
        <SmButton variant="primary" size="lg"><Icon name="check" /> Salvar e iniciar</SmButton>
        <SmButton variant="ghost">Cancelar</SmButton>
      </div>
    </div>
  );
};

Object.assign(window, { SettingsScreen });
