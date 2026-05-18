/* SOMS — Auth (login / signup / guest promotion).
   Per ARCHITECTURE.md: guest by default, can promote via Google/Discord. */

const _ProviderButton = ({ provider, color, textColor, icon, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex", alignItems: "center", gap: 14,
      width: "100%",
      padding: "16px 20px",
      minHeight: 60,
      background: color,
      color: textColor || "var(--ink)",
      border: "3px solid var(--ink)",
      borderRadius: 12,
      boxShadow: "6px 6px 0 0 var(--shadow-color)",
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 16,
      letterSpacing: "-0.01em",
      textTransform: "uppercase",
      cursor: "pointer",
      transition: "transform 100ms, box-shadow 100ms",
    }}
    onMouseDown={(e) => { e.currentTarget.style.transform = "translate(6px,6px)"; e.currentTarget.style.boxShadow = "0 0 0 0 var(--shadow-color)"; }}
    onMouseUp={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
  >
    <span style={{ flex: "none", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
    <span>continuar com {provider}</span>
  </button>
);

const GoogleGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.92a5.05 5.05 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.22-4.74 3.22-8.11z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.05H2.18A10.98 10.98 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.85z"/>
    <path fill="#EA4335" d="M12 5.4c1.62 0 3.07.56 4.21 1.65l3.15-3.16C17.46 2.04 14.97 1 12 1A11 11 0 0 0 2.18 7.05L5.84 9.9C6.71 7.3 9.14 5.4 12 5.4z"/>
  </svg>
);

const DiscordGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
    <path d="M20.32 4.37A19.79 19.79 0 0 0 15.4 3l-.25.47a17.4 17.4 0 0 0-6.3 0L8.6 3a19.79 19.79 0 0 0-4.92 1.37C1.18 8.14.43 11.8.8 15.41a19.86 19.86 0 0 0 6.05 3.05l.49-.69a13 13 0 0 1-2-1l.49-.39a13.93 13.93 0 0 0 12.34 0l.49.39a13 13 0 0 1-2 1l.49.69a19.86 19.86 0 0 0 6.05-3.05c.42-4.18-.7-7.81-2.88-11.04zM8.5 13.7c-1 0-1.83-.92-1.83-2.05 0-1.14.81-2.06 1.83-2.06s1.84.93 1.83 2.06c0 1.13-.81 2.05-1.83 2.05zm7 0c-1 0-1.83-.92-1.83-2.05 0-1.14.81-2.06 1.83-2.06s1.83.93 1.83 2.06c0 1.13-.81 2.05-1.83 2.05z"/>
  </svg>
);

const AuthScreen = ({ mode = "promote", nickname = "memi", coins = 240, badges = 3 }) => {
  // mode: "first" (creating account from scratch) | "promote" (guest converting)
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 56,
          textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: 0.9,
          transform: "rotate(-1.5deg)", display: "inline-block",
        }}>
          Salva tudo
        </div>
        <p style={{ margin: "14px auto 0", maxWidth: 360, color: "var(--ink-soft)", fontSize: 17, lineHeight: 1.4 }}>
          {mode === "promote"
            ? <>continue como <strong style={{ color: "var(--ink)" }}>{nickname}</strong> em qualquer dispositivo. seu progresso vai junto.</>
            : <>cria uma conta pra guardar moedas, badges e títulos. sem conta também dá pra jogar, mas tudo some quando você fechar o navegador.</>}
        </p>
      </div>

      {/* What you keep — only on promote */}
      {mode === "promote" && (
        <div style={{
          background: "var(--primary)",
          border: "4px solid var(--ink)", borderRadius: 20,
          boxShadow: "8px 8px 0 0 var(--shadow-color)",
          padding: "18px 22px",
          marginBottom: 28,
          transform: "rotate(-0.8deg)",
        }}>
          <div className="sm-label" style={{ marginBottom: 12 }}>você mantém</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontFamily: "var(--font-body)" }}>
            <_Stat label="moedas" value={coins} mono />
            <_Stat label="badges" value={badges} mono />
            <_Stat label="apelido" value={nickname} />
          </div>
        </div>
      )}

      {/* Providers */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <_ProviderButton provider="Google" color="var(--surface)" icon={<GoogleGlyph />} />
        <_ProviderButton provider="Discord" color="#5865F2" textColor="#fff" icon={<DiscordGlyph />} />
      </div>

      {/* Disclaimer */}
      <p style={{
        marginTop: 28, textAlign: "center",
        fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5,
      }}>
        ao continuar, você concorda com os <a href="#" style={{ color: "var(--ink)", textDecoration: "underline" }}>termos</a> e a <a href="#" style={{ color: "var(--ink)", textDecoration: "underline" }}>política de privacidade</a>.
      </p>

      {mode === "first" && (
        <p style={{ marginTop: 14, textAlign: "center", fontSize: 14 }}>
          <a href="#" style={{ color: "var(--ink)", textDecoration: "underline", fontWeight: 700 }}>continuar como convidado</a>
        </p>
      )}
    </div>
  );
};

const _Stat = ({ label, value, mono }) => (
  <div style={{
    background: "var(--surface)",
    border: "2.5px solid var(--ink)", borderRadius: 12,
    padding: "8px 10px",
    textAlign: "center",
  }}>
    <div style={{
      fontFamily: mono ? "var(--font-mono)" : "var(--font-display)",
      fontWeight: mono ? 700 : 800,
      fontSize: mono ? 24 : 16,
      lineHeight: 1.1,
      textTransform: mono ? "none" : "lowercase",
      fontVariantNumeric: "tabular-nums",
    }}>{value}</div>
    <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-soft)", marginTop: 2, fontWeight: 700 }}>
      {label}
    </div>
  </div>
);

Object.assign(window, { AuthScreen });
