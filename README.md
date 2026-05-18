# SOMS — Design System

> Neobrutalism com pulso musical/festivo.
> Light-first. Mobile-first. Tudo é tangível.
> **Frase guia:** todo mundo acha que sabe.

This is the design system for **SOMS**, a web party-game where players join a room, hear short song clips, race to guess title/artist/feat, and end the match with funny stats, titles, badges, and shareable cards. Spiritual cousins: Gartic, Jackbox, SUS.

---

## Sources

- **Codebase docs (read-only, mounted via File System Access):** `SOMS/`
  - `SOMS/PRD_SOMS.md` — full product spec
  - `SOMS/DESIGN.md` — visual system (this design system is built directly against it)
  - `SOMS/ARCHITECTURE.md` — technical architecture
- **GitHub:** [github.com/luantaraschi/SOMS](https://github.com/luantaraschi/SOMS) — explore the repo for richer context. The repo wasn't directly accessible during the build (private or unreachable from this tool), so all visual decisions here come from the markdown specs above.

---

## Index

```
.
├── README.md                  ← this file
├── SKILL.md                   ← agent skill manifest
├── colors_and_type.css        ← canonical CSS variables (colors + type scale)
├── assets/                    ← logos, marks, generic icons
│   ├── soms-logo.svg          ← horizontal wordmark plate
│   ├── soms-mark.svg          ← square mark (for avatar / favicon)
│   └── icon-vinyl.svg         ← generic vinyl record icon
├── preview/                   ← Design System tab cards (~700px wide)
│   ├── _card.css              ← shared card chrome
│   ├── colors-vibrant.html
│   ├── colors-neutrals.html
│   ├── colors-semantic.html
│   ├── type-display.html / type-body.html / type-mono.html / type-scale.html
│   ├── radii.html / shadows.html / borders.html / spacing.html
│   ├── rotation-rule.html / motion.html
│   ├── buttons.html / inputs.html / badges.html
│   ├── player-cards.html / room-code.html / podium.html / answer-feedback.html
│   ├── logo.html / icons.html / do-dont.html
└── ui_kits/
    └── web_app/               ← single product: the SOMS web app
        ├── README.md
        ├── index.html         ← click-thru: Home → Lobby → Round → Reveal → Pódio → Share
        ├── styles.css
        ├── Primitives.jsx     ← SmButton, SmInput, SmCard, SmAvatar, SmBadge, Icon
        ├── HomeScreen.jsx
        ├── AuthScreen.jsx
        ├── LobbyScreen.jsx
        ├── SettingsScreen.jsx
        ├── GameScreen.jsx
        ├── RevealScreen.jsx
        ├── EndScreen.jsx
        ├── ShareCard.jsx
        ├── ProfileScreen.jsx
        ├── ShopScreen.jsx
        ├── ErrorEmptyScreen.jsx
        └── LegalScreen.jsx
```

---

## CONTENT FUNDAMENTALS

SOMS is **portuguese-brazilian (pt-BR)**. Tone is **casual, irreverent, leve, ligeiramente sacana**. Same energy as a friend group teasing each other in a Discord call.

### Voice

- **Person:** mistura natural de "você" (instrução, tooltip) e **first-person plural informal** (lista de jogadores, narrativa de partida). Não usa "a gente" e nem "nós" formal. Apenas verbos diretos.
- **Casing:** **lowercase é a casa**. Nomes de jogadores, slogans, pequenas frases, textos no jogo — sempre minúsculo ("luan acertou em 1.4s"). **UPPERCASE só para CTAs, badges, títulos display e scores grandes** — i.e., quando a tipografia é Unbounded e o objetivo é grito visual.
- **Sentence length:** muito curto. Fragmentos OK. "Acerte o som. Exponha o grupo." > parágrafos.
- **Emoji:** **não usados na UI**. O brand sustenta o humor através de copy + badges + cores. (PRD menciona emojis apenas como referência cultural, nunca como elemento de interface.)
- **Punctuation:** ponto final em frases curtas é OK. Ponto de exclamação só em momentos de explosão ("VOCÊ ACERTOU!"). Reticências em momentos de tensão ("ouvindo...").

### Slogan & taglines

- **Frase-guia (sempre acompanha o logo):** `todo mundo acha que sabe.`
- **Taglines secundárias autorizadas pelo PRD:**
  - "Chute a música antes dos seus amigos."
  - "Ouça, chute, passe vergonha."
  - "O quiz musical que expõe seu gosto."
  - "Você sabe mesmo ou só chuta Drake?"
  - "Acerte o som. Exponha o grupo."

### Copy patterns por superfície

| Surface | Padrão | Exemplo |
|---|---|---|
| CTA primário | imperativo curto, uppercase, sem ponto | `CRIAR SALA` · `INICIAR PARTIDA` · `ENTRAR` |
| Label de input | substantivo curto, uppercase, tracking aberto | `seu apelido` · `código da sala` |
| Placeholder | instrução leve, lowercase | `acerte o som...` · `ABCD12` |
| Feedback de acerto | grito breve | `VOCÊ ACERTOU!` · `+130` |
| Feedback de quase | constatação resignada | `quase` · `tão perto` |
| Feedback de erro | seco, sem julgamento | `errou` (sem ponto) |
| Stats engraçadas | terceira pessoa + nickname lowercase + fato | `memi chutou Drake em 7 dos 10 rounds.` |
| Títulos desbloqueáveis | pequena humilhação ou elogio exagerado | `Confiante e Errado` · `Ouvido de Ouro` · `Pessoa que Sempre Chuta Drake` |

### O que evitar

- ❌ Frases corporativas ("Bem-vindo à plataforma SOMS!")
- ❌ Marketing speak ("a melhor experiência de quiz musical")
- ❌ Tradução literal de copy em inglês ("Vamos jogar!" formal)
- ❌ Pontuação tensa: "Ué?!", "Sério?!" — não combina com a frieza-da-zoeira do brand
- ❌ Termos infantis ("musiquinha", "joguinho", "amiguinhos")
- ❌ Emoji em copy de UI

---

## VISUAL FOUNDATIONS

The whole system lives in one CSS file: [`colors_and_type.css`](./colors_and_type.css). Import it and use the vars.

### Six principles (from `DESIGN.md`)

1. **Tudo é tangível.** Botões parecem botões, cards parecem cards. Nada flutua. Bordas pretas grossas, sombras duras deslocadas, peso visual claro.
2. **Cor é afirmação, não decoração.** Cada cor tem função semântica (acerto, host, erro, ação). Não pinte por estética.
3. **Tipografia é arquitetura.** Tamanhos contrastantes, display com personalidade nos momentos-chave, body neutro pra leitura rápida.
4. **Movimento é palpável.** Hover desloca, click afunda, acerto explode, erro treme. Springs físicos, não easings longos.
5. **Imperfeição calculada.** Cards rotacionados entre -2° e +2°. Layouts assimétricos. Nunca centrado-justo-demais.
6. **Áreas de toque generosas.** Mínimo 48px em qualquer botão. Inputs grandes.

### Cor

11 tokens. Quem usa: `colors_and_type.css` (CSS vars), `ui_kits/web_app/styles.css` (mesma origem).

| Token | Hex | Função |
|---|---|---|
| `--bg` | `#FFFCF2` | Off-white quente, vibe papel. Background geral. |
| `--surface` | `#FFFFFF` | Cards, modais, elementos elevados. |
| `--ink` | `#0A0A0A` | Texto principal, bordas, sombras (preto verdadeiro). |
| `--ink-soft` | `#3D3D3D` | Texto secundário, labels. |
| `--primary` | `#FFE600` | CTA principal, "luz de palco". |
| `--secondary` | `#FF3D7F` | CTA secundário, momentos importantes. |
| `--success` | `#B8FF1A` | Acerto, posição #1. |
| `--warm` | `#FF9F1C` | "Quase", posição #2, hint. |
| `--info` | `#00E5FF` | Contagem regressiva, timer, info neutra. |
| `--special` | `#A78BFA` | Host, badges raros, regras caóticas. |
| `--danger` | `#FF4D4D` | Erro, kick, encerrar sala. |

**Regras de cor inegociáveis:**

- Texto preto (`--ink`) sobre amarelo, lima, cyan, branco, laranja.
- Texto branco (`#fff`) sobre roxo, vermelho, rosa choque.
- **Nunca** cor sobre cor sem borda preta separando.
- **Máximo 3 cores vibrantes simultâneas por tela** (fora ink/bg).
- Background da maioria das páginas: `--bg`.

### Backgrounds & textura

- Padrão: `--bg` (off-white quente) com **pattern de bolinhas pretas discretas** opacidade ~10% como textura (`radial-gradient(circle, #0a0a0a18 1px, transparent 1px); background-size: 22px 22px`). Usado nas telas principais do UI kit.
- Sem gradientes suaves, sem imagens full-bleed, sem fotografia. A cor chapada é a textura.
- Durante partida, **NÃO** mudar o bg de página por mood — a variação visual vem dos cards (info para timer, success para acerto etc).
- Imagens (capa de álbum, avatares de cosméticos) sempre dentro de **cards com borda 4px e sombra dura** — nunca soltas.

### Tipografia

Três famílias, todas Google Fonts:

| Token | Família | Pesos | Função |
|---|---|---|---|
| `--font-display` | **Unbounded** | 700, 800, 900 | Títulos hero, room code, scores grandes, badges, CTAs |
| `--font-body` | **Inter** | 400, 500, 700 | Parágrafos, labels, inputs, texto corrido |
| `--font-mono` | **JetBrains Mono** | 500, 700 | Timer, código da sala, dados técnicos |

**Substituições / origem:** os três famílias são Google Fonts gratuitas e nenhum arquivo foi entregue. `colors_and_type.css` carrega tudo via `@import` do CSS do Google Fonts. Se o produto migrar para `next/font` em produção (recomendado para zero CLS), copiar os mesmos pesos.

**Regras de tipografia:**

- Display: **sempre uppercase** em CTAs, badges, scores; `letter-spacing: -0.02em` (tight).
- Body: nunca uppercase em parágrafos.
- Numerais de score: display com `font-variant-numeric: tabular-nums`.
- Truncar nicknames longos com `text-overflow: ellipsis` mas dar pelo menos 16 chars antes de cortar.

Veja escala em `preview/type-scale.html`.

### Spacing & layout

- Base 4. Favoreça múltiplos de 8 (8, 16, 24, 32, 48, 64).
- Padding interno de cards: **24–32px**.
- Respiro entre seções: **48–64px**.
- Layouts **nunca centralizam-tudo-no-eixo-X-de-forma-perfeita**. Aceite assimetria — um card alinhado à esquerda, outro tilt à direita.
- Mobile-first. Grid colapsa para coluna única abaixo de ~640px.

### Bordas, sombras, raios

| | Valor | Quando |
|---|---|---|
| **Border interativo** | `3px solid var(--ink)` | botões, inputs, cards de player |
| **Border hero** | `4px solid var(--ink)` | room code, pódio 1º lugar, modais |
| **Border-radius** | 8 / 12 / 16 / 24 | chips · botões · cards · heroes (`--radius-sm/md/lg/xl`) |
| **Border-radius zero** | — | **não use** — vira retrô brutalist em vez de moderno |
| **Shadow** | `Xpx Xpx 0 0 var(--ink)` | **sempre** hard, deslocada para baixo-direita, **zero blur** |

Escala de sombra: 3 → 6 → 8 → 12 px. Veja `preview/shadows.html`. Se você vir `blur`, está errado.

**Não existe** sombra interna, sombra com cor, ou sombra com offset negativo no sistema. Só hard outer shadow para baixo-direita.

### Hover / press / focus

| Estado | Efeito | Implementação |
|---|---|---|
| **Hover** em interativo | empurra +3px / +3px, sombra encolhe de 6 → 3 | `transform: translate(3px,3px); box-shadow: 3px 3px 0 0 var(--ink)` |
| **Active / tap** | afunda totalmente +6px / +6px, sombra vai a 0 | `transform: translate(6px,6px); box-shadow: 0 0 0 0 var(--ink)` |
| **Focus** em input | afunda +3px / +3px, sombra encolhe | mesmo padrão do hover |
| **Disabled** | sombra some, opacity 0.5, cursor not-allowed | sem transform |

Nenhum estado usa mudança de cor (mais escuro / mais claro). O movimento é o sinal.

### Animação

Toda animação usa **spring physics** (Framer Motion), não duration easing.

- **Entrada de cards em lista:** `scale 0→1` + `rotate -8°→ ±1.5°` + spring `stiffness 200 damping 14`.
- **Acerto:** scale-pop `[1, 1.25, 1]` + rotate `[-3°, 3°, 0°]`, 400ms.
- **Erro:** shake horizontal `[-8px, +8px, -8px, +8px, 0]`, 300ms.
- **Confetti** no pódio via `canvas-confetti` com paleta `[#FFE600, #FF3D7F, #B8FF1A, #00E5FF, #A78BFA]`.
- **Princípio geral:** cards **não ficam parados**. Cada card tem rotação base sutil -2°/+2°, alternando por index (`index % 2 === 0 ? -1.5 : 1.5`).

Ver demos em `preview/motion.html` e `preview/rotation-rule.html`.

### Transparência & blur

- **Não usados.** Cores chapadas resolvem tudo.
- Única exceção: overlay de modal pode usar `rgba(10,10,10,0.4)` como backdrop, mas o modal em si é sólido.
- Glassmorphism, frosted glass, blur de fundo → **não fazem parte do brand**.

### Cards — anatomia padrão

Todo card segue:

```
border: 3px solid #0A0A0A      ← ou 4px se for hero
border-radius: 12 a 24px
box-shadow: 6px 6px 0 0 #0A0A0A   ← Hard, deslocada
background: cor chapada (surface, primary, secondary, etc)
padding: 24–32px
transform: rotate(±1.5° a ±2°)    ← alternando por index
```

Veja `preview/player-cards.html` para a forma canônica.

### Cor das imagens

- **Não há fotografias.** As únicas imagens são:
  - Capas de álbum (vêm de Cover Art Archive / Deezer — sempre dentro de card 4px border)
  - Avatares de jogador (iniciais coloridas em quadrado neobrutalist por padrão)
  - Cosméticos (futuros, ilustrações que sigam o sistema)
- Capas exibidas como vêm — **sem filtro, sem grain, sem b&w**.

### Layout rules / elementos fixos

- **Hero** (room code, scores grandes) deslocado do centro com rotação leve.
- **CTA de iniciar partida** (host) fica sticky-bottom em mobile, posição normal em desktop.
- **Timer** fica fixo no topo durante a partida (não scroll).
- **Live feed** de respostas: nova resposta entra com bounce, antigas saem opacity 0 + scale 0.95 quando excedem 5 visíveis.

---

## ICONOGRAPHY

- **Biblioteca canônica:** [`lucide-react`](https://lucide.dev/) (npm: `lucide-react`).
- **Stroke width:** `2.5` ou `3`. O default `2` é fino demais para neobrutalism.
- **Tamanhos:**
  - Em badges: 14–16px
  - Em botões: 20–24px
  - Inline com texto: 18–20px
  - Hero / feature: 32–48px
- **Cor:** herda do `currentColor` (mesma cor do texto onde o ícone aparece). Nunca ícone em cor independente do contexto.

**Substituição neste design system:** as SVGs de ícone em `preview/icons.html` e dentro de `ui_kits/web_app/Primitives.jsx` (`ICONS`) são **recreações leves dos paths do Lucide**, embutidas como inline SVG para evitar dependência de runtime no kit. Em produção use o pacote real (`import { Music, Crown, Zap } from "lucide-react"`).

**Ícones essenciais para SOMS** (do `DESIGN.md`):

`Music` · `Crown` (host) · `Zap` (acerto rápido) · `Headphones` · `Play` · `Pause` · `Users` · `Trophy` · `Sparkles` · `Skull` (Sala Caótica) · `Volume2`

### Outros usos

- **Emoji:** **não usados na UI**. Só aparecem como string em respostas de jogador (ex.: alguém digita 🎵 no chute). Nunca como ícone funcional.
- **Unicode chars como ícone:** não usados — sempre SVG.
- **PNG icons:** evitar — todos os ícones do brand são SVG vetorial, escalam para qualquer tamanho.

### Brand assets em `assets/`

- `soms-logo.svg` — wordmark horizontal completo com plate amarela.
- `soms-mark.svg` — versão quadrada (favicon, avatar de host).
- `icon-vinyl.svg` — ícone genérico para placeholder de música/álbum.

---

## UI Kit

Um único produto:

- **`ui_kits/web_app/`** — recreação click-thru da app web (Next.js 15 + Tailwind v4 + Framer Motion no produto real). Abra `index.html` e use a nav no topo para passar por **Home → Lobby → Round → Reveal → Pódio → Share**.

Detalhes em [`ui_kits/web_app/README.md`](./ui_kits/web_app/README.md).

> O kit existe para fidelidade visual. Implementação real usa shadcn/ui customizado + Framer Motion + WebSocket — ver `SOMS/ARCHITECTURE.md` no codebase.

---

## Caveats / open questions

- **Fonts:** Unbounded / Inter / JetBrains Mono são todas Google Fonts gratuitas. Nenhum arquivo `.ttf` ou `.woff2` foi entregue — o `colors_and_type.css` puxa do Google. Se você precisa hospedar localmente (offline, ou perf crítica), baixe os pesos especificados e referencie via `@font-face`.
- **Logo:** o brand não entregou uma marca formal — `assets/soms-logo.svg` é uma interpretação do wordmark conforme `DESIGN.md` (Unbounded 900 em chapa amarela com ponto rosa "note head"). Substitua quando houver versão oficial.
- **Imagens reais:** não há fotos, ilustrações, cosméticos finais. A capa do álbum na tela de Reveal é um placeholder colorido com listras diagonais.
- **GitHub repo:** [github.com/luantaraschi/SOMS](https://github.com/luantaraschi/SOMS) não respondeu durante a build deste sistema (provavelmente privado ou movido). Toda a verdade visual veio dos três `.md` em `SOMS/`. Reabra esses arquivos se quiser corrigir tokens ou alinhar com mudanças do produto.
- **Dark mode:** **shipped** with the system, paired light-first. Strategy documented below in [Dark mode](#dark-mode).

---

## Dark mode — palco iluminado à noite

Dark mode liga via `<html data-theme="dark">` (ou em qualquer ancestral). Os tokens em `colors_and_type.css` se reescrevem automaticamente — sem necessidade de mudar componentes. Os ajustes vivem em um único bloco `[data-theme="dark"] { ... }` no CSS.

### Princípio

> As cores vibrantes são as luzes do palco — devem brilhar, não competir. O fundo é o teatro, o ink são as marcas do cenário, e as sombras coloridas são o rastro de neon que cada elemento deixa.

### O que muda

| Token | Light | Dark | Por quê |
|---|---|---|---|
| `--bg`       | `#FFFCF2` (cream) | `#110A1F` (deep theater purple-black) | Fundo de teatro à noite, não preto puro |
| `--surface`  | `#FFFFFF` | `#1E1432` | Card / elevação primeira |
| `--ink`      | `#0A0A0A` | `#FFFCF2` | Cream warm para texto + bordas |
| `--ink-soft` | `#3D3D3D` | `#C8BDD9` | Muted purple-grey, brilhante o suficiente pra ser legível |
| `--primary`  | `#FFE600` | `#FFD60A` | Amarelo um pouco mais quente / dessaturado |
| `--secondary`| `#FF3D7F` | `#FF5C9A` | Rosa mais legível em fundo escuro |
| `--special`  | `#A78BFA` | `#BFA5FF` | Lavanda mais clara |
| `--shadow-color` | `var(--ink)` (preto) | `#FF3D7F` (rosa neon) | **O rastro de neon — assinatura dark** |
| `--success` / `--warm` / `--info` / `--danger` | — | levemente dessaturadas 10–15% | Conforme DESIGN.md §13 |

### O que NÃO muda

- Estrutura: mesma assimetria, mesmas rotações -2°/+2°, mesmos pesos visuais.
- Bordas: continuam de 3–4px, sempre `var(--ink)` (preto em light, cream em dark).
- Tipografia: mesma escala, mesmo Unbounded + Inter + JetBrains Mono.
- `--on-primary` / `--on-success` etc: **continuam dark** mesmo em dark mode — texto preto sobre amarelo / lima / cyan / laranja, branco sobre roxo / vermelho / rosa.

### O detalhe principal — neon shadow

A maior diferença entre light e dark é a sombra. Em vez de `Xpx Xpx 0 0 black`, dark usa `Xpx Xpx 0 0 #FF3D7F` (rosa choque). Cada card, botão e badge fica com um rastro fluorescente como se fosse o letreiro de um palco. **Use `var(--shadow-color)` em vez de `var(--ink)` no slot de cor da sombra** — tudo o resto continua igual.

```css
/* sempre assim */
box-shadow: 6px 6px 0 0 var(--shadow-color);

/* nunca assim */
box-shadow: 6px 6px 0 0 var(--ink);     /* ❌ não vira neon em dark */
box-shadow: 6px 6px 0 0 #0A0A0A;        /* ❌ idem */
```

### Garantindo contraste dentro de cards coloridos

Texto preto sobre amarelo continua preto mesmo em dark. Isso é garantido por uma regra de _re-escopo_ em `colors_and_type.css`:

```css
[style*="var(--primary)"][style*="background"],
[style*="var(--success)"][style*="background"],
[style*="var(--warm)"][style*="background"],
[style*="var(--info)"][style*="background"],
.on-light,
.sm-btn--primary,
.sm-btn--success,
.nav-btn.active {
  --ink: #0A0A0A;
  --ink-soft: #3D3D3D;
  color: var(--ink);
}
```

Qualquer container pintado com uma cor "clara" (primary / success / warm / info) ou marcado com `class="on-light"` reescreve `--ink` e `--ink-soft` para valores estáveis dark, **mesmo em dark mode**. Filhos que usam `color: var(--ink)` ou `color: var(--ink-soft)` automaticamente ganham texto preto/muted-grey. Se você criar um componente novo com bg de cor "clara" via classe CSS (não inline), adicione a classe ao seletor acima ou ponha `class="on-light"` no container.

### Mudança técnica importante

A maioria das embeddings/preview wrappers **força um background no `<body>`** que CSS normal não consegue sobrescrever. Por isso o page-bg do UI kit vai num wrapper `.app-shell` em vez do body:

```jsx
<div className="app-shell">
  <div className="stage">
    {/* tudo aqui */}
  </div>
</div>
```

`.app-shell` carrega `background-color: var(--bg)`, o pattern de bolinhas e `min-height: 100vh`. Em produção (Next.js sem wrapper hostil), você pode mover isso de volta pro `<body>` se preferir.

---

## Como instruir o agente

Cole esta linha em qualquer prompt que precise produzir UI do SOMS:

> Aplique os tokens em `colors_and_type.css`. Borda 3-4px preta, sombras duras `Xpx Xpx 0 0 black` (nunca `shadow-md` do Tailwind), raio 8–16px, font-display Unbounded uppercase tracking-tight, font-body Inter. Hover/tap empurra `x/y +3/+6` com sombra encolhendo. Aceite rotações leves -2° a 2° em cards alternando por index. Mobile-first com áreas de toque ≥ 48px. Lowercase em copy; UPPERCASE só em CTAs/badges/scores display. Nunca emoji em UI.
