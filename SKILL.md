---
name: soms-design
description: Use this skill to generate well-branded interfaces and assets for SOMS, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

# SOMS Design

SOMS is a pt-BR web party-game musical: players join a room, hear short clips, race to guess title/artist/feat, and end with funny stats, titles, badges, and shareable cards.

**Direction:** Neobrutalism com pulso musical/festivo. Light-first. Mobile-first.

Read the `README.md` file within this skill first — it contains the full content fundamentals, visual foundations, and iconography rules. Then explore:

- `colors_and_type.css` — canonical CSS variables (colors, type scale, radii, shadows, spacing). **Always import this** when building UI.
- `assets/` — logos and marks (`soms-logo.svg`, `soms-mark.svg`, `icon-vinyl.svg`).
- `preview/*.html` — small reference cards for each token / component pattern. Open these to see exactly how each piece renders.
- `ui_kits/web_app/` — full click-through recreation of the SOMS web app (Home, Lobby, Round, Reveal, Pódio, Share). Use the JSX components there as the canonical reference for component anatomy.

## When building visual artifacts (slides, mocks, throwaway prototypes)

- Copy the assets you need from `assets/` into your output.
- Always `@import` `colors_and_type.css` — never reinvent the palette.
- Use the components in `ui_kits/web_app/*.jsx` as the canonical "what does a SOMS button/card/badge look like" reference. Cherry-pick into your output.

## When working on production code

- Tokens in `colors_and_type.css` mirror the values in `SOMS/DESIGN.md`. Keep them in sync.
- For real Next.js implementation: use `next/font/google` to load Unbounded / Inter / JetBrains Mono (not the `@import` we use here for the static system).
- Real motion uses **Framer Motion springs**, not CSS transitions. See `SOMS/DESIGN.md §5` for snippets.
- Real components extend **shadcn/ui** customized to these tokens. The JSX in `ui_kits/` is intentionally simpler (cosmetic-only).

## Non-negotiables (cheat sheet)

- Borda **3px** (interativo) ou **4px** (hero), **sempre** `var(--ink)` (#0A0A0A light / #FFFCF2 dark). Nunca cinza, nunca 1px.
- Sombra: `Xpx Xpx 0 0 var(--shadow-color)`. Escala 3 → 6 → 8 → 12. Light = preto; dark = **#FF3D7F neon pink**. **Zero blur, sempre.**
- Raio: 8 / 12 / 16 / 24. Nunca 0.
- Display = **Unbounded 800/900 uppercase tracking -0.02em**. Body = Inter. Mono = JetBrains Mono (timer + room code).
- Hover empurra `+3,+3` (sombra → 3px); tap afunda `+6,+6` (sombra → 0).
- Cards rotacionados alternados `-1.5° / +1.5°` por index. **Nunca tudo centrado-perfeito.**
- Áreas de toque ≥ **48px**.
- Lowercase em copy; UPPERCASE só em CTAs, badges, scores display.
- **Sem emoji na UI. Sem gradientes. Sem fotografia.**
- **Dark mode:** liga via `<html data-theme="dark">`. Tokens trocam automaticamente. Sombras viram rosa neon. Bordas viram cream. Texto sobre cor clara permanece preto via regra de re-escopo (`[style*="var(--primary)"][style*="background"] { --ink: #0A0A0A; }`).

## If invoked without other guidance

Ask the user what they want to build (a new screen? a marketing asset? a slide deck?), confirm if it's mobile or desktop or social-share format, then act as an expert designer and produce HTML artifacts using these tokens.
