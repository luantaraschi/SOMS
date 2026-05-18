# DESIGN: SOMS

Sistema visual completo para o SOMS. **Esta é a única fonte de verdade de design.** Qualquer token, regra ou snippet aqui deve estar espelhado em [`tokens.css`](../../packages/design-system/tokens.css) (implementação CSS runtime canônica) e no UI kit em [`ui_kits/web_app/`](../../packages/design-system/ui_kits/web_app/). Atualize este documento **primeiro**, depois propague para o CSS e os kits. Quando pedir nova UI pro Claude Code, anexe este arquivo ao prompt.

> **Voz, copy e content fundamentals** vivem em [`README.md`](../../packages/design-system/README.md) do design system (seção CONTENT FUNDAMENTALS) — DESIGN.md cobre apenas a camada visual/interação.

**Direção:** Neobrutalism com pulso musical/festivo.
**Modo:** Light-first + **dark mode shipped** (toggle via `<html data-theme="dark">`). Em dark, sombras viram rosa neon — assinatura visual. Ver §13.
**Plataforma alvo:** Mobile-first (a maioria vai jogar no celular durante calls), desktop como cidadão de primeira classe.

---

## 1. Princípios

1. **Tudo é tangível.** Botões parecem botões. Cards parecem cards. Nada flutua. Bordas pretas grossas, sombras duras deslocadas, peso visual claro.
2. **Cor é afirmação, não decoração.** Cada cor tem função semântica: acerto, host, erro, ação. Não pinte por estética.
3. **Tipografia é arquitetura.** Tamanhos contrastantes, display com personalidade em momentos-chave, body neutro pra leitura rápida.
4. **Movimento é palpável.** Hover desloca, click afunda, acerto explode, erro treme. Springs físicos, não easings longos.
5. **Imperfeição calculada.** Cards rotacionados entre -2° e 2°. Layouts assimétricos. Nunca centrado-justo-demais.
6. **Áreas de toque generosas.** Botões com altura mínima 48px. Inputs grandes. Tap targets confortáveis pra responder rápido.

---

## 2. Paleta

Cores como nomes semânticos, não como amarelo-500. Cada uma com hex e propósito claro.

### Tokens base (neutros)

| Token | Hex | Onde usar |
|---|---|---|
| `--bg` | `#FFFCF2` | Background geral (off-white quente, vibe papel) |
| `--surface` | `#FFFFFF` | Cards, modais, primeira elevação |
| `--surface-2` | `#F4F1E6` | Segunda elevação: hover de card, fundo de modal aninhado |
| `--ink` | `#0A0A0A` | Texto principal, bordas (preto verdadeiro). Resolve via `--ink-base` e é re-escopado por container — ver §13. |
| `--ink-soft` | `#3D3D3D` | Texto secundário, labels |

### Tokens vibrantes (semânticos)

| Token | Hex | Onde usar |
|---|---|---|
| `--primary` | `#FFE600` | CTA principal, destaque "luz de palco" |
| `--secondary` | `#FF3D7F` | CTA secundário, momentos importantes |
| `--success` | `#B8FF1A` | Acerto, posição #1, feedback positivo |
| `--warm` | `#FF9F1C` | "Quase", posição #2, hint |
| `--info` | `#00E5FF` | Contagem regressiva, timer, info neutra |
| `--special` | `#A78BFA` | Host, badges raros, regras caóticas |
| `--danger` | `#FF4D4D` | Erro, kick, encerrar sala |

### Tokens de contraste (texto sobre cor)

Cada cor vibrante tem um par `--on-*` para texto sobreposto. Use estes em vez de hardcodar preto/branco — eles permanecem corretos mesmo em dark mode (ver §13).

| Token | Valor | Sobre qual cor |
|---|---|---|
| `--on-primary` | `var(--ink)` (preto) | `--primary` (amarelo) |
| `--on-secondary` | `#FFFFFF` (branco) | `--secondary` (rosa) |
| `--on-success` | `var(--ink)` | `--success` (lima) |
| `--on-warm` | `var(--ink)` | `--warm` (laranja) |
| `--on-info` | `var(--ink)` | `--info` (cyan) |
| `--on-special` | `#FFFFFF` | `--special` (roxo) |
| `--on-danger` | `#FFFFFF` | `--danger` (vermelho) |

### Regras de cor

- Texto **preto** sobre amarelo, verde lima, cyan, branco, laranja
- Texto **branco** sobre roxo, vermelho, rosa choque
- Nunca cor sobre cor sem borda preta separando
- Máximo **3 cores vibrantes simultâneas** em uma tela (fora o ink/bg)
- Background da maioria das páginas: `--bg`. Durante partida, pode-se usar variações por mood (ver seção 9)

---

## 3. Tipografia

Três famílias, todas Google Fonts.

**Mecanismo de carregamento:**
- **Produção (Next.js):** via `next/font/google` — zero CLS, performance ótima. Ver §8.
- **Design system estático (`tokens.css`):** via `@import` do Google Fonts CSS — funcional para previews/protótipos, inferior em CLS.

| Token | Família | Pesos | Onde usar |
|---|---|---|---|
| `--font-display` | **Unbounded** | 700, 800, 900 | Títulos hero, room code, scores grandes, badges, CTAs |
| `--font-body` | **Inter** | 400, 500, 700 | Parágrafos, labels, inputs, texto corrido |
| `--font-mono` | **JetBrains Mono** | 500, 700 | Timer, código da sala em contexto secundário, dados técnicos |

### Escala (responsive: mobile / desktop)

| Token | Mobile | Desktop | Implementação | Uso típico |
|---|---:|---:|---|---|
| `--text-mega` | 64px | 96px | `clamp(64px, 8vw, 96px)` | Score gigante, room code hero |
| `--text-display` | 48px | 72px | `clamp(48px, 6vw, 72px)` | "VOCÊ ACERTOU!", título de tela de fim |
| `--text-h1` | 32px | 48px | `clamp(32px, 4vw, 48px)` | Título de tela |
| `--text-h2` | 24px | 32px | `clamp(24px, 3vw, 32px)` | Seção dentro de tela |
| `--text-h3` | 20px | 24px | `clamp(20px, 2.2vw, 24px)` | Subtítulo, card de player |
| `--text-lg` | 18px | 18px | `18px` | Body destacado |
| `--text-base` | 16px | 16px | `16px` | Body padrão |
| `--text-sm` | 14px | 14px | `14px` | Labels, captions, ajuda |
| `--text-xs` | 12px | 12px | `12px` | Microlabels, captions densas, metadata |

### Classes utilitárias

`tokens.css` exporta classes drop-in para os estilos canônicos. Use em protótipos HTML; em produção React, prefira componentes tipados que apliquem os mesmos tokens.

`.t-mega` · `.t-display` · `.t-h1` · `.t-h2` · `.t-h3` · `.t-lg` · `.t-body` · `.t-label` · `.t-caption` · `.t-mono` · `.t-slogan`

### Regras de tipografia

- Display: **sempre uppercase** em CTAs, badges, scores. Sempre `letter-spacing: -0.02em` (tight).
- Body: nunca uppercase em parágrafos.
- Numerais de score: `--font-display`, com `font-variant-numeric: tabular-nums` (alinhamento estável quando atualiza). Use a classe `.tabular` exportada pelo CSS.
- Truncar nicknames longos com `text-overflow: ellipsis`, mas dar pelo menos 16 chars antes de cortar.

---

## 4. Tokens fundamentais

### Bordas

| Token | Valor | Aplicação |
|---|---:|---|
| `--border-w` | 3px | Elementos interativos (botões, inputs, cards de player) |
| `--border-hero` | 4px | Elementos hero (room code, pódio, modal principal) |

Cor sempre `var(--ink)` (preto em light, cream em dark — automático via theme-aware ink). Nunca borda cinza, nunca 1px.

### Border-radius

| Token | Valor | Aplicação |
|---|---:|---|
| `--radius-sm` | 8px | Inputs pequenos, badges, chips |
| `--radius-md` | 12px | Botões, cards de feedback |
| `--radius-lg` | 16px | Cards de player, cards do lobby |
| `--radius-xl` | 24px | Modais, telas hero, room code |

Raio zero **não** se usa — vira retrô brutalist em vez de moderno.

### Sombras (duras, deslocadas, nunca desfocadas)

| Token | Valor | Aplicação |
|---|---|---|
| `--shadow-sm` | `3px 3px 0 0 var(--shadow-color)` | Inputs, chips |
| `--shadow-md` | `6px 6px 0 0 var(--shadow-color)` | Botões, cards padrão |
| `--shadow-lg` | `8px 8px 0 0 var(--shadow-color)` | Cards importantes, modais |
| `--shadow-xl` | `12px 12px 0 0 var(--shadow-color)` | Hero (room code, pódio) |
| `--shadow-md-press` | `3px 3px 0 0 var(--shadow-color)` | Estado pressed de `--shadow-md` |
| `--shadow-lg-press` | `4px 4px 0 0 var(--shadow-color)` | Estado pressed de `--shadow-lg` |

**Regra de ouro:** `box-shadow: Xpx Xpx 0 0 var(--shadow-color)`. `--shadow-color` resolve para `var(--ink)` (preto) em light e `#FF3D7F` (rosa neon) em dark — **nunca hardcode preto**, ou a sombra não vira neon em dark. Se você vir blur (`shadow-md` padrão do Tailwind), está errado.

### Spacing

Base 4. Escala completa formalizada em `tokens.css`:

| Token | Valor |
|---|---:|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-12` | 48px |
| `--space-16` | 64px |

Para padrões recorrentes:

| Token | Valor | Onde |
|---|---:|---|
| `--pad-card` | 24px | Padding interno padrão de card. Cards "hero" densos podem chegar a 32px usando `--space-8`. |
| `--gap-section` | 48px | Respiro padrão entre seções de tela |
| `--tap-min` | 48px | Altura mínima de qualquer elemento clicável (botões, inputs, links touch) |

---

## 5. Animação (Framer Motion)

Todas as animações usam **spring physics**, não duration easing.

> ⚠️ **Theme-aware:** sombras devem usar `var(--shadow-color)`, não hex. Framer Motion não anima entre valores `var(...)` suavemente — por isso, para **hover/tap**, faça o **transform via Framer Motion** e a **mudança de shadow via CSS transition** (o CSS resolve a var corretamente em light/dark). Para entrada/explosão/erro, Framer Motion sozinho está OK porque a shadow não muda.

### Hover em elementos interativos
```tsx
// Framer Motion: só transform. Shadow muda via CSS.
<motion.button
  whileHover={{ x: 3, y: 3 }}
  whileTap={{ x: 6, y: 6 }}
  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
  className="btn-hard"
/>
```
```css
.btn-hard {
  box-shadow: var(--shadow-md);
  transition: box-shadow 0.12s ease;
}
.btn-hard:hover  { box-shadow: var(--shadow-md-press); }  /* 6px → 3px */
.btn-hard:active { box-shadow: 0 0 0 0 var(--shadow-color); } /* 3px → 0 */
```

### Entrada de elementos em lista (players no lobby)
```tsx
initial={{ scale: 0, rotate: -10, opacity: 0 }}
animate={{ scale: 1, rotate: -1.5, opacity: 1 }}
transition={{ type: 'spring', stiffness: 200, damping: 14 }}
```

### Acerto (explosão de score)
```tsx
animate={{ scale: [1, 1.25, 1], rotate: [-3, 3, 0] }}
transition={{ duration: 0.4, ease: 'easeOut' }}
```

### Erro (shake horizontal)
```tsx
animate={{ x: [-8, 8, -8, 8, 0] }}
transition={{ duration: 0.3 }}
```

### Confetti no pódio
Biblioteca: `canvas-confetti`. Dispara no mount do componente de pódio, com paleta `[#FFE600, #FF3D7F, #B8FF1A, #00E5FF, #A78BFA]`.

### Princípio geral

Cards **não** ficam parados. Cada card tem rotação base sutil entre -2° e 2°, alternando por index na lista. Use modulo: `index % 2 === 0 ? -1.5 : 1.5`.

---

## 6. Componentes-chave (exemplos)

### Button

```tsx
// Variantes: primary, secondary, success, ghost, danger
<motion.button
  whileHover={{ x: 3, y: 3 }}
  whileTap={{ x: 6, y: 6 }}
  className="
    px-6 py-3 min-h-[48px]
    border-[3px] border-ink rounded-[12px]
    bg-primary text-ink
    font-display font-bold uppercase tracking-tight text-base
    shadow-[6px_6px_0_0_var(--shadow-color)]
    hover:shadow-[3px_3px_0_0_var(--shadow-color)]
    active:shadow-none
    transition-shadow duration-100
  "
>
  Criar sala
</motion.button>
```

### Card de player no lobby

```tsx
<motion.div
  initial={{ scale: 0, rotate: -8 }}
  animate={{ scale: 1, rotate: index % 2 === 0 ? -1.5 : 1.5 }}
  className="
    flex items-center gap-3
    bg-surface border-[3px] border-ink rounded-[16px]
    px-4 py-3
    shadow-[6px_6px_0_0_var(--shadow-color)]
  "
>
  <Avatar />
  <span className="font-display font-bold text-h3 truncate">{nickname}</span>
  {isHost && <HostBadge />}
</motion.div>
```

### Room code hero

```tsx
<div className="
  bg-primary border-[4px] border-ink rounded-[24px]
  p-8 text-center
  shadow-[12px_12px_0_0_var(--shadow-color)]
  rotate-[-1deg]
">
  <p className="font-body text-sm uppercase tracking-[0.2em] text-ink-soft mb-2">
    Código da sala
  </p>
  <p className="font-mono font-bold text-mega text-ink tracking-tight tabular-nums">
    ABCD12
  </p>
</div>
```

### Input

```tsx
<input
  className="
    w-full min-h-[52px]
    px-4 py-3
    bg-surface border-[3px] border-ink rounded-[12px]
    font-body text-lg text-ink
    placeholder:text-ink-soft
    shadow-[4px_4px_0_0_var(--shadow-color)]
    focus:outline-none
    focus:translate-x-1 focus:translate-y-1
    focus:shadow-[2px_2px_0_0_var(--shadow-color)]
    transition-all duration-100
  "
  placeholder="Seu apelido..."
/>
```

### Badge (host, status, regra especial)

```tsx
<span className="
  inline-flex items-center gap-1
  bg-special border-[2px] border-ink rounded-full
  px-3 py-1
  font-display font-bold uppercase text-xs text-ink
  shadow-[2px_2px_0_0_var(--shadow-color)]
">
  <Crown size={14} strokeWidth={3} /> Host
</span>
```

### Score display (final/durante)

```tsx
<div className="
  bg-success border-[4px] border-ink rounded-[16px]
  p-6 text-center
  shadow-[8px_8px_0_0_var(--shadow-color)]
  rotate-[1deg]
">
  <p className="font-body text-sm uppercase tracking-wider text-ink-soft">Pontos</p>
  <p className="font-display font-black text-mega text-ink tabular-nums">
    1.240
  </p>
</div>
```

---

## 7. Iconografia

- Biblioteca: **lucide-react**
- Sempre `strokeWidth={2.5}` ou `strokeWidth={3}` (default 2 é fino demais pra neobrutalism)
- Tamanhos:
  - Em badges: 14-16px
  - Em botões: 20-24px
  - Inline com texto: 18-20px
  - Hero/feature: 32-48px

Ícones úteis pra SOMS: `Music`, `Crown` (host), `Zap` (acerto rápido), `Headphones`, `Play`, `Pause`, `Users`, `Trophy`, `Sparkles`, `Skull` (Sala Caótica), `Volume2`.

---

## 8. Setup no Next.js

**Princípio:** `tokens.css` é a fonte canônica. O app o importa e adiciona apenas os aliases que o Tailwind v4 exige para gerar utility classes (`bg-X`, `text-X`).

### `app/layout.tsx`

```tsx
import { Inter, Unbounded, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});
const unbounded = Unbounded({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-display',
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-mono',
});

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${unbounded.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
```

> Body styling (`background`, `color`, `font-family`) já vem aplicado por `tokens.css`. Não duplicar.

### `app/globals.css` (Tailwind v4)

```css
/* 1. Tokens canônicos do design system — fonte única de verdade */
@import '@soms/design-system/tokens.css';

/* 2. Tailwind core */
@import 'tailwindcss';

/* 3. Aliases para o Tailwind v4 gerar utility classes (bg-primary, text-ink, etc) */
@theme inline {
  --color-bg:         var(--bg);
  --color-surface:    var(--surface);
  --color-surface-2:  var(--surface-2);
  --color-ink:        var(--ink);
  --color-ink-soft:   var(--ink-soft);
  --color-primary:    var(--primary);
  --color-secondary:  var(--secondary);
  --color-success:    var(--success);
  --color-warm:       var(--warm);
  --color-info:       var(--info);
  --color-special:    var(--special);
  --color-danger:     var(--danger);
}

/* 4. Border utilities que Tailwind v4 não gera por padrão */
@utility border-3 { border-width: 3px; }
@utility border-4 { border-width: 4px; }
```

**Por que esse split:**
- **Tokens crus** (`--bg`, `--ink`, `--primary`) vivem em `tokens.css` — incluem light, dark e ink re-scoping. Single source of truth.
- **Aliases `--color-*`** só existem no app porque é assim que o Tailwind v4 expõe utility classes (`bg-bg`, `text-ink`). São ponteiros, não duplicações.
- **Radii, text scale e spacing** (`--radius-*`, `--text-*`, `--space-*`) seguem namespaces nativos do Tailwind v4 — basta estarem definidos em `tokens.css`, são picked up automaticamente.

### Dark mode toggle

```tsx
'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    <button onClick={() => setTheme(t => (t === 'light' ? 'dark' : 'light'))}>
      {theme === 'light' ? <Moon strokeWidth={3} /> : <Sun strokeWidth={3} />}
    </button>
  );
}
```

Persistir em `localStorage` se quiser preferência sticky entre sessões.

---

## 9. Aplicação por tela

### Home (`/`)

- Background: `--bg`. Pode-se aplicar pattern de bolinhas pretas discretas (`bg-[radial-gradient...]`) pra textura.
- Título "SOMS" em font-display tamanho mega, rotacionado -2°, com sombra xl
- Slogan "todo mundo acha que sabe." abaixo, em font-body italic
- Card central com inputs (nickname + código de sala) e dois CTAs:
  - **Criar sala** — botão primary (amarelo)
  - **Entrar** — botão secondary (rosa)
- Footer minimalista com "feito pra ouvir com amigos"

### Lobby (`/sala/[code]`)

- Topo: card hero do room code (amarelo, 12px shadow, rotação -1°)
- Esquerda/centro: grid de cards de player com rotações alternadas
- Direita (desktop) / abaixo (mobile): card de configurações da sala
- Inferior: botão "Iniciar partida" gigante e sticky (visível só pro host)
- Animação: novos players entram com spring (scale 0 → 1, rotate -10° → -1.5°)

### Partida (`/sala/[code]/jogar`)

- Topo: barra de progresso do timer (verde lima quando >50%, laranja 25-50%, vermelho <25%) + "Round 3/10"
- Centro: player de áudio (visualização de waveform animada se possível; placeholder com ícone Music girando)
- Abaixo: **input gigante de resposta** com font-body text-lg, ocupando largura quase total
- Lateral (desktop) / abaixo (mobile): feed de respostas correta em tempo real, cada uma entrando com bounce
- Pequeno ranking lateral mostrando top 3 atual

### Reveal (entre rounds)

- Capa do álbum em card 4px de borda, sombra xl, rotação -1°, no centro
- Título e artista em font-display
- Lista lateral de pontos ganhos no round, com animação de contagem (rolling number)
- Botão "Próximo round" pro host, sticky

### Final / Pódio (`/sala/[code]/fim`)

- Confetti dispara no mount
- Top 3 em cards rotacionados e em tamanhos diferentes (1° maior, gira -2°; 2° médio, gira 2°; 3° menor, gira -1.5°)
- Posição 1: card amarelo + ícone Trophy gigante
- Posição 2: rosa, Posição 3: cyan
- Lista completa abaixo dos top 3
- Estatísticas engraçadas em cards menores ("Memi chutou Drake em 7 dos 10 rounds")
- Botões: "Jogar de novo" (host), "Compartilhar pódio" (gera card), "Sair"

### Cards compartilháveis

- Formato 1080×1920 (story) e 1080×1080 (feed)
- Background: cor sólida vibrante (varia por tipo de card: roxo, rosa, verde)
- Score gigante em font-display, com tabular-nums
- Avatar e nickname do destaque
- Frase engraçada gerada
- Footer: "SOMS.app" em font-display + um sticker-like badge "todo mundo acha que sabe"
- Geração: `@vercel/og` no servidor, retorna PNG

---

## 10. O que NÃO fazer

- ❌ Usar `shadow-md`, `shadow-lg` etc do Tailwind padrão (têm blur). **Sempre** os tokens `--shadow-*` (hard, deslocados, zero blur).
- ❌ Hardcodar hex preto ou `var(--ink)` na sombra. **Sempre** `var(--shadow-color)`, ou dark mode não vira neon.
- ❌ Gradientes suaves. Use cores chapadas.
- ❌ Bordas de 1px. Sempre 3-4px, sempre `var(--ink)`.
- ❌ Mais que 3 cores vibrantes simultâneas em uma única tela.
- ❌ Texto em cinza claro. Contraste alto sempre.
- ❌ Centralização perfeita em tudo. Aceite assimetria.
- ❌ Animações longas (>500ms). Springs rápidos.
- ❌ Componente padrão do shadcn sem customizar pros tokens daqui.
- ❌ Misturar muitas fontes. Só as três definidas.
- ❌ Border-radius 0 em toda parte. Vira retrô em vez de moderno.
- ❌ Redefinir tokens (hex de paleta, escala de tipo, raios) em outro lugar. Esses tokens existem **uma única vez**, em `tokens.css`. Este documento descreve; o CSS implementa.

---

## 11. Como instruir o Claude Code

Anexe este arquivo ao prompt e termine com:

> Aplique os tokens do DESIGN.md. Regras inegociáveis: borda 3-4px `var(--ink)`, sombras duras `Xpx Xpx 0 0 var(--shadow-color)` (NUNCA hex preto direto — quebra dark; NUNCA `shadow-md` padrão do Tailwind), raio 8-16px, `--font-display` Unbounded uppercase tracking-tight, `--font-body` Inter. Framer Motion para o transform de hover/tap (x/y +3 hover, +6 tap); a mudança de shadow vai via CSS transition para `var(--shadow-color)` resolver corretamente em dark. Aceite rotações leves -2° a 2° em cards alternando por index. Nunca centralize tudo no eixo X de forma perfeita. Mobile-first com áreas de toque ≥ `--tap-min` (48px). Em dark mode (`<html data-theme="dark">`), sombras viram rosa neon automaticamente — não hardcode nada.

---

## 12. Referências visuais pra se inspirar

Sites/produtos pra olhar com vibe neobrutalist musical/festiva:

- **Gumroad** — site oficial, neobrutalism puro e bem feito
- **Refokus** — agência, layouts assimétricos exemplares
- **Figma's community pages** — buscar "neobrutalism kit"
- **Are.na — channel "neubrutalism"** — referência farta
- **Linear's older landing** — flertou com o estilo

Quando estiver implementando uma tela específica, vale tirar screenshot de uma referência similar e anexar ao prompt do Claude Code junto com este DESIGN.md. Resultado fica muito mais consistente.

---

## 13. Dark mode (shipped)

Liga via `<html data-theme="dark">` (ou em qualquer ancestral). Tokens em `tokens.css` reescrevem-se automaticamente — **sem mudar componente algum**. Toggle em §8.

### Princípio

> As cores vibrantes são as luzes do palco — devem brilhar, não competir. O fundo é o teatro, o ink são as marcas do cenário, e as sombras coloridas são o rastro de neon.

### Tokens que mudam

| Token | Light | Dark | Nota |
|---|---|---|---|
| `--bg` | `#FFFCF2` | `#110A1F` | "Teatro profundo" — purple-black, nunca preto puro |
| `--surface` | `#FFFFFF` | `#1E1432` | Primeira elevação |
| `--surface-2` | `#F4F1E6` | `#2A1E4A` | Segunda elevação (hover, modais) |
| `--ink-base` | `#0A0A0A` | `#FFFCF2` | Cream warm — vira texto + borda em dark |
| `--ink-soft-base` | `#3D3D3D` | `#C8BDD9` | Muted purple-grey |
| `--primary` | `#FFE600` | `#FFD60A` | Amarelo um toque mais quente |
| `--secondary` | `#FF3D7F` | `#FF5C9A` | Rosa mais legível sobre purple-black |
| `--warm` | `#FF9F1C` | `#FFB347` | Laranja levemente mais claro |
| `--special` | `#A78BFA` | `#BFA5FF` | Lavanda mais clara |
| `--danger` | `#FF4D4D` | `#FF7070` | Vermelho um pouco mais claro |
| `--shadow-color` | `var(--ink)` (preto) | `#FF3D7F` (rosa neon) | **Assinatura dark** |

`--success` (lima) e `--info` (cyan) ficam inalterados — já equilibrados em qualquer fundo.

### O que NÃO muda

- **Estrutura:** mesma assimetria, mesmas rotações ±1.5°, mesmos pesos visuais.
- **Bordas:** continuam 3–4px, sempre `var(--ink)` — automaticamente cream em dark.
- **Tipografia:** mesma escala, mesmas três famílias.
- **Tokens `--on-*`:** permanecem dark mesmo em dark mode. Texto preto sobre amarelo/lima/cyan/laranja continua preto. Garantido via ink re-scoping (abaixo).

### Detalhe principal — sombras viram neon

Em vez de `Xpx Xpx 0 0 black`, dark usa `Xpx Xpx 0 0 #FF3D7F`. Cada card, botão e badge ganha um rastro fluorescente como letreiro de palco.

```css
/* certo — theme-aware */
box-shadow: 6px 6px 0 0 var(--shadow-color);

/* errado — não vira neon em dark */
box-shadow: 6px 6px 0 0 var(--ink);
box-shadow: 6px 6px 0 0 #0A0A0A;
```

### Chromatic shadows (assinatura avançada)

Em dark, cards/botões pintados com cores brand recebem sombras **complementares** em vez de rosa default:

| Fundo do elemento | Sombra dark |
|---|---|
| `--primary` (amarelo) | `#00E5FF` (cyan) |
| `--secondary` (rosa) | `#FFD60A` (amarelo) |
| `--success` (lima) | `#FF5C9A` (rosa) |
| `--info` (cyan) | `#FF5C9A` (rosa) |
| `--warm` (laranja) | `#BFA5FF` (lavanda) |
| `--special` (roxo) | `#FFD60A` (amarelo) |
| `--surface` / `--bg` (neutros) | `#FF3D7F` (rosa default) |

Implementado em `tokens.css` via seletores `[data-theme="dark"] [style*="var(--X)"][style*="background"]`. **Componentes não precisam pensar nisso** — basta usar `var(--shadow-color)`.

### Ink re-scoping (preto sobre amarelo, mesmo em dark)

Texto preto sobre amarelo continua preto **mesmo em dark mode**. Garantido por regra de re-escopo:

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

**Regra prática:** ao criar componente com bg de cor "clara" (primary/success/warm/info) via **classe CSS** (não inline `style`), adicione a classe ao seletor acima **ou** ponha `class="on-light"` no container. Filhos que usem `color: var(--ink)` automaticamente ganham texto preto.

### Page-bg em wrappers hostis

Previews/embeddings frequentemente forçam `background` no `<body>` que CSS normal não sobrescreve. Por isso o page-bg do UI kit vai num `.app-shell` wrapper:

```jsx
<div className="app-shell">
  <div className="stage">{/* ... */}</div>
</div>
```

`.app-shell` carrega `background-color: var(--bg)`, o pattern de bolinhas e `min-height: 100vh`. Em produção Next.js limpo, pode voltar para `<body>` se preferir.
