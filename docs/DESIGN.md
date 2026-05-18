# DESIGN: SOMS

Sistema visual completo para o SOMS. Atualize este documento antes de mudar tokens. Quando pedir nova UI pro Claude Code, anexe este arquivo ao prompt.

**Direção:** Neobrutalism com pulso musical/festivo.
**Modo:** Light-first (cores saturadas brilham mais em fundo claro). Dark mode é pós-MVP.
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

| Token | Hex | Onde usar |
|---|---|---|
| `--bg` | `#FFFCF2` | Background geral (off-white quente, vibe papel) |
| `--ink` | `#0A0A0A` | Texto principal, bordas, sombras (preto verdadeiro) |
| `--ink-soft` | `#3D3D3D` | Texto secundário, labels |
| `--surface` | `#FFFFFF` | Cards, modais, elementos elevados |
| `--primary` | `#FFE600` | CTA principal, destaque "luz de palco" |
| `--secondary` | `#FF3D7F` | CTA secundário, momentos importantes |
| `--success` | `#B8FF1A` | Acerto, posição #1, feedback positivo |
| `--warm` | `#FF9F1C` | "Quase", posição #2, hint |
| `--info` | `#00E5FF` | Contagem regressiva, timer, info neutra |
| `--special` | `#A78BFA` | Host, badges raros, regras caóticas |
| `--danger` | `#FF4D4D` | Erro, kick, encerrar sala |

### Regras de cor

- Texto **preto** sobre amarelo, verde lima, cyan, branco, laranja
- Texto **branco** sobre roxo, vermelho, rosa choque
- Nunca cor sobre cor sem borda preta separando
- Máximo **3 cores vibrantes simultâneas** em uma tela (fora o ink/bg)
- Background da maioria das páginas: `--bg`. Durante partida, pode-se usar variações por mood (ver seção 9)

---

## 3. Tipografia

Três famílias, todas Google Fonts, todas via `next/font` (zero CLS, performance ótima).

| Token | Família | Pesos | Onde usar |
|---|---|---|---|
| `font-display` | **Unbounded** | 700, 800, 900 | Títulos hero, room code, scores grandes, badges, CTAs |
| `font-body` | **Inter** | 400, 500, 700 | Parágrafos, labels, inputs, texto corrido |
| `font-mono` | **JetBrains Mono** | 500, 700 | Timer, código da sala em contexto secundário, dados técnicos |

### Escala (responsive: mobile / desktop)

| Token | Mobile | Desktop | Uso típico |
|---|---:|---:|---|
| `text-mega` | 64px | 96px | Score gigante, room code hero |
| `text-display` | 48px | 72px | "VOCÊ ACERTOU!", título de tela de fim |
| `text-h1` | 32px | 48px | Título de tela |
| `text-h2` | 24px | 32px | Seção dentro de tela |
| `text-h3` | 20px | 24px | Subtítulo, card de player |
| `text-lg` | 18px | 18px | Body destacado |
| `text-base` | 16px | 16px | Body padrão |
| `text-sm` | 14px | 14px | Labels, captions, ajuda |

### Regras de tipografia

- Display: **sempre uppercase** em CTAs, badges, scores. Sempre `letter-spacing: -0.02em` (tight).
- Body: nunca uppercase em parágrafos.
- Numerais de score: `font-display`, com `font-variant-numeric: tabular-nums` (alinhamento estável quando atualiza).
- Truncar nicknames longos com `text-overflow: ellipsis`, mas dar pelo menos 16 chars antes de cortar.

---

## 4. Tokens fundamentais

### Bordas

- **3px** em elementos interativos (botões, inputs, cards de player)
- **4px** em elementos hero (room code, pódio, modal principal)
- Cor sempre `--ink`. Nunca borda cinza.

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
| `--shadow-sm` | `3px 3px 0 0 var(--ink)` | Inputs, chips |
| `--shadow-md` | `6px 6px 0 0 var(--ink)` | Botões, cards padrão |
| `--shadow-lg` | `8px 8px 0 0 var(--ink)` | Cards importantes, modais |
| `--shadow-xl` | `12px 12px 0 0 var(--ink)` | Hero (room code, pódio) |

**Regra de ouro:** `box-shadow: Xpx Xpx 0 0 black`. Se você vir blur (`shadow-md` padrão do Tailwind), está errado.

### Spacing

Base do Tailwind (4px). Favoreça múltiplos de 8 (8, 16, 24, 32, 48, 64). Padding interno de cards: 24-32px. Respiro entre seções: 48-64px.

---

## 5. Animação (Framer Motion)

Todas as animações usam **spring physics**, não duration easing.

### Hover em elementos interativos
```tsx
whileHover={{ x: 3, y: 3, boxShadow: '3px 3px 0 0 #0A0A0A' }}
transition={{ type: 'spring', stiffness: 400, damping: 25 }}
```

### Click / tap (afundamento total)
```tsx
whileTap={{ x: 6, y: 6, boxShadow: '0px 0px 0 0 #0A0A0A' }}
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
    shadow-[6px_6px_0_0_var(--color-ink)]
    hover:shadow-[3px_3px_0_0_var(--color-ink)]
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
    shadow-[6px_6px_0_0_var(--color-ink)]
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
  shadow-[12px_12px_0_0_var(--color-ink)]
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
    shadow-[4px_4px_0_0_var(--color-ink)]
    focus:outline-none
    focus:translate-x-1 focus:translate-y-1
    focus:shadow-[2px_2px_0_0_var(--color-ink)]
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
  shadow-[2px_2px_0_0_var(--color-ink)]
">
  <Crown size={14} strokeWidth={3} /> Host
</span>
```

### Score display (final/durante)

```tsx
<div className="
  bg-success border-[4px] border-ink rounded-[16px]
  p-6 text-center
  shadow-[8px_8px_0_0_var(--color-ink)]
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

### `app/layout.tsx`

```tsx
import { Inter, Unbounded, JetBrains_Mono } from 'next/font/google';

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
      <body className="bg-bg text-ink font-body antialiased">
        {children}
      </body>
    </html>
  );
}
```

### `app/globals.css` (Tailwind v4)

```css
@import 'tailwindcss';

@theme inline {
  /* Cores */
  --color-bg: #FFFCF2;
  --color-ink: #0A0A0A;
  --color-ink-soft: #3D3D3D;
  --color-surface: #FFFFFF;
  --color-primary: #FFE600;
  --color-secondary: #FF3D7F;
  --color-success: #B8FF1A;
  --color-warm: #FF9F1C;
  --color-info: #00E5FF;
  --color-special: #A78BFA;
  --color-danger: #FF4D4D;

  /* Raios */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  /* Fontes (vindo do next/font) */
  --font-display: var(--font-display);
  --font-body: var(--font-body);
  --font-mono: var(--font-mono);

  /* Escala display */
  --text-mega: clamp(64px, 8vw, 96px);
  --text-display: clamp(48px, 6vw, 72px);
}

@layer base {
  body {
    background: var(--color-bg);
    color: var(--color-ink);
    font-family: var(--font-body);
  }
  ::selection {
    background: var(--color-primary);
    color: var(--color-ink);
  }
}

/* Utilidade pra border 3px que o Tailwind v4 não tem por padrão */
@utility border-3 {
  border-width: 3px;
}
```

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

- ❌ Usar `shadow-md`, `shadow-lg` etc do Tailwind padrão. **Sempre** sombras duras inline.
- ❌ Gradientes suaves. Use cores chapadas.
- ❌ Bordas de 1px. Sempre 3-4px pretas.
- ❌ Mais que 3 cores vibrantes simultâneas em uma única tela.
- ❌ Texto em cinza claro. Contraste alto sempre.
- ❌ Centralização perfeita em tudo. Aceite assimetria.
- ❌ Animações longas (>500ms). Springs rápidos.
- ❌ Componente padrão do shadcn sem customizar pros tokens daqui.
- ❌ Misturar muitas fontes. Só as três definidas.
- ❌ Border-radius 0 em toda parte. Vira retrô em vez de moderno.

---

## 11. Como instruir o Claude Code

Anexe este arquivo ao prompt e termine com:

> Aplique os tokens do DESIGN.md. Regras inegociáveis: borda 3-4px preta, sombras duras deslocadas (`Xpx Xpx 0 0 black`, nunca shadow-md do Tailwind), raio 8-16px, font-display Unbounded uppercase tracking-tight, font-body Inter. Use Framer Motion para hover/tap que desloca o elemento (whileHover x/y +3, whileTap x/y +6 com shadow indo a 0). Aceite rotações leves -2° a 2° em cards alternando por index. Nunca centralize tudo no eixo X de forma perfeita. Mobile-first com áreas de toque ≥ 48px.

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

## 13. Pós-MVP (dark mode neobrutalist)

Quando for hora:

- Trocar `--bg` para `#1A0F2E` (roxo bem escuro) ou `#0A0A0A` (preto)
- Trocar `--surface` para `#2D1B69` ou `#1A1A1A`
- `--ink` invertido para `#FFFCF2`
- Cores vibrantes mantêm tom mas baixam saturação 10-15%
- Sombras: trocar `--ink` (preto) por uma cor secundária (`shadow: 6px 6px 0 0 #FF3D7F`)
- Adicionar toggle no header com `lucide-react/Moon` e `Sun`

Não fazer antes do MVP estar validado.
