/* SOMS — Legal (Privacy / Terms). Lê como conversa, parece documento. */

const _Toc = ({ items, active, onPick }) => (
  <nav style={{
    position: "sticky", top: 24,
    background: "var(--surface)",
    border: "3px solid var(--ink)", borderRadius: 16,
    boxShadow: "6px 6px 0 0 var(--shadow-color)",
    padding: "16px 18px",
  }}>
    <div className="sm-label" style={{ marginBottom: 10 }}>conteúdo</div>
    <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map((it, i) => (
        <li key={it.id}>
          <a href={`#${it.id}`} onClick={(e) => { e.preventDefault(); onPick && onPick(it.id); }} style={{
            display: "flex", gap: 8,
            padding: "8px 10px",
            borderRadius: 8,
            background: active === it.id ? "var(--primary)" : "transparent",
            color: "var(--ink)",
            textDecoration: "none",
            fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600,
          }}>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ink-soft)", minWidth: 22 }}>{String(i+1).padStart(2, "0")}</span>
            {it.title}
          </a>
        </li>
      ))}
    </ol>
  </nav>
);

const _Sec = ({ id, n, title, children }) => (
  <section id={id} style={{
    background: "var(--surface)",
    border: "3px solid var(--ink)", borderRadius: 16,
    boxShadow: "6px 6px 0 0 var(--shadow-color)",
    padding: "26px 28px",
    marginBottom: 22,
  }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
      <span style={{
        fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14,
        background: "var(--ink)", color: "var(--bg)",
        padding: "2px 8px", borderRadius: 6,
        letterSpacing: "0.04em",
      }}>{String(n).padStart(2, "0")}</span>
      <h2 style={{
        margin: 0,
        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22,
        textTransform: "uppercase", letterSpacing: "-0.01em",
      }}>{title}</h2>
    </div>
    <div style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.6, color: "var(--ink)" }}>
      {children}
    </div>
  </section>
);

const LegalScreen = ({ doc = "privacy" }) => {
  const [activeDoc, setActiveDoc] = React.useState(doc);

  const PRIVACY = [
    { id: "p1", title: "o que guardamos",        body: (<>
      apelido, avatar, moedas, badges, títulos, e o histórico das suas partidas (rankings, respostas, tempos). nada além do necessário pro jogo funcionar.
      <br/><br/>
      se você fizer login com google ou discord, guardamos só o id, e-mail e foto que o provider devolve.
    </>)},
    { id: "p2", title: "o que NÃO guardamos",     body: (<>
      <strong>arquivos de áudio</strong>: nenhuma música é baixada ou hospedada por aqui. tudo vem em tempo real do provider (deezer) como preview de 30s.
      <br/><br/>
      <strong>conversas privadas</strong>: a única coisa que você "fala" no jogo são as respostas — e elas viram estatística da partida, não conversa.
    </>)},
    { id: "p3", title: "cookies e similares",     body: (<>
      um cookie HTTP-only mantém sua sessão (convidado ou logada). sem isso o jogo não consegue te reconhecer entre rodadas. não usamos cookies de tracking, ads ou analytics de terceiros no MVP.
    </>)},
    { id: "p4", title: "com quem dividimos",      body: (<>
      ninguém vende seus dados. usamos:
      <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
        <li>vercel / railway pra rodar a aplicação</li>
        <li>neon pro banco</li>
        <li>upstash pra cache de partidas ativas</li>
        <li>deezer / musicbrainz / cover art archive como fontes musicais</li>
      </ul>
    </>)},
    { id: "p5", title: "seus direitos",           body: (<>
      você pode pedir uma cópia dos seus dados ou apagar a conta a qualquer momento. é só mandar e-mail pra <a href="mailto:privacidade@soms.app" style={{ textDecoration: "underline" }}>privacidade@soms.app</a>. respondemos em até 15 dias.
    </>)},
    { id: "p6", title: "menores de idade",         body: <>SOMS é pensado pra maiores de 13 anos. se você é responsável por alguém menor que isso usando o jogo, escreva pra gente e a gente apaga a conta.</> },
  ];

  const TERMS = [
    { id: "t1", title: "isto é um jogo",          body: <>SOMS é um projeto sem fins lucrativos pra jogar música com amigos. nada do que está aqui é serviço comercial, nem promete uptime SLA, nem oferece garantia.</> },
    { id: "t2", title: "uso responsável",         body: (<>
      você concorda em <strong>não</strong>:
      <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
        <li>usar nicknames ofensivos, racistas ou de assédio</li>
        <li>spammar respostas ou tentar travar salas</li>
        <li>fazer engenharia reversa pra contornar limites do servidor</li>
        <li>importar playlists com áudio que você não tem direito de usar</li>
      </ul>
      hosts podem te remover de qualquer sala sem aviso. nós também.
    </>)},
    { id: "t3", title: "música e direitos",       body: (<>
      todo áudio reproduzido vem como preview do provider (deezer). a propriedade é dos artistas e gravadoras originais. SOMS não armazena, redistribui ou monetiza áudio protegido.
      <br/><br/>
      se você é detentor de direitos e quer remover uma faixa do nosso catálogo curado, escreva pra <a href="mailto:dmca@soms.app" style={{ textDecoration: "underline" }}>dmca@soms.app</a>.
    </>)},
    { id: "t4", title: "moedas e cosméticos",     body: <>moedas do jogo não têm valor monetário e não podem ser trocadas por dinheiro de verdade. cosméticos são puramente visuais — nunca alteram pontuação ou regras da partida.</> },
    { id: "t5", title: "mudanças nestes termos",  body: <>se algo aqui mudar, avisamos na home antes da próxima partida que você jogar. continuar usando depois disso significa que você está de boa com a nova versão.</> },
    { id: "t6", title: "lei aplicável",           body: <>esses termos seguem as leis brasileiras. qualquer briga vai pro foro da comarca onde o responsável pelo projeto reside, salvo legislação consumerista em contrário.</> },
  ];

  const docs = activeDoc === "privacy" ? PRIVACY : TERMS;

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 24px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div className="sm-label">documentos legais</div>
        <h1 style={{ margin: "8px 0 6px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 48, lineHeight: 1, textTransform: "uppercase", letterSpacing: "-0.03em" }}>
          O que você precisa saber
        </h1>
        <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: 16 }}>
          versão 0.1 · atualizado em 18 de maio de 2026 · linguagem direta, sem rebuscar.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <button
          onClick={() => setActiveDoc("privacy")}
          style={{
            padding: "10px 18px", minHeight: 44,
            background: activeDoc === "privacy" ? "var(--primary)" : "var(--surface)",
            border: "3px solid var(--ink)", borderRadius: 999,
            boxShadow: "4px 4px 0 0 var(--shadow-color)",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13,
            letterSpacing: "0.02em", textTransform: "uppercase",
            cursor: "pointer",
          }}
        >política de privacidade</button>
        <button
          onClick={() => setActiveDoc("terms")}
          style={{
            padding: "10px 18px", minHeight: 44,
            background: activeDoc === "terms" ? "var(--secondary)" : "var(--surface)",
            color: activeDoc === "terms" ? "#fff" : "var(--ink)",
            border: "3px solid var(--ink)", borderRadius: 999,
            boxShadow: "4px 4px 0 0 var(--shadow-color)",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13,
            letterSpacing: "0.02em", textTransform: "uppercase",
            cursor: "pointer",
          }}
        >termos de uso</button>
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 28, alignItems: "start" }}>
        <_Toc items={docs.map(d => ({ id: d.id, title: d.title }))} active={null} />

        <div>
          {docs.map((s, i) => (
            <_Sec key={s.id} id={s.id} n={i + 1} title={s.title}>{s.body}</_Sec>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, padding: "0 6px", color: "var(--ink-soft)", fontSize: 13 }}>
            <span>dúvidas? <a href="mailto:hello@soms.app" style={{ color: "var(--ink)", textDecoration: "underline" }}>hello@soms.app</a></span>
            <span>SOMS · projeto sem fins lucrativos</span>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { LegalScreen });
