# SOMS — Web App UI Kit

Hi-fi neobrutalism recreations of SOMS's core screens. Built directly against `DESIGN.md` tokens.

## Screens

| File | Screen | Notes |
|---|---|---|
| `HomeScreen.jsx`         | `/`                       | Wordmark + nickname + create/join CTAs |
| `AuthScreen.jsx`         | `/conta`                  | Google/Discord login + guest-to-account promotion |
| `LobbyScreen.jsx`        | `/sala/[code]`            | Room code hero + player grid + settings |
| `SettingsScreen.jsx`     | `/sala/[code]/config`     | Host-only: presets, modo, rounds, regras especiais |
| `GameScreen.jsx`         | `/sala/[code]/jogar`      | Timer, waveform, answer input, live feed |
| `RevealScreen.jsx`       | `/sala/[code]/reveal`     | Cover, track info, points scored that round |
| `EndScreen.jsx`          | `/sala/[code]/fim`        | Podium + rest of ranking + funny stats |
| `ShareCard.jsx`          | OG card 1080×1080         | Winner + score + funny stat |
| `ProfileScreen.jsx`      | `/perfil`                 | Stats, badges, equippable titles, match history |
| `ShopScreen.jsx`         | `/loja`                   | Drop banner + categorias + raridades + preview ao vivo + modal de compra |
| `ErrorEmptyScreen.jsx`   | `/erro`, `/sala-cheia` …  | 404, empty lobby, kicked, server down |
| `LegalScreen.jsx`        | `/legal`                  | Privacy + terms, TOC sticky |

## Primitives

`Primitives.jsx` exports `SmButton`, `SmInput`, `SmLabel`, `SmBadge`, `SmCard`, `SmAvatar`, `Icon`.

These are cosmetic recreations — not production-ready. For real implementation, swap them out for the real component layer (shadcn/ui customized to these tokens + Framer Motion for hover/tap).

## Running

Open `index.html`. The nav at the top lets you click through Home → Lobby → Round → Reveal → Pódio → Share.

## What's missing on purpose

- Audio playback (waveform is a cosmetic placeholder)
- WebSocket / real-time state
- Auth flow
- Cover art (placeholder block)
- Confetti animation on podium (`canvas-confetti` was scoped out for the kit)
- Settings editor (read-only display)
