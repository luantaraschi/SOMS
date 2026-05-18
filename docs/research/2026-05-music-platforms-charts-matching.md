# SOMS — Pesquisa Técnica: Charts, Cross-matching e Stack Open Source

## TL;DR
- **Topic 1 (Charts):** Para Top Mundial, combine a Billboard "Greatest of All Time Hot 100 Songs" (atualizada a cada ~5 anos — edições em 2008, 2013, 2018 e 23/nov/2021), Spotify all-time via kworb.net (`/spotify/songs.html`) e o RIAA Diamond list. Para Brasil, hardcode a partir do **Crowley Top 100 Brasil** (semanal oficial de rádio), do **Pro-Música Brasil Top 50 Streaming** (mensal) e do **Spotify Brasil via kworb.net** (`/spotify/country/br_weekly.html`). Não existe um chart "all-time" Brasil oficial — você terá que sintetizar manualmente.
- **Topic 2 (Cross-matching):** A maneira robusta é **ISRC-first**: extrair ISRC via Spotify Web API (`external_ids.isrc`) e bater no Deezer via endpoint não-documentado mas estável `https://api.deezer.com/track/isrc:<ISRC>`. Como fallback, use `https://api.deezer.com/search?q=track:"X" artist:"Y"`. Para um one-liner pronto, **Songlink/Odesli API** (`https://api.song.link/v1-alpha.1/links?url=...&userCountry=BR`) já retorna o link Deezer (10 req/min sem chave, 60 com chave grátis).
- **Topic 3 (Stack):** Para o SOMS — que NÃO toca áudio, só usa previews 30s da Deezer — você **não precisa de Lavalink**. Bibliotecas certeiras: `spotify-web-api-node` + `musicbrainz-api` (Borewit) + `odesli.js` + um wrapper Deezer leve (fetch direto). Lavalink/Lavaplayer são overkill (e arrastam JVM + áudio) — só estude a estratégia de matching deles (LavaSrc com `dzisrc:%ISRC%` é o padrão de ouro).

---

## Topic 1: Charts globais e brasileiros de "top de sempre"

### 1.1 Recomendação principal

Hardcode duas listas estáticas no repo (ex.: `data/top-world.json`, `data/top-br.json`) com **~100–200 músicas cada**, sintetizadas a partir das fontes abaixo, anotando título + artista + ISRC + Deezer track ID já pré-resolvido. Use essas listas como "modo Top Mundial" e "modo Top Brasil". Para o futuro "top semanal", planeje um cron semanal que consuma a Spotify Web API com IDs de playlists editoriais ("Top 50 — Brazil" / "Top 50 — Global") e/ou faça scrape leve de kworb.net.

### 1.2 Tabela comparativa das fontes

| Fonte | Cobertura | Acesso | All-time? | Adequada para hardcode? | Notas |
|---|---|---|---|---|---|
| **Billboard "Greatest of All Time Hot 100"** | EUA | Scrape HTML em billboard.com/charts/greatest-hot-100-singles/ | Sim (atualizada a cada ~5 anos: 2008, 2013, 2018, 23/nov/2021) | Sim, **estrela** para Top Mundial | Não tem API. Lista é estável. Reflete só performance no Hot 100 (EUA). |
| **Wikipedia "List of best-selling singles"** | Mundial | Scrape ou Wikidata SPARQL | Sim | Sim | Inclui "White Christmas" (Crosby, ~50M), "Candle in the Wind 1997" (Elton John, ~33M), "I Will Always Love You" (Houston, 24M), "Shape of You" (Sheeran, mais certificado) |
| **Spotify all-time (kworb.net)** | Global + Brasil | Scrape HTML em `kworb.net/spotify/songs.html` e `kworb.net/spotify/country/br_weekly.html` | Sim | **Sim, recomendado** | Atualizado continuamente, agrega charts diários/semanais Spotify desde 2013. Cobertura BR desde 2014-08-10. |
| **Spotify Web API** | Global / país | OAuth client-credentials | Não (Spotify descontinuou Spotify Charts API em 2024) | Não p/ all-time | Útil para metadata e para pegar tracks de uma playlist editorial "Top 50 Brazil" (ID `37i9dQZEVXbMXbN3EUUhlg`). |
| **Spotify Charts site (charts.spotify.com)** | Global / país | Login + CSV download manual; sem API pública desde 2024 | Não | Não | API pública oficial descontinuada. |
| **Chartmasters.org** | Global | Scrape ou ler manualmente | Sim ("Best-Selling Songs of All Time") | Sim, ótima | Metodologia híbrida sales + streams. |
| **YouTube most-viewed (Wikipedia)** | Mundial | Wikipedia article ou YouTube Data API com lista de IDs | Sim | Sim (top 30 long-form) | "Baby Shark Dance" >16B views (abril 2026), "Despacito" ~8.73B (2º lugar all-time), "See You Again", "Shape of You", etc. |
| **YouTube Data API** | Global/regional | API com `chart=mostPopular&regionCode=BR` (não é all-time, é só "now") | Não para all-time | Não diretamente, mas útil para enriquecer | Quota 10k unit/dia free. |
| **IFPI Global Recording Artists** | Mundial | PDF anual, sem API | Não (é anual) | Útil para validação | Bad Bunny, Taylor Swift, Drake etc. |
| **RIAA Diamond Singles** | EUA | Scrape riaa.com/gold-platinum | Sim (Diamond = 10M units equiv.) | Sim, complementar | ~33 diamond singles em Out/2019, cresceu desde então. |
| **Apple Music charts** | Global/país | Apple Music API (developer token JWT) | Não (semanal/diário) | Não p/ all-time | Não publica all-time. |
| **Last.fm scrobbles all-time** | Global (usuários Last.fm) | API pública grátis (`chart.getTopTracks`) | Sim (~all-time entre scrobbles) | Útil, mas enviesa para nicho rock/indie | Boa diversidade, ruim para sertanejo/funk/MPB. |
| **Pro-Música Brasil (PMB)** | Brasil | Scrape pro-musicabr.org.br/home-2/top-50-streaming/ | Não (mensal, 50 trilhas) | Sim, mas só 12×50 por ano | Compilado pela BMAT a partir das DSPs. **Fonte oficial Brasil.** |
| **Crowley Top 100 Brasil** | Brasil | Scrape charts.crowley.com.br | Não (semanal) | Sim, **top recomendação Brasil** | Cobre execuções de rádio. Gêneros: pagode, sertanejo, forró, funk, MPB. **Acesso público gratuito.** |
| **Billboard Brasil Hot 100** | Brasil | Scrape billboard.com/charts/billboard-brasil-hot-100/ | Não (semanal) | Sim | Compilado por Luminate desde 2024. |
| **Spotify Brasil Top 50 (playlist editorial)** | Brasil | Spotify Web API `/playlists/37i9dQZEVXbMXbN3EUUhlg/tracks` | Não (semanal) | Sim | Requer OAuth. Pega snapshot atualizado. |
| **Shazam Top 200 Brazil** | Brasil | shazam.com/charts/top-200/brazil (scrape) | Não (semanal) | Sim | Reflete "o que pessoas estão tentando identificar" — bom para hits emergentes. |
| **Deezer `/chart` API** | Global (genre-scoped) | `GET https://api.deezer.com/chart/0/tracks` sem auth | Não (current top) | Útil para semanal | **Sem chart oficial por país** — só genre. Para BR-only, use `Accept-Language: pt-BR` ou playlist ID curada. |

### 1.3 Caminho prático para Sprint 2 (Top Mundial + Top Brasil hardcoded)

```ts
// data/top-world.json
[
  { "title": "Blinding Lights", "artist": "The Weeknd", "isrc": "USUG11904206", "deezerId": 916425 },
  { "title": "Shape of You", "artist": "Ed Sheeran", "isrc": "GB7TP1700014", "deezerId": 138741170 },
  // ... ~100-200 entradas
]
```

**Processo de geração (uma vez, offline):**

1. Pegue manualmente os top 100 da Billboard Greatest Hot 100, top 100 do kworb.net Spotify all-time, e top 50 Wikipedia best-selling singles. Junte/dedupe.
2. Para cada título+artista, rode `Spotify Web API /search` → pegue `external_ids.isrc`.
3. Para cada ISRC, rode `GET https://api.deezer.com/track/isrc:<ISRC>` → pegue `id` (Deezer track ID) e valide que `preview` (URL 30s) está presente.
4. Filtre as que não têm preview (Deezer ocasionalmente não tem licença em alguns territórios — verifique com `Accept-Language: pt-BR` se relevante).
5. Salve como JSON estático.

Mesmo processo para Brasil, mas a fonte é: Crowley top 100 + Pro-Música Brasil Top 50 Streaming (últimos ~12 meses concatenados) + Spotify BR Top 50 (último ano via Spotify API ou kworb).

### 1.4 Para uso FUTURO (top semanal automático)

| Estratégia | Esforço | Risco TOS | Custo |
|---|---|---|---|
| **kworb.net scraping** (semanal) | Baixo | Médio (kworb é fan-site, sem TOS explícito mas pode mudar) | Grátis |
| **Deezer `/chart/0/tracks`** com `Accept-Language: pt-BR` | Baixo | Baixo (API documentada) | Grátis |
| **Spotify Web API** + playlist editorial `Top 50 — Brazil` (ID `37i9dQZEVXbMXbN3EUUhlg`) | Baixo | Baixo (uso autorizado da API) | Grátis (client-credentials) |
| **billboard.py** (PyPi) ou scraping direto Billboard | Médio | Médio | Grátis |
| **chartmetric / soundcharts** APIs comerciais | Alto | Nenhum | $$$$ |

**Recomendação:** Para o SOMS, faça **Spotify Web API → playlist `37i9dQZEVXbMXbN3EUUhlg` (BR) e `37i9dQZEVXbMnDoIDOUMnO` (Global)** uma vez por semana via cron. Está dentro do TOS, é grátis e retorna os ISRCs prontos para o pipeline Deezer.

### 1.5 Snippet — captura semanal das playlists Top 50

```ts
import SpotifyWebApi from 'spotify-web-api-node';

const sp = new SpotifyWebApi({ clientId: process.env.SP_ID, clientSecret: process.env.SP_SECRET });
const { body } = await sp.clientCredentialsGrant();
sp.setAccessToken(body.access_token);

const PLAYLIST_TOP_BR = '37i9dQZEVXbMXbN3EUUhlg';
const tracks = await sp.getPlaylistTracks(PLAYLIST_TOP_BR, { limit: 50 });

const enriched = tracks.body.items.map(it => ({
  title: it.track.name,
  artist: it.track.artists.map(a => a.name).join(', '),
  isrc: it.track.external_ids?.isrc,
  durationMs: it.track.duration_ms,
}));
```

### 1.6 Avisos legais

- **Billboard, Spotify, Apple Music** publicam seus charts publicamente, mas **redistribuir o chart inteiro como dataset** infringe ToS. Para um jogo privado/não-comercial usar como inspiração para *escolher* músicas e tocar previews oficiais da Deezer é zona cinza tolerada.
- **kworb.net** não tem ToS proibindo scraping leve, mas o operador (Kworb) pediu publicamente que se evite scraping agressivo. Use cache local e User-Agent identificável.
- **Pro-Música Brasil** publica explicitamente "para fins informativos e de orientação no mercado musical" — uso interno está OK; cópia integral do chart como produto não.

---

## Topic 2: Cross-matching de músicas entre plataformas (Spotify/YouTube → Deezer)

### 2.1 Recomendação principal

**Pipeline em três camadas, em ordem de prioridade:**

1. **ISRC match (camada de ouro, ~95% hit rate quando disponível).** Spotify Web API retorna ISRC em `track.external_ids.isrc`. Bate direto em `https://api.deezer.com/track/isrc:<ISRC>`.
2. **Songlink/Odesli fallback (~80% hit rate).** Quando ISRC falha ou não está disponível (ex.: URLs YouTube), chame `GET https://api.song.link/v1-alpha.1/links?url=<encoded>&userCountry=BR` e leia `linksByPlatform.deezer.url` + extraia o ID Deezer.
3. **Deezer search fuzzy fallback (~70% hit rate).** `https://api.deezer.com/search?q=track:"X" artist:"Y"&strict=on` e use match score baseado em (string similarity ≥ 0.85) AND (|duração_dz − duração_spotify| ≤ 3 segundos).

Esta arquitetura espelha exatamente o que **Lavalink + LavaSrc** faz por baixo: providers ordenados `dzisrc:%ISRC%` → `dzsearch:%QUERY%` → fallbacks. Você está reimplementando essa estratégia em Node sem precisar do Lavalink em si.

### 2.2 Como bots Discord (Jockie, FredBoat, Hydra) fazem isso hoje

**Resumo:** Quase todos rodam **Lavalink (servidor Java standalone)** + **LavaSrc plugin**. Quando o usuário cola um link Spotify, o LavaSrc faz exatamente o seguinte:

1. Resolve o link Spotify via Spotify Web API → obtém metadata (título, artista, ISRC).
2. Tenta `dzisrc:%ISRC%` (Deezer ISRC lookup). Se Deezer for a fonte de áudio configurada, toca direto.
3. Se Deezer falhar ou não estiver configurado, tenta `ytsearch:"%ISRC%"` (busca YouTube pelo ISRC literal — funciona quando os uploads oficiais "Provided to YouTube by" carregam o ISRC nas tags).
4. Se nada, cai para `ytsearch:%QUERY%` (título + artista no YouTube), pega o primeiro resultado com `topic` no nome do canal ou "Auto-generated".

**Após 2021 (Groovy/Rythm shutdown):**
- **Groovy** foi desligado em 30 ago 2021 após cease-and-desist do YouTube. A declaração oficial do Google (via The Verge): *"We notified Groovy about violations of our Terms of Service, including modifying the service and using it for commercial purposes."*
- **Rythm** foi desligado em 15 set 2021. Tinha **20M servidores e 30M usuários ativos mensais** (os 560M citados em algumas reportagens referem-se ao total de membros do Discord à época, não a usuários do Rythm), pela mesma razão.
- **Os que sobrevivem em 2026** (Jockie Music, FredBoat, Hydra, Uzox) operam tipicamente: (a) **sem tier comercial óbvio sobre conteúdo YouTube**, (b) suportam múltiplas fontes (Spotify→YouTube ou Spotify→Deezer/SoundCloud) para reduzir dependência de YouTube, (c) ficam no jurisdiction limbo (privados, sem ToS de venda direta de "stream from YouTube"). **Jockie Music** explicitamente lista "Spotify (até 100 tracks por playlist), Tidal, Deezer, Apple Music, SoundCloud" como fontes — claramente um pipeline cross-platform com Deezer/Tidal como fontes de áudio reais quando possível, e YouTube como fallback "best-effort".

**Para o SOMS especificamente:** você **não precisa se preocupar com o drama do YouTube** porque você não toca áudio do YouTube. Você usa preview 30s Deezer (que **é licenciado** para uso público gratuito — a preview URL é parte oficial da Deezer API). Sua única preocupação cross-platform é **resolver IDs**, não streamar.

### 2.3 Algoritmo de matching — tabela de táticas

| Estratégia | Precisão | Cobertura | Edge cases que falha |
|---|---|---|---|
| **ISRC match** | ~99% (quando único) | ~85% das tracks Spotify mainstream | Múltiplos ISRCs para mesma música (remasterizações), tracks Deezer com mesmo ISRC duplicado (Deezer retorna só 1) |
| **Songlink/Odesli** | ~95% | ~90% (eles agregam várias fontes) | Releases muito recentes (24-48h sync delay), releases regionais |
| **Title+Artist+Duration fuzzy** | ~85% | ~95% | Remixes, live, acoustic, sped-up, regional versions, idiomas diferentes |
| **Audio fingerprint (Chromaprint/AcoustID)** | ~99% | Requer arquivo de áudio (você não tem) | N/A — inviável no SOMS |
| **Title+Artist exact** | ~95% precision quando match | ~60% recall | Pontuação, parênteses "(feat. X)", "(Remastered 2009)" |

### 2.4 Edge cases problemáticos

- **Remixes:** ISRC diferente; o Spotify retorna o ISRC do remix, não do original. Match correto.
- **Versões ao vivo:** ISRC diferente. Geralmente o usuário **quer** a live se colocou link de live.
- **Covers:** ISRC totalmente diferente, frequentemente não há cover correspondente no Deezer.
- **Sped-up / slowed (TikTok culture):** raramente têm release oficial cruzado; cai no fallback fuzzy e provavelmente erra.
- **Regional (japonês/coreano/etc.):** título romanizado vs. caracteres originais — fuzzy match em "title" só funciona se ambos os catálogos usam a mesma grafia. Normalize com `normalize-strings` ou `string-similarity` (Dice).
- **Instrumental vs. vocal:** ISRCs diferentes; precisa de heurística "Instrumental" no título.

### 2.5 Songlink/Odesli — detalhe técnico

- **Endpoint:** `GET https://api.song.link/v1-alpha.1/links?url=<encoded>&userCountry=BR`
- **Rate limit (verbatim, Songlink Help Center "API Documentation v1-alpha.1"):** *"Without an API key, current rate limit is **10 requests per minute**. Rate limit with an API key is **60 requests per minute**. If you need to increase this limit, let us know."*
- **API key:** **opcional, gratuita** (email `developers@song.link`). Não requer revenue share.
- **Plataformas suportadas (verbatim):** `spotify, itunes, appleMusic, youtube, youtubeMusic, google, googleStore, pandora, deezer, tidal, amazonStore, amazonMusic, soundcloud, napster, yandex, spinrilla`
- **Resposta:** `linksByPlatform.deezer.url` + `entitiesByUniqueId["DEEZER_SONG::<id>"].id` (Deezer track ID).
- **Aviso de ToS:** os Terms da Odesli proíbem rebranding do landing page; chamar a API direto e extrair só o link Deezer está **dentro do uso permitido** (eles disponibilizam a API justamente para isso).

### 2.6 MusicBrainz como hub central

- MBID (MusicBrainz ID) liga ISRC → release → recording → URL relationships com Spotify/Deezer/YouTube.
- API gratuita, 1 req/seg, sem chave. User-Agent obrigatório.
- Útil quando você quer **enriquecer metadata** (gêneros, ano, álbum) ou resolver ambiguidades de ISRC.
- Limitação: cobertura de catálogos pop/sertanejo brasileiro recente é **pior** que Spotify/Deezer. Não substitui o pipeline ISRC→Deezer direto.

### 2.7 Snippet completo de cross-matching

```ts
import SpotifyWebApi from 'spotify-web-api-node';

const sp = new SpotifyWebApi({ clientId: process.env.SP_ID, clientSecret: process.env.SP_SECRET });

async function spotifyPlaylistToDeezerTracks(playlistId: string) {
  const { body } = await sp.clientCredentialsGrant();
  sp.setAccessToken(body.access_token);

  const items: any[] = [];
  let offset = 0;
  while (true) {
    const page = await sp.getPlaylistTracks(playlistId, { offset, limit: 100 });
    items.push(...page.body.items);
    if (!page.body.next) break;
    offset += 100;
  }

  const results = [];
  for (const it of items) {
    const t = it.track;
    if (!t) continue;
    const match = await resolveToDeezer({
      isrc: t.external_ids?.isrc,
      title: t.name,
      artist: t.artists.map((a: any) => a.name).join(' '),
      durationMs: t.duration_ms,
    });
    results.push({ spotify: t, match });
  }
  return results;
}

async function resolveToDeezer({ isrc, title, artist, durationMs }) {
  // 1) ISRC direct
  if (isrc) {
    const r = await fetch(`https://api.deezer.com/track/isrc:${isrc}`);
    const j = await r.json();
    if (j.id && j.preview) return { source: 'isrc', id: j.id, preview: j.preview };
  }

  // 2) Deezer search fallback
  const q = encodeURIComponent(`track:"${title}" artist:"${artist}"`);
  const r2 = await fetch(`https://api.deezer.com/search?q=${q}&strict=on&limit=5`);
  const j2 = await r2.json();
  if (!j2.data?.length) return null;

  const best = j2.data
    .map((t: any) => ({
      track: t,
      score:
        similarity(t.title, title) * 0.5 +
        similarity(t.artist.name, artist) * 0.3 +
        (Math.abs((t.duration * 1000) - durationMs) < 3000 ? 0.2 : 0),
    }))
    .sort((a, b) => b.score - a.score)[0];

  if (best.score < 0.7 || !best.track.preview) return null;
  return { source: 'fuzzy', id: best.track.id, preview: best.track.preview, score: best.score };
}

function similarity(a: string, b: string): number {
  return require('string-similarity').compareTwoStrings(
    a.toLowerCase().replace(/[^\w\s]/g, ''),
    b.toLowerCase().replace(/[^\w\s]/g, '')
  );
}
```

### 2.8 Para parsear YouTube playlists

YouTube Data API v3 (gratuito, quota 10k unit/dia):

```ts
import { google } from 'googleapis';
const yt = google.youtube({ version: 'v3', auth: process.env.YT_API_KEY });
const r = await yt.playlistItems.list({
  playlistId: 'PL...',
  part: ['snippet', 'contentDetails'],
  maxResults: 50,
});
// r.data.items[].snippet.title é tipicamente "Artist - Song (Official Video)"
// Você precisa parsear esse título manualmente ou jogar no Songlink:
// GET https://api.song.link/v1-alpha.1/links?url=https://youtu.be/<videoId>&userCountry=BR
```

**yt-dlp** é a opção mais robusta para parsing de YouTube (extrai uploader, título, descrição, duration sem precisar de API key), mas requer binário externo. Para SOMS, prefira a API oficial + Songlink.

### 2.9 Avisos legais

- **Spotify Web API:** uso de client-credentials para metadata leitura **está permitido** para qualquer projeto, comercial ou não. Você só precisa criar app em developer.spotify.com.
- **YouTube Data API:** quota 10k unit/dia. Buscar metadata de playlists é OK por ToS. **Stream o áudio NÃO É OK** — é exatamente o que matou Groovy/Rythm.
- **Deezer API:** endpoints públicos (`/track`, `/track/isrc:`, `/search`, `/chart`) não exigem auth e são licenciados para uso. Preview URLs são públicas e expiram raramente. **Não scrape/baixe o áudio completo** — só use a `preview` (30s).
- **Songlink/Odesli:** uso da API está OK incluindo comercial. Eles pedem que você não rebrand o landing page deles, mas você não vai usar isso.

---

## Topic 3: Stack de código aberto para integração

### 3.1 Recomendação principal

**Para o SOMS (Node/TS, headless, sem áudio):** stack mínima e clean é:

```
spotify-web-api-node    → parse Spotify playlist + ISRC extraction
node-fetch (ou undici)  → chamadas direto ao Deezer API
odesli.js               → Songlink fallback
musicbrainz-api         → enrichment opcional (metadata canônico)
string-similarity       → fuzzy fallback ranking
```

**NÃO use Lavalink/Lavaplayer** — eles existem para *enviar áudio Opus para Discord voice gateways*. Você não tem voice gateway, não tem áudio, só tem `<audio src="preview.mp3">` no cliente.

**NÃO use Chromaprint/AcoustID** — eles fingerprintam áudio. Você não tem o arquivo. Só seria útil se o usuário gravasse áudio e quisesse "Shazam-style" identification, que não é o caso do SOMS.

### 3.2 Tabela comparativa das bibliotecas

| Lib | Licença | Linguagem | Headless OK? | Útil para SOMS? | Caso de uso |
|---|---|---|---|---|---|
| **Lavalink** | MIT | Java standalone server | Não (precisa JVM + voice gateway Discord) | **Não** | Estude a arquitetura LavaSrc para inspirar o seu pipeline ISRC→search |
| **Lavaplayer** | Apache-2.0 | Java | Não (gera Opus frames) | Não | — |
| **LavaSrc** | MIT | Java (Lavalink plugin) | Não | Sim — **leia o source** para entender o algoritmo de mirror Spotify→Deezer |
| **yt-dlp** | Unlicense | Python CLI | Sim (com `--flat-playlist --dump-single-json`) | Útil para parse de YouTube playlists, mas precisa binário externo | Cron offline para enriquecer dados |
| **spotify-web-api-node** | MIT | TS/JS | Sim | **Sim, essencial** | Parse playlists Spotify, search, OAuth flow |
| **musicbrainz-api** (Borewit) | MIT | TS, ESM | Sim | Sim, enrichment opcional | ISRC ↔ MBID, Spotify URL lookup, throttling automático |
| **node-musicbrainz** (maxkueng) | MIT | JS | Sim | Alternativa mais simples mas menos mantida | — |
| **odesli.js** | ISC | TS/JS | Sim | Sim, fallback ideal | Wrapper Songlink |
| **deezer-python** | MIT | Python | Sim | Não (você está em Node) | Use como referência |
| **acoustid (npm)** | MIT | Node + fpcalc binário | Sim, mas precisa áudio | **Não** | Não há arquivo de áudio |
| **chromaprint.js** | MIT | JS (browser/Node) | Sim, mas precisa áudio | **Não** | Idem |
| **node-fpcalc** | MIT | Node + fpcalc | Sim, mas precisa áudio | **Não** | Idem |
| **@discordx/lava-player**, **@lavacord/discord.js** | MIT | TS | Não (cliente Lavalink) | Não | Só se um dia virar bot Discord |
| **string-similarity** | ISC | JS | Sim | Sim, micro-utility | Dice coefficient para fuzzy match |
| **fuse.js** | Apache-2.0 | TS/JS | Sim | Útil para busca no client | Search incremental no front |

### 3.3 Lavalink — vale a pena estudar?

**Sim, como referência arquitetural.** O LavaSrc plugin (https://github.com/topi314/LavaSrc) implementa exatamente o pipeline que você quer:

```yaml
plugins:
  lavasrc:
    providers:
      - "dzisrc:%ISRC%"              # Deezer ISRC primeiro
      - "dzsearch:%QUERY%"            # Deezer search fallback
      - "ytsearch:\"%ISRC%\""         # YouTube com ISRC como string literal
      - "ytsearch:%QUERY%"            # YouTube fallback final
```

Este ordering é o estado da arte. Reimplemente em TypeScript com sua própria função `resolve()`. O conceito de "Mirror playback" (resolver metadata em uma fonte, tocar áudio de outra) é exatamente o que SOMS faz: metadata vem do Spotify, áudio (preview) vem do Deezer.

Lavalink em produção é usado por **FredBoat, Dyno, LewdBot, Jockie Music** e muitos outros.

### 3.4 MusicBrainz — quando usar

- **Para enrichment:** dado um ISRC, busca o MBID e via MBID acha o canonical artist (resolve "feat." inconsistências, idiomas, etc).
- **Para resolver Spotify URL → ISRC sem chamar Spotify API:** `mbApi.lookupUrl(['https://open.spotify.com/track/...'])` funciona em alguns casos (depende de a comunidade ter cadastrado a URL relationship).
- **Limites:** 1 req/seg hard limit, User-Agent obrigatório (`appName/version (contact@email)`). A lib `musicbrainz-api` da Borewit já implementa throttling automático ("smart throttling: implements intelligent throttling, allowing bursts of requests while adhering to MusicBrainz rate limits").

### 3.5 Snippets de integração

#### 3.5.1 Resolver Spotify playlist URL → Deezer preview URLs

```ts
import SpotifyWebApi from 'spotify-web-api-node';
import Odesli from 'odesli.js';

const sp = new SpotifyWebApi({ /* credentials */ });
const odesli = new Odesli(); // sem key: 10 req/min

async function resolvePlaylist(spotifyPlaylistUrl: string) {
  const playlistId = spotifyPlaylistUrl.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];
  if (!playlistId) throw new Error('invalid playlist URL');

  await authIfNeeded();
  const tracks = await getAllPlaylistTracks(playlistId);

  const deezerTracks = await Promise.all(
    tracks.map(async (t) => {
      // 1) ISRC fast path
      if (t.external_ids?.isrc) {
        const r = await fetch(`https://api.deezer.com/track/isrc:${t.external_ids.isrc}`);
        const j = await r.json();
        if (j.id && j.preview) {
          return { source: 'isrc', preview: j.preview, deezerId: j.id, title: t.name };
        }
      }

      // 2) Odesli fallback (cuidado com rate limit de 10/min sem chave)
      try {
        const result = await odesli.fetch(`https://open.spotify.com/track/${t.id}`, 'BR');
        const deezerEntity = Object.values(result.entitiesByUniqueId).find(
          (e: any) => e.apiProvider === 'deezer'
        );
        if (deezerEntity) {
          const r = await fetch(`https://api.deezer.com/track/${deezerEntity.id}`);
          const j = await r.json();
          if (j.preview) return { source: 'odesli', preview: j.preview, deezerId: j.id, title: t.name };
        }
      } catch {}

      // 3) Fuzzy search fallback
      return await fuzzyMatch(t);
    })
  );

  return deezerTracks.filter(Boolean);
}
```

#### 3.5.2 Caching dos resolves (Postgres)

```sql
CREATE TABLE track_resolve_cache (
  isrc          TEXT PRIMARY KEY,
  deezer_id     BIGINT NOT NULL,
  preview_url   TEXT NOT NULL,
  title         TEXT,
  artist        TEXT,
  duration_ms   INT,
  source        TEXT,             -- 'isrc' | 'odesli' | 'fuzzy'
  resolved_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ
);

CREATE TABLE spotify_to_deezer (
  spotify_track_id  TEXT PRIMARY KEY,
  isrc              TEXT REFERENCES track_resolve_cache(isrc)
);
```

Caching agressivo é essencial — você não quer ressubmeter os mesmos 50 tracks toda vez que um lobby usa a mesma playlist.

### 3.6 Casos de uso reais em produção

- **Lavalink + LavaSrc:** FredBoat, Dyno, Jockie Music. Estratégia Spotify→Deezer mirror é battle-tested.
- **Spotify-web-api-node:** usado por incontáveis projetos open source (Soundiiz, Tunemymusic alternatives, etc.).
- **odesli.js:** o cliente Node oficial-comunidade da Odesli; usado por bots Discord e bots Telegram que convertem links.
- **MusicBrainz (musicbrainz-api):** usado por Beets, Picard, MusicBee — pipelines de music library management.

### 3.7 Caminho recomendado para Sprints

**Sprint 2 (Top Mundial + Top Brasil hardcoded):**
- Gere `data/top-world.json` e `data/top-br.json` manualmente usando as fontes do Topic 1.
- Use o script de "Sprint 2 pre-processing" para resolver cada entrada via Spotify API + Deezer ISRC lookup, persistindo no JSON.
- Endpoint backend `GET /api/top/world` e `GET /api/top/br` que retornam só `{title, artist, previewUrl, deezerId}` em ordem aleatorizada.

**Sprint 3 (Import de playlist externa):**
- Endpoint `POST /api/import` recebendo `{ url: string }`.
- Detecta plataforma (regex em `open.spotify.com`, `youtube.com`, `music.apple.com`).
- Para Spotify: usa `spotify-web-api-node` + pipeline 2.7.
- Para YouTube: chama Songlink em cada video ID (rate-limit aware: 6 segundos entre chamadas sem API key, ou pegue chave grátis para 60/min).
- Persiste no `track_resolve_cache` para reuso.

**Sprint 4+ (Top semanal dinâmico):**
- Cron job semanal (Fastify + node-cron ou Railway/Heroku scheduler).
- Pega Spotify playlist editorial "Top 50 — Brazil" (ID `37i9dQZEVXbMXbN3EUUhlg`) e "Top 50 — Global" (`37i9dQZEVXbMnDoIDOUMnO`).
- Resolve via pipeline existente.
- Substitui (ou aumenta) `data/top-world.json` em produção.

### 3.8 Avisos legais consolidados

- **Spotify API:** TOS exige attribution ("Powered by Spotify") em UI pública mostrando dados Spotify. Como SOMS toca **preview Deezer** e só usa Spotify para metadata, você está em zona limpa, mas ainda assim mostre "Track metadata via Spotify" em algum lugar para segurança.
- **Deezer API:** TOS permite uso não-comercial sem registro de app. Para uso comercial, registrar app em developers.deezer.com. Preview URLs são para "preview purposes only" — não persista o áudio.
- **YouTube API:** quota 10k/dia. Use exclusivamente para metadata + Songlink. Nunca para extrair áudio.
- **Songlink/Odesli:** sem restrição comercial. Email `developers@song.link` para chave (60 req/min em vez de 10).
- **MusicBrainz:** CC0/PD para dados; User-Agent obrigatório; 1 req/seg.
- **kworb.net, Pro-Música, Crowley:** scraping leve para uso interno (geração de seed list) é tolerável, mas evite redistribuir o dataset cru.

---

## Recommendations (resumo executivo para tomada de decisão)

1. **Sprint 2 — Faça hardcoded primeiro.** Resista à tentação de over-engineering. Duas listas JSON de ~150 músicas cada (mundial + Brasil), pré-resolvidas para Deezer track ID e preview URL, vão te dar 80% do valor de jogabilidade. Toma um dia de trabalho manual com Spotify + Deezer.
2. **Sprint 3 — Pipeline de import.** Comece com Spotify-only (mais limpo, mais determinístico via ISRC). Adicione YouTube na Sprint 3.5 ou 4 — YouTube exige Songlink ou yt-dlp + heurística de title parsing, mais frágil. Trate como "nice to have".
3. **Sempre cacheie em Postgres** com chave ISRC. Um lobby pode rejogar a mesma playlist mil vezes — você quer 0 chamadas externas no replay.
4. **Não construa o "top semanal" antes da Sprint 4.** Hardcoded é suficiente até você ter telemetria mostrando que jogadores estão pedindo musics novas.
5. **Não toque em Lavalink, Chromaprint, ou audio fingerprinting** — eles não pertencem a este projeto. Use só como referência arquitetural.
6. **Benchmarks para mudar de estratégia:**
   - Se o fuzzy match falhar em >20% das tracks de uma playlist típica → adicione MusicBrainz como camada extra.
   - Se Deezer cobertura BR mostrar buracos para sertanejo/funk → considere fallback secundário para YouTube (com Songlink) só para mostrar título, sem áudio.
   - Se o jogo virar comercial → revisite Spotify ToS e considere registrar app comercial Deezer.

## Caveats

- **Spotify Charts API foi descontinuada em 2024** para acesso público; o que ainda funciona é via Spotify Web API + IDs de playlists editoriais (`37i9dQZEVXb...`). Verifique periodicamente que os IDs não foram alterados.
- **Deezer `/track/isrc:` é endpoint NÃO documentado**, mas amplamente usado e estável há anos. Risco: Deezer pode mudar sem aviso. Tenha o fallback fuzzy pronto.
- **Pro-Música Brasil Top 50 Streaming** é fornecido pela BMAT a partir das DSPs — é mensal, não diário. Para reatividade, prefira Spotify Brasil Top 50.
- **Cobertura Deezer Brasil:** Deezer tem catálogo Brasil sólido, mas alguns nichos (funk muito recente, gospel independente) podem não ter preview. Detecte tracks sem `preview` no resolve pipeline e marque como "skip" no jogo.
- **A nomenclatura "Greatest of All Time"** da Billboard mistura métricas históricas (semanas no chart) com novos critérios (streaming inclusion desde 2013). "Blinding Lights" (2019) figura no #1 mesmo tendo só 4 semanas em #1, porque ficou **57 semanas no top 10 — record all-time do Hot 100** (também 43 semanas no top 5, 86 no top 40, 90 totais no chart). Não trate o ranking como "melhor música" — é "melhor performance no chart Billboard".
- **Não existe um chart "all-time Brasil" oficial.** Você terá que sintetizá-lo combinando ~12-24 meses de Pro-Música, Crowley e Spotify BR. Seja transparente com os jogadores que "Top Brasil" é uma seleção curada, não um chart oficial.
- **Songlink/Odesli rate limit sem API key é apertado (10/min).** Para uma playlist de 100 tracks via Songlink puro, isso é 10 minutos de espera. Combine com cache + use ISRC-direct para Spotify (evita Odesli) e use Odesli só para YouTube e fallbacks.