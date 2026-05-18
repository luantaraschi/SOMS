/* SOMS — Shop / Loja. Cosméticos com raridade, drop da semana, preview ao vivo. */

/* ============ RARIDADE ============
   comum   → cinza / surface
   raro    → info (cyan)
   épico   → special (roxo)
   lendário → primary (amarelo / dourado)
   sazonal → secondary (rosa choque)
*/
const RARITY = {
  common:    { label: "comum",     color: "#E5E5E5",         text: "#0A0A0A", glow: "#0a0a0a22" },
  rare:      { label: "raro",      color: "var(--info)",     text: "#0A0A0A", glow: "#00E5FF55" },
  epic:      { label: "épico",     color: "var(--special)",  text: "#FFFFFF", glow: "#A78BFA66" },
  legendary: { label: "lendário",  color: "var(--primary)",  text: "#0A0A0A", glow: "#FFE60088" },
  seasonal:  { label: "sazonal",   color: "var(--secondary)",text: "#FFFFFF", glow: "#FF3D7F77" },
};

/* ============ COUNTDOWN ============ */
const useCountdown = (target) => {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
};

/* ============ COIN PILL ============ */
const _Coins = ({ value }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "var(--primary)",
    border: "3px solid var(--ink)", borderRadius: 999,
    boxShadow: "4px 4px 0 0 var(--shadow-color)",
    padding: "8px 14px 8px 8px",
  }}>
    <span style={{
      width: 26, height: 26,
      background: "var(--warm)",
      border: "3px solid var(--ink)", borderRadius: 999,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 13,
    }}>$</span>
    <span style={{
      fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 17,
      fontVariantNumeric: "tabular-nums",
    }}>{value.toLocaleString("pt-BR")}</span>
  </div>
);

/* ============ DROP BANNER ============ */
const _DropBanner = () => {
  const target = React.useMemo(() => Date.now() + (4 * 86400000 + 7 * 3600000 + 23 * 60000), []);
  const c = useCountdown(target);

  return (
    <div style={{
      position: "relative",
      background: "var(--secondary)",
      color: "#fff",
      border: "4px solid var(--ink)", borderRadius: 24,
      boxShadow: "12px 12px 0 0 var(--shadow-color)",
      padding: "26px 28px",
      transform: "rotate(-0.7deg)",
      marginBottom: 32,
      overflow: "hidden",
    }}>
      {/* Decorative dots */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `
          radial-gradient(circle at 92% 18%, #FFE600 0 12px, transparent 14px),
          radial-gradient(circle at 78% 88%, #B8FF1A 0 10px, transparent 12px),
          radial-gradient(circle at 88% 50%, #00E5FF 0 7px, transparent 9px)
        `,
      }} />

      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr auto", gap: 18, alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <SmBadge style={{ background: "var(--ink)", color: "var(--bg)" }}>drop da semana</SmBadge>
            <SmBadge style={{ background: "var(--surface)", color: "var(--ink)" }}>SAZONAL</SmBadge>
          </div>
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 900,
            fontSize: 42, lineHeight: 1, letterSpacing: "-0.03em", textTransform: "uppercase",
          }}>
            Pack Balada 2000
          </div>
          <p style={{ margin: "8px 0 0", maxWidth: 380, lineHeight: 1.4, fontSize: 15 }}>
            moldura "disco riscado" + emote "chutou drake" + tema de sala. <strong>vai sumir em alguns dias.</strong>
          </p>

          <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 18 }}>
            {/* Countdown */}
            <div style={{ display: "flex", gap: 6 }}>
              <_CountUnit n={c.d} l="d" />
              <_CountUnit n={c.h} l="h" />
              <_CountUnit n={c.m} l="m" />
              <_CountUnit n={c.s} l="s" />
            </div>
            <SmButton variant="primary" size="lg">
              <span style={{ fontSize: 18 }}>$</span> 1.800
            </SmButton>
          </div>
        </div>

        {/* Pack visual */}
        <div style={{
          width: 180, height: 180,
          background: "var(--special)",
          border: "4px solid var(--ink)", borderRadius: 20,
          boxShadow: "8px 8px 0 0 var(--shadow-color)",
          transform: "rotate(4deg)",
          padding: 14,
          position: "relative",
          flex: "none",
        }}>
          <div style={{
            position: "absolute", inset: 14,
            border: "5px double var(--ink)", borderRadius: 10,
            background: "var(--info)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              fontFamily: "var(--font-display)", fontWeight: 900,
              fontSize: 56, color: "var(--ink)", transform: "rotate(-6deg)",
            }}>M</div>
          </div>
          <div style={{
            position: "absolute", top: -10, right: -10,
            background: "var(--warm)", color: "var(--ink)",
            border: "3px solid var(--ink)", borderRadius: 999,
            padding: "4px 10px",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 11,
            letterSpacing: "0.04em", textTransform: "uppercase",
            transform: "rotate(8deg)",
          }}>-25%</div>
        </div>
      </div>
    </div>
  );
};

const _CountUnit = ({ n, l }) => (
  <div style={{
    background: "var(--ink)", color: "var(--bg)",
    border: "3px solid var(--ink)", borderRadius: 10,
    padding: "6px 8px",
    minWidth: 44, textAlign: "center",
    fontFamily: "var(--font-mono)", fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
  }}>
    <div style={{ fontSize: 18 }}>{String(n).padStart(2, "0")}</div>
    <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>{l}</div>
  </div>
);

/* ============ CATEGORY TABS ============ */
const CATEGORIES = [
  { id: "moldura",  label: "Molduras",   icon: "trophy" },
  { id: "avatar",   label: "Avatares",   icon: "users" },
  { id: "titulo",   label: "Títulos",    icon: "sparkles" },
  { id: "emote",    label: "Emotes",     icon: "zap" },
  { id: "anim",     label: "Animações",  icon: "play" },
  { id: "tema",     label: "Temas",      icon: "music" },
];

const _Tabs = ({ active, onChange }) => (
  <div style={{
    display: "flex", gap: 10, flexWrap: "wrap",
    marginBottom: 24,
  }}>
    {CATEGORIES.map((c) => {
      const on = c.id === active;
      return (
        <button key={c.id} onClick={() => onChange(c.id)} style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "10px 16px", minHeight: 44,
          background: on ? "var(--ink)" : "var(--surface)",
          color: on ? "var(--bg)" : "var(--ink)",
          border: "3px solid var(--ink)", borderRadius: 999,
          boxShadow: on ? "3px 3px 0 0 var(--shadow-color)" : "4px 4px 0 0 var(--shadow-color)",
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13,
          letterSpacing: "0.02em", textTransform: "uppercase",
          cursor: "pointer",
          transition: "all 100ms",
        }}>
          <Icon name={c.icon} size={14} strokeWidth={3} />
          {c.label}
        </button>
      );
    })}
  </div>
);

/* ============ ITEM CARD ============
   Functional preview: shows the cosmetic actually doing its thing.
*/
const _ItemCard = ({ item, equipped, owned, onEquip, onBuy, onPreview, previewing, index }) => {
  const r = RARITY[item.rarity];
  const tilt = index % 2 === 0 ? -1 : 1;
  const locked = !!item.lockedReason;

  return (
    <div
      onMouseEnter={() => !locked && onPreview && onPreview(item)}
      onMouseLeave={() => onPreview && onPreview(null)}
      style={{
        position: "relative",
        background: "var(--surface)",
        border: "3px solid var(--ink)",
        borderRadius: 16,
        boxShadow: previewing
          ? `8px 8px 0 0 var(--shadow-color), 0 0 0 6px ${r.glow}`
          : "6px 6px 0 0 var(--shadow-color)",
        transform: previewing ? `rotate(${tilt * 0.5}deg) translate(-2px,-2px)` : `rotate(${tilt}deg)`,
        transition: "transform 120ms, box-shadow 120ms",
        overflow: "hidden",
        cursor: locked ? "default" : "pointer",
        opacity: locked ? 0.85 : 1,
      }}
    >
      {/* Rarity color bar */}
      <div style={{
        background: r.color,
        color: r.text,
        padding: "6px 14px",
        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 11,
        letterSpacing: "0.16em", textTransform: "uppercase",
        borderBottom: "3px solid var(--ink)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span>{r.label}</span>
        {equipped && <span style={{ background: "var(--ink)", color: "var(--bg)", padding: "1px 7px", borderRadius: 4, fontSize: 9 }}>EQUIPADO</span>}
      </div>

      {/* The functional preview */}
      <div style={{
        height: 160,
        background: locked ? "#0a0a0a08" : "var(--bg)",
        backgroundImage: locked ? "none" : "radial-gradient(circle, #0a0a0a14 1px, transparent 1px)",
        backgroundSize: "16px 16px",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, position: "relative",
        filter: locked ? "grayscale(0.7)" : "none",
      }}>
        <_ItemPreview item={item} animate={previewing && !locked} />
        {locked && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(10,10,10,0.55)",
            display: "flex", flexDirection: "column", gap: 6,
            alignItems: "center", justifyContent: "center",
            color: "#fff", textAlign: "center", padding: 16,
          }}>
            <div style={{
              width: 36, height: 36,
              background: "var(--bg)", color: "var(--ink)",
              border: "3px solid var(--ink)", borderRadius: 999,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, maxWidth: 200, lineHeight: 1.3 }}>
              {item.lockedReason}
            </div>
          </div>
        )}
      </div>

      {/* Name + price/action */}
      <div style={{ padding: "14px 14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16,
          textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1,
        }}>{item.name}</div>

        {locked ? (
          <button disabled style={{
            padding: "8px 12px", minHeight: 38,
            background: "#0a0a0a14", color: "var(--ink-soft)",
            border: "3px solid var(--ink-soft)", borderRadius: 10,
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12,
            letterSpacing: "0.02em", textTransform: "uppercase",
            cursor: "not-allowed",
          }}>bloqueado</button>
        ) : owned ? (
          <button onClick={() => onEquip && onEquip(item)} style={{
            padding: "8px 12px", minHeight: 38,
            background: equipped ? "var(--success)" : "var(--surface)",
            color: "var(--ink)",
            border: "3px solid var(--ink)", borderRadius: 10,
            boxShadow: "3px 3px 0 0 var(--shadow-color)",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12,
            letterSpacing: "0.02em", textTransform: "uppercase",
            cursor: "pointer",
          }}>{equipped ? "✓ equipado" : "equipar"}</button>
        ) : (
          <button onClick={() => onBuy && onBuy(item)} style={{
            padding: "8px 12px", minHeight: 38,
            background: r.color, color: r.text,
            border: "3px solid var(--ink)", borderRadius: 10,
            boxShadow: "3px 3px 0 0 var(--shadow-color)",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13,
            letterSpacing: "0.02em", textTransform: "uppercase",
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
          }}>
            <span style={{ fontSize: 15 }}>$</span> {item.price.toLocaleString("pt-BR")}
          </button>
        )}
      </div>
    </div>
  );
};

/* ============ PREVIEWS that actually DO the cosmetic ============ */
const _ItemPreview = ({ item, animate }) => {
  const inner = (() => {
    switch (item.kind) {
      case "moldura":
        return (
          <div style={{
            width: 110, height: 110,
            background: item.demoColor || "var(--primary)",
            border: `5px ${item.border || "solid"} var(--ink)`,
            borderRadius: 16,
            boxShadow: item.shadow || "4px 4px 0 0 var(--shadow-color)",
            padding: 6,
          }}>
            <div style={{
              width: "100%", height: "100%",
              background: "var(--surface)",
              border: "3px solid var(--ink)", borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 44,
            }}>M</div>
          </div>
        );
      case "avatar":
        return (
          <div style={{
            width: 100, height: 100,
            background: item.demoColor || "var(--special)",
            border: "4px solid var(--ink)", borderRadius: 20,
            boxShadow: "5px 5px 0 0 var(--shadow-color)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 56,
            color: item.demoText || "#fff",
            position: "relative", overflow: "hidden",
          }}>
            {item.demoEl || "★"}
          </div>
        );
      case "titulo":
        return (
          <div style={{
            background: item.demoColor || "var(--special)",
            color: item.demoText || "#fff",
            border: "3px solid var(--ink)", borderRadius: 999,
            boxShadow: "4px 4px 0 0 var(--shadow-color)",
            padding: "8px 16px",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14,
            letterSpacing: "-0.005em",
            transform: "rotate(-2deg)",
            textAlign: "center", maxWidth: "90%",
          }}>"{item.name}"</div>
        );
      case "emote":
        return (
          <div style={{
            background: item.demoColor || "var(--warm)",
            border: "3px solid var(--ink)", borderRadius: 16,
            boxShadow: "4px 4px 0 0 var(--shadow-color)",
            padding: "10px 14px",
            transform: animate ? "rotate(-4deg) scale(1.1)" : "rotate(-2deg)",
            transition: "transform 200ms",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13,
            textTransform: "uppercase", letterSpacing: "-0.005em",
            textAlign: "center", maxWidth: 160,
          }}>{item.demoText || item.name}</div>
        );
      case "anim":
        // pulse / spin / flash demo
        return (
          <div style={{
            width: 100, height: 100,
            background: "var(--success)",
            border: "4px solid var(--ink)", borderRadius: 16,
            boxShadow: "4px 4px 0 0 var(--shadow-color)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 44,
            animation: animate ? `${item.anim || "shop-pulse"} 0.8s ease-in-out infinite` : "none",
          }}>+</div>
        );
      case "tema":
        return (
          <div style={{
            width: 160, height: 110,
            background: item.demoColor || "var(--primary)",
            border: "4px solid var(--ink)", borderRadius: 14,
            boxShadow: "5px 5px 0 0 var(--shadow-color)",
            padding: 10,
            display: "flex", flexDirection: "column", gap: 6,
            backgroundImage: item.pattern || "none",
            backgroundSize: item.patternSize || "auto",
          }}>
            <div style={{ height: 12, background: "var(--ink)", borderRadius: 4, width: "60%" }} />
            <div style={{ height: 24, background: "var(--surface)", border: "2.5px solid var(--ink)", borderRadius: 8 }} />
            <div style={{ height: 24, background: "var(--secondary)", border: "2.5px solid var(--ink)", borderRadius: 8 }} />
          </div>
        );
      default:
        return null;
    }
  })();

  return <div style={{ position: "relative" }}>{inner}</div>;
};

/* ============ "COMO VOU FICAR" PANEL ============ */
const _PreviewPanel = ({ hovered, equipped }) => {
  const moldura  = hovered?.kind === "moldura" ? hovered : equipped.moldura;
  const titulo   = hovered?.kind === "titulo"  ? hovered : equipped.titulo;
  const emote    = hovered?.kind === "emote"   ? hovered : equipped.emote;
  const tema     = hovered?.kind === "tema"    ? hovered : equipped.tema;
  const avatarBg = (hovered?.kind === "avatar" ? hovered.demoColor : equipped.avatarBg) || "var(--primary)";

  return (
    <aside style={{
      background: "var(--surface)",
      border: "4px solid var(--ink)", borderRadius: 20,
      boxShadow: "10px 10px 0 0 var(--shadow-color)",
      padding: "20px 20px 24px",
      position: "sticky", top: 24,
      transform: "rotate(0.6deg)",
    }}>
      <div className="sm-label" style={{ marginBottom: 4 }}>como vou ficar</div>
      <div style={{
        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13,
        color: "var(--ink-soft)", marginBottom: 14,
      }}>preview ao vivo</div>

      {/* Themed background plate */}
      <div style={{
        background: tema?.demoColor || "var(--bg)",
        backgroundImage: tema?.pattern || "radial-gradient(circle, #0a0a0a18 1px, transparent 1px)",
        backgroundSize: tema?.patternSize || "16px 16px",
        border: "3px solid var(--ink)", borderRadius: 14,
        padding: 22,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
      }}>
        {/* Frame + avatar */}
        <div style={{
          width: 120, height: 120,
          background: moldura?.demoColor || "var(--primary)",
          border: `5px ${moldura?.border || "solid"} var(--ink)`,
          borderRadius: 18,
          boxShadow: moldura?.shadow || "5px 5px 0 0 var(--shadow-color)",
          padding: 7,
        }}>
          <div style={{
            width: "100%", height: "100%",
            background: avatarBg,
            border: "3px solid var(--ink)", borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 56,
            color: "var(--ink)",
          }}>M</div>
        </div>

        {/* Nickname */}
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 26,
          textTransform: "lowercase", letterSpacing: "-0.02em",
        }}>memi</div>

        {/* Title */}
        <div style={{
          background: titulo?.demoColor || "var(--special)",
          color: titulo?.demoText || "#fff",
          border: "3px solid var(--ink)", borderRadius: 999,
          boxShadow: "3px 3px 0 0 var(--shadow-color)",
          padding: "5px 12px",
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12,
          letterSpacing: "-0.005em",
          transform: "rotate(-1.5deg)",
          textAlign: "center", maxWidth: "95%",
          marginTop: -6,
        }}>"{titulo?.name || "Pessoa que Sempre Chuta Drake"}"</div>

        {/* Emote */}
        <div style={{
          background: emote?.demoColor || "var(--warm)",
          border: "3px solid var(--ink)", borderRadius: 12,
          boxShadow: "3px 3px 0 0 var(--shadow-color)",
          padding: "6px 10px",
          transform: "rotate(2deg)",
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 11,
          textTransform: "uppercase", letterSpacing: "-0.005em",
        }}>{emote?.demoText || emote?.name || "+130 acertou!"}</div>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <SmBadge variant="info">simulando partida</SmBadge>
      </div>
    </aside>
  );
};

/* ============ PURCHASE MODAL ============ */
const _PurchaseModal = ({ item, onClose, onConfirm }) => {
  if (!item) return null;
  const r = RARITY[item.rarity];
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(10,10,10,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--surface)",
        border: "4px solid var(--ink)", borderRadius: 24,
        boxShadow: "12px 12px 0 0 var(--shadow-color)",
        padding: 28,
        maxWidth: 380, width: "100%",
        transform: "rotate(-1deg)",
        textAlign: "center",
        position: "relative",
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <_ItemPreview item={item} animate />
        </div>
        <div className="sm-label" style={{ marginBottom: 4 }}>confirmar compra</div>
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 26,
          textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.1,
        }}>{item.name}</div>
        <div style={{ marginTop: 6, color: "var(--ink-soft)" }}>
          <SmBadge style={{ background: r.color, color: r.text }}>{r.label}</SmBadge>
        </div>
        <div style={{
          marginTop: 20,
          fontFamily: "var(--font-mono)", fontWeight: 700,
          fontSize: 36, fontVariantNumeric: "tabular-nums",
        }}>
          <span style={{ fontSize: 24, verticalAlign: 5, marginRight: 4 }}>$</span>{item.price.toLocaleString("pt-BR")}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "center" }}>
          <SmButton variant="ghost" onClick={onClose}>cancelar</SmButton>
          <SmButton variant="primary" size="lg" onClick={() => onConfirm(item)}>
            comprar
          </SmButton>
        </div>
      </div>
    </div>
  );
};

/* ============ ITEM CATALOG ============ */
const ITEMS = {
  moldura: [
    { id: "m1", kind: "moldura", name: "Disco Riscado",   rarity: "seasonal",  price: 1200, demoColor: "var(--secondary)" },
    { id: "m2", kind: "moldura", name: "Palco Iluminado", rarity: "legendary", price: 2400, demoColor: "var(--primary)", shadow: "0 0 0 4px var(--warm), 4px 4px 0 4px var(--ink)" },
    { id: "m3", kind: "moldura", name: "Holográfica",     rarity: "epic",      price: 1800, demoColor: "var(--info)" },
    { id: "m4", kind: "moldura", name: "Fita Cassete",    rarity: "rare",      price: 600,  demoColor: "var(--warm)" },
    { id: "m5", kind: "moldura", name: "Notebook",        rarity: "common",    price: 200,  demoColor: "#E5E5E5", border: "dashed" },
    { id: "m6", kind: "moldura", name: "Lendária da Casa",rarity: "legendary", price: 5000, demoColor: "var(--primary)", lockedReason: "vença 10 partidas seguidas pra desbloquear" },
  ],
  avatar: [
    { id: "a1", kind: "avatar", name: "Vinil",        rarity: "rare",      price: 400, demoColor: "var(--ink)",       demoText: "#fff", demoEl: "♪" },
    { id: "a2", kind: "avatar", name: "Microfone",    rarity: "common",    price: 150, demoColor: "var(--warm)",      demoText: "var(--ink)", demoEl: "M" },
    { id: "a3", kind: "avatar", name: "Estrela",      rarity: "epic",      price: 1000, demoColor: "var(--special)",  demoText: "#fff", demoEl: "★" },
    { id: "a4", kind: "avatar", name: "Coroa",        rarity: "legendary", price: 2200, demoColor: "var(--primary)",  demoText: "var(--ink)", demoEl: "♛" },
  ],
  titulo: [
    { id: "t1", kind: "titulo", name: "Ouvido de Ouro",          rarity: "legendary", price: 1500, demoColor: "var(--primary)", demoText: "var(--ink)" },
    { id: "t2", kind: "titulo", name: "Caçador de Feat",         rarity: "epic",      price: 900,  demoColor: "var(--special)" },
    { id: "t3", kind: "titulo", name: "Mestre dos 3 Segundos",   rarity: "epic",      price: 1100, demoColor: "var(--info)",    demoText: "var(--ink)" },
    { id: "t4", kind: "titulo", name: "Sem Vergonha Musical",    rarity: "rare",      price: 500,  demoColor: "var(--secondary)" },
    { id: "t5", kind: "titulo", name: "Chutador Profissional",   rarity: "common",    price: 200,  demoColor: "#E5E5E5", demoText: "var(--ink)" },
    { id: "t6", kind: "titulo", name: "Bot de Shazam",           rarity: "seasonal",  price: 1300, demoColor: "var(--secondary)", lockedReason: "use Shazam IRL — não vai dar pra desbloquear, foi mal" },
  ],
  emote: [
    { id: "e1", kind: "emote", name: "Quase, quase",   rarity: "common", price: 100, demoColor: "var(--warm)",    demoText: "quase, quase..." },
    { id: "e2", kind: "emote", name: "Chutou Drake",   rarity: "rare",   price: 350, demoColor: "var(--secondary)", demoText: "DRAKE? sério?" },
    { id: "e3", kind: "emote", name: "Bot de Shazam",  rarity: "epic",   price: 800, demoColor: "var(--special)",   demoText: "+130 EZ" },
    { id: "e4", kind: "emote", name: "Memi triste",    rarity: "rare",   price: 350, demoColor: "var(--info)",      demoText: "tá difícil hein" },
  ],
  anim: [
    { id: "an1", kind: "anim", name: "Pulse",     rarity: "common", price: 200, anim: "shop-pulse" },
    { id: "an2", kind: "anim", name: "Spin",      rarity: "rare",   price: 500, anim: "shop-spin" },
    { id: "an3", kind: "anim", name: "Flash",     rarity: "epic",   price: 900, anim: "shop-flash" },
    { id: "an4", kind: "anim", name: "Slot Machine", rarity: "legendary", price: 1800, anim: "shop-shake" },
  ],
  tema: [
    { id: "th1", kind: "tema", name: "Rádio Pirata",  rarity: "rare",      price: 700, demoColor: "var(--warm)",
      pattern: "repeating-linear-gradient(45deg, #0a0a0a14 0 8px, transparent 8px 16px)", patternSize: "auto" },
    { id: "th2", kind: "tema", name: "Balada 2000",   rarity: "seasonal",  price: 1200, demoColor: "var(--secondary)",
      pattern: "radial-gradient(circle, #FFE60088 0 8px, transparent 9px)", patternSize: "22px 22px" },
    { id: "th3", kind: "tema", name: "Underground",   rarity: "epic",      price: 1400, demoColor: "var(--ink)",
      pattern: "linear-gradient(135deg, #A78BFA66 25%, transparent 25%)", patternSize: "20px 20px" },
    { id: "th4", kind: "tema", name: "K-Pop Hits",    rarity: "legendary", price: 2500, demoColor: "var(--primary)",
      pattern: "radial-gradient(circle, #FF3D7F 0 6px, transparent 7px)", patternSize: "20px 20px",
      lockedReason: "complete 5 partidas no modo Capa Revelada pra desbloquear" },
  ],
};

/* ============ SHOP SCREEN ============ */
const ShopScreen = () => {
  const [cat, setCat] = React.useState("moldura");
  const [hovered, setHovered] = React.useState(null);
  const [purchase, setPurchase] = React.useState(null);
  const [coins, setCoins] = React.useState(2840);

  const [owned, setOwned] = React.useState(new Set(["m4", "a2", "t5", "e1"]));
  const [equipped, setEquipped] = React.useState({
    molduraId: "m4", tituloId: null, emoteId: "e1", temaId: null, avatarId: "a2",
  });

  const equippedItems = {
    moldura: ITEMS.moldura.find(i => i.id === equipped.molduraId),
    titulo:  ITEMS.titulo.find(i => i.id === equipped.tituloId),
    emote:   ITEMS.emote.find(i => i.id === equipped.emoteId),
    tema:    ITEMS.tema.find(i => i.id === equipped.temaId),
    avatarBg: ITEMS.avatar.find(i => i.id === equipped.avatarId)?.demoColor,
  };

  const items = ITEMS[cat];

  const onBuy = (item) => setPurchase(item);
  const onConfirm = (item) => {
    setCoins(c => c - item.price);
    setOwned(s => new Set([...s, item.id]));
    setPurchase(null);
  };
  const onEquip = (item) => {
    setEquipped(e => ({ ...e, [`${item.kind}Id`]: e[`${item.kind}Id`] === item.id ? null : item.id }));
  };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px 100px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div className="sm-label">loja</div>
          <h1 style={{ margin: "6px 0 0", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 56, lineHeight: 1, textTransform: "uppercase", letterSpacing: "-0.04em", transform: "rotate(-1.5deg)", display: "inline-block" }}>
            seja lembrado.
          </h1>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <_Coins value={coins} />
          <button style={{
            padding: "8px 14px", minHeight: 44,
            background: "var(--surface)", color: "var(--ink)",
            border: "3px solid var(--ink)", borderRadius: 999,
            boxShadow: "4px 4px 0 0 var(--shadow-color)",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12,
            letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <Icon name="sparkles" size={14} strokeWidth={3} />
            Vitrine
          </button>
        </div>
      </div>

      {/* Drop banner */}
      <_DropBanner />

      {/* Tabs */}
      <_Tabs active={cat} onChange={setCat} />

      {/* Grid + Preview panel */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 28, alignItems: "start" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {items.map((item, i) => (
            <_ItemCard
              key={item.id}
              item={item}
              index={i}
              owned={owned.has(item.id)}
              equipped={equipped[`${item.kind}Id`] === item.id}
              previewing={hovered?.id === item.id}
              onPreview={setHovered}
              onBuy={onBuy}
              onEquip={onEquip}
            />
          ))}
        </div>

        <_PreviewPanel hovered={hovered} equipped={equippedItems} />
      </div>

      <_PurchaseModal item={purchase} onClose={() => setPurchase(null)} onConfirm={onConfirm} />

      <style>{`
        @keyframes shop-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15) rotate(-3deg); } }
        @keyframes shop-spin  { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        @keyframes shop-flash { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(2.2) hue-rotate(40deg); } }
        @keyframes shop-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px) rotate(-3deg); } 75% { transform: translateX(6px) rotate(3deg); } }
      `}</style>
    </div>
  );
};

Object.assign(window, { ShopScreen });
