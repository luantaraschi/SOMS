/* SOMS — Error / Empty states. Múltiplas variantes em um arquivo. */

const _ErrorIllo = ({ kind }) => {
  // Cards rotacionados ilustrando o erro
  const stack = {
    "404":   ["4", "?", "4"],
    "empty": ["♪", "?",  ""],
    "kicked":["X", "↗",  ""],
    "down":  ["!", "!",  "!"],
  }[kind] || ["?", "?", "?"];

  const colors = ["var(--primary)", "var(--secondary)", "var(--info)"];
  const tColors = ["var(--ink)", "#fff", "var(--ink)"];

  return (
    <div style={{ display: "flex", gap: 18, justifyContent: "center", alignItems: "center", padding: "12px 0 8px" }}>
      {stack.map((ch, i) => ch ? (
        <div key={i} style={{
          width: 110, height: 110,
          background: colors[i],
          color: tColors[i],
          border: "4px solid var(--ink)",
          borderRadius: 20,
          boxShadow: "8px 8px 0 0 var(--shadow-color)",
          transform: `rotate(${[-4, 2, -2][i]}deg)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 64, lineHeight: 1,
        }}>{ch}</div>
      ) : null)}
    </div>
  );
};

const ErrorEmptyScreen = ({ kind = "404", onPrimary, onSecondary }) => {
  const CONFIG = {
    "404": {
      label: "Erro 404",
      title: "Essa sala não existe.",
      body: "ou já encerrou. acontece. cola na próxima.",
      primary: "Voltar pra home",
      secondary: "Tentar outro código",
    },
    "empty": {
      label: "Lobby vazio",
      title: "Só você por aqui.",
      body: "manda o código pra galera — sem amigos não tem zoeira.",
      primary: "Copiar código da sala",
      secondary: "Compartilhar link",
    },
    "kicked": {
      label: "Você foi removido",
      title: "O host te chutou.",
      body: "tenso. respira. tenta outra sala.",
      primary: "Voltar pra home",
      secondary: null,
    },
    "down": {
      label: "Algo deu errado",
      title: "A música parou.",
      body: "perdemos a conexão com o servidor. tentando de novo...",
      primary: "Tentar de novo",
      secondary: "Voltar pra home",
    },
  }[kind];

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 24px 80px", textAlign: "center" }}>
      <_ErrorIllo kind={kind} />

      <div style={{ marginTop: 28, marginBottom: 8 }}>
        <SmBadge variant="warm">{CONFIG.label}</SmBadge>
      </div>

      <h1 style={{
        margin: "16px 0 8px",
        fontFamily: "var(--font-display)", fontWeight: 900,
        fontSize: 44, lineHeight: 1.05, letterSpacing: "-0.02em",
        textTransform: "uppercase",
      }}>
        {CONFIG.title}
      </h1>

      <p style={{
        margin: "0 auto 28px",
        maxWidth: 420,
        fontFamily: "var(--font-body)", fontSize: 18,
        color: "var(--ink-soft)", lineHeight: 1.4,
      }}>
        {CONFIG.body}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        <SmButton variant="primary" size="lg" onClick={onPrimary}>
          {CONFIG.primary}
        </SmButton>
        {CONFIG.secondary && (
          <SmButton variant="ghost" onClick={onSecondary}>
            {CONFIG.secondary}
          </SmButton>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { ErrorEmptyScreen });
