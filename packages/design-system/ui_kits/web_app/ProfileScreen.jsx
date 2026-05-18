/* SOMS — Profile page. Avatar, nickname, coins, equipped title/badge, stats, achievements. */

const _StatTile = ({ label, value, color = "var(--surface)", tilt = 0, mono = true }) => (
  <div style={{
    background: color,
    border: "3px solid var(--ink)", borderRadius: 16,
    boxShadow: "6px 6px 0 0 var(--shadow-color)",
    padding: "14px 18px",
    transform: tilt ? `rotate(${tilt}deg)` : undefined,
    textAlign: "center",
  }}>
    <div style={{
      fontFamily: mono ? "var(--font-mono)" : "var(--font-display)",
      fontWeight: mono ? 700 : 800,
      fontSize: 28, lineHeight: 1,
      fontVariantNumeric: "tabular-nums",
    }}>{value}</div>
    <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
      {label}
    </div>
  </div>
);

const _BadgeCard = ({ name, unlocked, color, tilt, icon }) => (
  <div style={{
    background: unlocked ? color : "var(--surface)",
    border: "3px solid var(--ink)", borderRadius: 14,
    boxShadow: unlocked ? "6px 6px 0 0 var(--shadow-color)" : "3px 3px 0 0 var(--shadow-color)",
    padding: "14px 12px",
    transform: `rotate(${tilt}deg)`,
    opacity: unlocked ? 1 : 0.55,
    filter: unlocked ? "none" : "grayscale(0.6)",
    textAlign: "center",
    display: "flex", flexDirection: "column", gap: 8, alignItems: "center",
  }}>
    <div style={{
      width: 48, height: 48,
      border: "3px solid var(--ink)", borderRadius: 12,
      background: "var(--surface)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--ink)",
    }}>
      <Icon name={icon} size={26} strokeWidth={3} />
    </div>
    <div style={{
      fontFamily: "var(--font-display)",
      fontWeight: 800, fontSize: 12, lineHeight: 1.15,
      textTransform: "uppercase", letterSpacing: "-0.005em",
    }}>{name}</div>
  </div>
);

const ProfileScreen = ({ user }) => {
  const u = user || {
    nickname: "memi",
    title: "Pessoa que Sempre Chuta Drake",
    coins: 1240,
    games: 47,
    wins: 12,
    streak: 4,
    fastestMs: 1420,
    avatarColor: "var(--primary)",
  };

  const BADGES = [
    { name: "Primeiro Som",     unlocked: true,  color: "var(--success)", tilt: -1.5, icon: "music" },
    { name: "Flash Musical",    unlocked: true,  color: "var(--primary)", tilt: 1.5,  icon: "zap" },
    { name: "Ouvido de Ouro",   unlocked: true,  color: "var(--warm)",    tilt: -1,   icon: "check" },
    { name: "Caçador de Feat",  unlocked: true,  color: "var(--info)",    tilt: 1,    icon: "trophy" },
    { name: "Sala Caótica",     unlocked: false, color: "var(--special)", tilt: -1.5, icon: "skull" },
    { name: "Virada",           unlocked: false, color: "var(--secondary)", tilt: 1.5, icon: "sparkles" },
  ];

  const TITLES = [
    "Pessoa que Sempre Chuta Drake",
    "Ouvido de Ouro",
    "Caçador de Feat",
    "Confiante e Errado",
    "Mestre dos 3 Segundos",
  ];

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: "32px 24px 100px" }}>
      {/* Header card */}
      <div style={{
        background: "var(--primary)",
        border: "4px solid var(--ink)", borderRadius: 24,
        boxShadow: "12px 12px 0 0 var(--shadow-color)",
        padding: "24px 28px",
        transform: "rotate(-1deg)",
        display: "flex", alignItems: "center", gap: 22,
        marginBottom: 36,
      }}>
        <div style={{
          width: 96, height: 96,
          background: u.avatarColor,
          border: "4px solid var(--ink)", borderRadius: 20,
          boxShadow: "4px 4px 0 0 var(--shadow-color)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 52,
          flex: "none",
          transform: "rotate(2deg)",
        }}>
          {u.nickname[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            margin: 0,
            fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 48,
            letterSpacing: "-0.03em", lineHeight: 1, textTransform: "lowercase",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{u.nickname}</h1>
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <SmBadge variant="special">"{u.title}"</SmBadge>
            <SmBadge>nível convidado promovido</SmBadge>
          </div>
        </div>
        <button style={{
          flex: "none",
          background: "var(--surface)",
          border: "3px solid var(--ink)", borderRadius: 12,
          boxShadow: "4px 4px 0 0 var(--shadow-color)",
          padding: "10px 14px",
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12,
          letterSpacing: "0.04em", textTransform: "uppercase",
          cursor: "pointer",
        }}>Editar</button>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 40 }}>
        <_StatTile label="moedas"        value={u.coins.toLocaleString("pt-BR")} color="var(--primary)"   tilt={-1.5} />
        <_StatTile label="partidas"      value={u.games}                          color="var(--surface)"             tilt={1} />
        <_StatTile label="vitórias"      value={u.wins}                           color="var(--success)"   tilt={-1} />
        <_StatTile label="streak atual"  value={u.streak}                         color="var(--warm)"      tilt={1.5} />
        <_StatTile label="mais rápido"   value={(u.fastestMs / 1000).toFixed(2) + "s"} color="var(--info)" tilt={-1.5} />
      </div>

      {/* Badges */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ margin: "0 0 18px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
          Badges <span style={{ color: "var(--ink-soft)", fontSize: 16 }}>4/11</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
          {BADGES.map((b, i) => <_BadgeCard key={i} {...b} />)}
        </div>
      </section>

      {/* Titles */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ margin: "0 0 18px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
          Títulos
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {TITLES.map((t, i) => {
            const equipped = t === u.title;
            return (
              <span key={t} style={{
                padding: "8px 14px",
                background: equipped ? "var(--special)" : "var(--surface)",
                color: equipped ? "#fff" : "var(--ink)",
                border: "3px solid var(--ink)",
                borderRadius: 999,
                boxShadow: equipped ? "4px 4px 0 0 var(--shadow-color)" : "2px 2px 0 0 var(--shadow-color)",
                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13,
                letterSpacing: "-0.005em",
                cursor: "pointer",
                transform: `rotate(${i % 2 === 0 ? -0.6 : 0.6}deg)`,
              }}>
                {equipped && "★ "}{t}
              </span>
            );
          })}
        </div>
        <p style={{ marginTop: 12, fontSize: 13, color: "var(--ink-soft)" }}>
          clique pra equipar. o título aparece embaixo do seu apelido nas salas.
        </p>
      </section>

      {/* Recent matches */}
      <section>
        <h2 style={{ margin: "0 0 18px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
          Últimas partidas
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { code: "ABCD12", mode: "Clássico", pos: 1, score: 1240, date: "ontem" },
            { code: "ZYX098", mode: "Blind Test", pos: 3, score: 620, date: "há 2 dias" },
            { code: "MUSIC1", mode: "Sala Caótica", pos: 1, score: 1880, date: "há 4 dias" },
          ].map((m, i) => (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto auto auto",
              alignItems: "center", gap: 14,
              background: "var(--surface)",
              border: "3px solid var(--ink)", borderRadius: 12,
              boxShadow: "4px 4px 0 0 var(--shadow-color)",
              padding: "12px 16px",
            }}>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--ink-soft)" }}>{m.code}</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{m.mode}</span>
              <SmBadge variant={m.pos === 1 ? "special" : undefined}>{m.pos}º</SmBadge>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>{m.score.toLocaleString("pt-BR")}</span>
              <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{m.date}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

Object.assign(window, { ProfileScreen });
