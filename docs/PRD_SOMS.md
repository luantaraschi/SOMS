# PRD v0.1: SOMS

**Produto:** SOMS  
**Categoria:** Web party game musical  
**Status:** Conceito consolidado para MVP  
**Objetivo:** Criar um jogo web social de quiz musical, jogável por código de sala, focado em velocidade, memória musical, zoeira entre amigos, estatísticas engraçadas e momentos compartilháveis.

---

## Sumário

1. [Resumo do produto](#1-resumo-do-produto)
2. [Visão](#2-visão)
3. [Problema](#3-problema)
4. [Objetivos do MVP](#4-objetivos-do-mvp)
5. [Público-alvo](#5-público-alvo)
6. [Posicionamento](#6-posicionamento)
7. [Nome e identidade](#7-nome-e-identidade)
8. [Fonte musical e decisão técnica](#8-fonte-musical-e-decisão-técnica)
9. [Modos de jogo do MVP](#9-modos-de-jogo-do-mvp)
10. [Sala Caótica](#10-sala-caótica)
11. [Progressão, moedas e cosméticos](#11-progressão-moedas-e-cosméticos)
12. [Estatísticas engraçadas](#12-estatísticas-engraçadas)
13. [Títulos, badges e conquistas](#13-títulos-badges-e-conquistas)
14. [Momentos compartilháveis](#14-momentos-compartilháveis)
15. [Sistema de respostas aproximadas](#15-sistema-de-respostas-aproximadas)
16. [Fluxo do usuário](#16-fluxo-do-usuário)
17. [Requisitos funcionais](#17-requisitos-funcionais)
18. [Requisitos não funcionais](#18-requisitos-não-funcionais)
19. [Métricas de sucesso](#19-métricas-de-sucesso)
20. [Dados principais](#20-dados-principais)
21. [Configurações de sala](#21-configurações-de-sala)
22. [MVP técnico sugerido](#22-mvp-técnico-sugerido)
23. [Riscos](#23-riscos)
24. [Roadmap](#24-roadmap)
25. [Critérios de aceite do MVP](#25-critérios-de-aceite-do-mvp)
26. [Definição final do MVP recomendado](#26-definição-final-do-mvp-recomendado)
27. [Referências oficiais](#27-referências-oficiais)

---

## 1. Resumo do produto

**SOMS** é um party game musical web onde jogadores entram em uma sala por link ou código, ouvem trechos de músicas, tentam acertar nome, artista, feat ou contexto da música, competem por pontos e recebem ao final estatísticas engraçadas, títulos, badges e cards compartilháveis.

O jogo não deve ser apenas um "adivinhe a música". Ele deve funcionar como uma experiência social, parecida em espírito com jogos de sala como Gartic, Jackbox e SUS, onde o momento mais divertido muitas vezes não é só vencer, mas ver os amigos chutando errado, se expondo, reagindo rápido e criando piadas internas.

---

## 2. Visão

Transformar SOMS em uma plataforma simples, divertida e recorrente para jogar música com amigos, comunidades e grupos casuais.

A visão de longo prazo é que SOMS seja lembrado como:

> "Aquele jogo em que todo mundo acha que sabe a música, até começar a tocar."

---

## 3. Problema

O antigo formato de quiz musical em bots de Discord era divertido, mas limitado:

- dependia do Discord;
- tinha pouca interface visual;
- era pouco customizável;
- tinha baixo potencial de estatísticas, conquistas e compartilhamento;
- dependia fortemente de uma fonte de áudio específica;
- não aproveitava bem o potencial social do pós-rodada.

Além disso, o campo de previews do Spotify ficou menos confiável para novos casos de uso, já que a própria Spotify anunciou mudanças na Web API envolvendo remoção/restrição de "30-second preview URLs" para novos usos. Por isso, SOMS não deve depender do Spotify como fonte principal de reprodução.

---

## 4. Objetivos do MVP

O MVP deve validar se o loop principal é divertido, estável e repetível.

### Objetivos principais

- Permitir criar salas privadas por link ou código.
- Permitir jogar quiz musical em tempo real com amigos.
- Implementar os modos essenciais escolhidos.
- Aceitar respostas aproximadas com tolerância a erros.
- Criar placar ao vivo e ranking final.
- Gerar estatísticas engraçadas ao fim da partida.
- Gerar títulos, badges e momentos compartilháveis.
- Usar moedas apenas para cosméticos.
- Usar fonte musical viável para projeto sem fins lucrativos.
- Evitar dependência estrutural de uma única API de música.

### Não objetivos do MVP

- Não terá streamer mode no primeiro momento.
- Não terá party mode presencial no primeiro momento.
- Não terá power-ups que ajudem na partida.
- Não terá loja complexa.
- Não terá ranking global obrigatório.
- Não terá torneios.
- Não terá modo DJ rotativo.
- Não terá monetização.
- Não terá upload público de músicas protegidas por direitos autorais.

---

## 5. Público-alvo

### Público principal

- Grupos de amigos que jogam em call.
- Pessoas que gostam de música e jogos casuais.
- Comunidades de Discord, WhatsApp, Telegram e servidores privados.
- Grupos que já jogam Gartic, Stop, Among Us, Jackbox ou jogos de sala.

### Público secundário

- Fãs de gêneros específicos, como funk, rock, k-pop, anime, sertanejo, trap, pop e nostalgia anos 2000.
- Pessoas que querem jogar partidas rápidas sem criar conta.
- Comunidades que gostam de rankings e piadas internas.

---

## 6. Posicionamento

SOMS deve ser:

- rápido;
- social;
- engraçado;
- competitivo, mas não tóxico;
- fácil de entrar;
- difícil de dominar;
- justo;
- visualmente marcante;
- acessível para jogadores casuais.

SOMS não deve parecer:

- app de música tradicional;
- jogo sério demais;
- ferramenta de streaming;
- clone direto de bot de Discord;
- experiência pay to win.

---

## 7. Nome e identidade

### Nome oficial

**SOMS**

### Frase guia

**Todo mundo acha que sabe.**

### Taglines possíveis

- "Chute a música antes dos seus amigos."
- "Ouça, chute, passe vergonha."
- "O quiz musical que expõe seu gosto."
- "Você sabe mesmo ou só chuta Drake?"
- "Acerte o som. Exponha o grupo."

---

## 8. Fonte musical e decisão técnica

### Decisão recomendada

Para o MVP, a fonte principal deve ser:

- **Deezer** para previews/reprodução;
- **MusicBrainz** para metadados musicais;
- **Cover Art Archive** para capas quando possível;
- **Spotify** apenas para importar playlists, não para playback;
- **YouTube** apenas como fallback futuro, fora do MVP.

A Deezer é a melhor escolha inicial porque suas guidelines documentam acesso a extratos de 30 segundos pela API em diferentes tipos de usuários, o que se encaixa melhor no formato de quiz musical com trechos curtos.

Mesmo assim, a Deezer deve ser tratada como dependência externa com risco. Seus termos informam que a empresa pode modificar, restringir ou remover o acesso à API a qualquer momento, então a arquitetura precisa permitir troca de provedor no futuro.

MusicBrainz deve ser usado para metadados porque sua API exige identificação adequada via User-Agent e é adequada para consultas estruturadas de dados musicais, desde que o sistema respeite boas práticas e limites de uso.

Cover Art Archive pode complementar capas, pois fornece metadados de capas associados a releases do MusicBrainz e retorna informações em JSON.

### Regras importantes

- O sistema não deve baixar áudio protegido.
- O sistema não deve armazenar arquivos de áudio de músicas comerciais.
- O sistema deve armazenar apenas metadados, IDs, rankings, respostas e estatísticas.
- O sistema deve exibir atribuição/link quando exigido pelo provedor.
- O sistema deve ser preparado para fallback caso uma música não tenha preview disponível.
- O sistema deve avisar ao host quando uma playlist tiver músicas indisponíveis.

---

## 9. Modos de jogo do MVP

### 9.1 Modo Clássico Turbinado

#### Descrição

Modo principal do SOMS. Um trecho de música toca e os jogadores tentam acertar o nome da música, artista e, quando existir, feat.

#### Objetivo do jogador

Acertar o máximo possível antes dos outros jogadores.

#### Pontuação sugerida

| Ação | Pontos |
|---|---:|
| Acertar nome da música | 100 |
| Acertar artista principal | 60 |
| Acertar feat | 40 |
| Acertar música + artista | +30 bônus |
| Acertar música + artista + feat | +50 bônus |
| Acertar muito rápido | bônus decrescente |
| Streak de 3 rounds | multiplicador leve |

#### Regras

- Jogador pode enviar múltiplas respostas durante o tempo da rodada.
- Respostas aproximadas podem gerar feedback de "quase".
- O jogador pode acertar música e artista separadamente.
- O sistema deve revelar a resposta ao fim do round.
- O sistema deve mostrar quem acertou primeiro, quem quase acertou e quem chutou algo engraçado.

---

### 9.2 Modo Playlist Wars

#### Descrição

Jogadores ou times enviam playlists. O sistema mistura músicas dessas playlists e cria uma competição entre repertórios.

#### Objetivo do jogador

Acertar músicas vindas das playlists e provar que conhece melhor o repertório da sala.

#### Regras

- O host pode adicionar playlists.
- Jogadores podem sugerir playlists, se permitido.
- O sistema valida disponibilidade de previews.
- Músicas indisponíveis são ignoradas ou substituídas.
- O sistema deve evitar vantagem excessiva de quem enviou a playlist.

#### Regra anti-vantagem

Quando tocar uma música de uma playlist enviada por um jogador específico, esse jogador recebe uma pequena limitação:

- delay de 3 segundos para responder; ou
- pontuação reduzida naquela música; ou
- só pode pontuar por artista, não por nome da música.

Para o MVP, a opção mais simples é:

**Jogador dono da playlist tem delay de 3 segundos naquela rodada.**

---

### 9.3 Modo Blind Test Extremo

#### Descrição

Modo hardcore baseado em trechos extremamente curtos.

#### Objetivo do jogador

Reconhecer a música com pouquíssimo áudio.

#### Configurações

- 1 segundo;
- 3 segundos;
- 5 segundos.

#### Regras

- Sem hints.
- Sem capa antes do reveal.
- Sem múltipla escolha.
- Pontuação maior por dificuldade.
- Pode ter ranking separado dentro da partida.

#### Pontuação sugerida

| Duração | Multiplicador |
|---|---:|
| 5 segundos | 1x |
| 3 segundos | 1.5x |
| 1 segundo | 2x |

---

### 9.4 Modo Capa Revelada

#### Descrição

A capa da música ou álbum aparece oculta e vai sendo revelada gradualmente. O jogador tenta acertar a música, artista ou álbum.

#### Objetivo do jogador

Reconhecer a música pela capa antes dos outros.

#### Variações possíveis

- Capa com blur reduzindo.
- Mosaico revelando blocos.
- Zoom afastando aos poucos.
- Capa em preto e branco indo para colorida.

#### MVP

Para o MVP, usar apenas:

**mosaico revelando blocos progressivamente.**

#### Regras

- O host pode escolher se o áudio toca junto ou não.
- Se o áudio não tocar, vale mais ponto.
- O sistema deve exibir a capa original no reveal.
- O sistema deve respeitar a atribuição e restrições do provedor de imagem.

---

### 9.5 Modo "Quem Cantou Isso?"

#### Descrição

Modo mais acessível, baseado em múltipla escolha. Toca um trecho e os jogadores escolhem entre opções de artistas.

#### Objetivo do jogador

Identificar o artista correto.

#### Regras

- O sistema mostra 4 opções.
- Apenas uma resposta por jogador.
- Quanto mais rápido responder corretamente, mais pontos.
- Errar trava a resposta daquela rodada.
- Pode ser usado como modo independente ou como rodada especial.

#### Variações futuras

- "Qual é a década?"
- "Qual é o gênero?"
- "Qual é o feat?"
- "Qual é o álbum?"
- "Qual país?"

---

## 10. Sala Caótica

Sala Caótica não é um modo separado no MVP. Ela será um **preset de sala** que ativa regras especiais por rodada.

### Preset

**Sala Caótica = Modo Clássico Turbinado + Regras Especiais em intensidade Caótica**

### Opções de regras especiais

Na criação da sala:

| Opção | Comportamento |
|---|---|
| Desligado | Nenhuma regra especial |
| Leve | Algumas rodadas têm regra especial |
| Caótico | Toda rodada tem regra especial |

### Exemplos de regras especiais

- Só vale artista.
- Só vale música.
- Feat vale dobrado.
- Resposta única.
- Rodada de pontos dobrados.
- Capa aparece antes do áudio.
- Áudio toca só 3 segundos.
- Hint aparece mais cedo.
- Último colocado ganha dica visual.
- Líder começa com delay de 2 segundos.
- Todos recebem a primeira letra.
- Sem bônus de velocidade.

---

## 11. Progressão, moedas e cosméticos

### Princípio

Moedas nunca devem dar vantagem competitiva.

### Como ganhar moedas

- Jogar partidas.
- Completar conquistas.
- Vencer partidas.
- Participar de modos diferentes.
- Desbloquear estatísticas curiosas.
- Manter streak de dias, futuramente.

### Como gastar moedas

- Avatares;
- molduras;
- efeitos de acerto;
- efeitos de erro;
- reações;
- temas de sala;
- animações de pódio;
- cartas de perfil;
- stickers;
- títulos visuais.

### Exemplos de cosméticos

- Moldura "Ouvido de Ouro".
- Efeito "Palco Iluminado".
- Efeito "Disco Riscado".
- Tema "Rádio Pirata".
- Tema "Balada 2000".
- Reação "Chutou Drake".
- Reação "Quase, quase".

---

## 12. Estatísticas engraçadas

### Objetivo

Transformar a partida em uma história compartilhável.

O sistema deve registrar eventos para gerar frases como:

- "Memi chutou Drake em 8 dos 10 rounds."
- "Luan chutou Kanye West nos primeiros 2 segundos."
- "Ana acertou 4 músicas antes de qualquer pessoa digitar."
- "Pedro quase acertou 6 vezes."
- "João errou tudo, mas foi consistente."
- "A sala inteira confundiu Rihanna com Beyoncé."
- "Ninguém acertou o feat de nenhuma música."
- "Carlos desbloqueou o título: Confiante e Errado."

### Eventos rastreados

- Respostas enviadas.
- Tempo de resposta.
- Respostas repetidas.
- Artistas mais chutados.
- Músicas mais chutadas.
- Erros próximos.
- Acertos por categoria.
- Primeiro acerto da rodada.
- Último acerto da rodada.
- Streaks.
- Jogador mais rápido.
- Jogador mais insistente.
- Jogador que mais chutou o mesmo artista.

---

## 13. Títulos, badges e conquistas

### Títulos

- Ouvido de Ouro
- Rei do Refrão
- Caçador de Feat
- Confiante e Errado
- Chutador Profissional
- Quase Gênio
- Radar de Hit
- Capa Humana
- Bot de Shazam
- Mestre dos 3 Segundos
- Último Segundo
- Nostálgico Oficial
- Pessoa que Sempre Chuta Drake
- Sem Vergonha Musical

### Badges

| Badge | Critério |
|---|---|
| Primeiro Som | Jogar a primeira partida |
| Primeira Vitória | Vencer uma partida |
| Flash Musical | Acertar em menos de 2 segundos |
| Caçador de Feat | Acertar 10 feats |
| Capa Humana | Acertar 10 capas |
| Blindado | Vencer no Blind Test |
| Quase Lá | Receber 10 feedbacks de "quase" |
| Teimoso | Enviar 20 respostas em uma partida |
| Drake Interno | Chutar o mesmo artista 5 vezes |
| Virada | Sair do último lugar e vencer |
| Sala Caótica | Vencer uma sala com regras caóticas |

---

## 14. Momentos compartilháveis

### Objetivo

Gerar cards que os jogadores queiram mandar no WhatsApp, Instagram, Discord ou salvar.

### Cards do MVP

- Pódio final.
- Estatística engraçada da partida.
- Maior acerto rápido.
- Maior vergonha.
- Maior quase.
- Música que ninguém acertou.
- Jogador mais insistente.
- Jogador mais rápido.
- Jogador mais aleatório.

### Formatos

- Imagem vertical para stories.
- Imagem quadrada para feed/chat.
- Texto copiável.
- Link da partida, futuramente.

---

## 15. Sistema de respostas aproximadas

### Objetivo

Evitar frustração por erros pequenos.

### Deve aceitar

- Maiúsculas e minúsculas.
- Acentos ou ausência de acentos.
- Erros leves de digitação.
- Abreviações conhecidas.
- Apelidos de artistas.
- Ordem parcialmente trocada.
- "feat", "ft", "part", "com".
- Nome artístico alternativo.

### Estados de resposta

| Estado | Resultado |
|---|---|
| Correto | Ganha pontos |
| Quase | Mostra feedback e permite tentar de novo |
| Errado | Não pontua |

### Exemplos

**Kanye West**

Aceitar:

- kanye west
- kanye
- ye, se cadastrado como alias
- kenye west como quase ou correto com baixa penalidade

**Charlie Brown Jr.**

Aceitar:

- charlie brown jr
- charlie brown junior
- charlie brown
- cbjr

### Regras anti-abuso

- Respostas genéricas demais não pontuam.
- Uma palavra isolada só vale se for distintiva.
- O sistema deve evitar que "love", "amor", "baby" ou termos comuns sejam aceitos sozinhos.
- O host pode definir tolerância: baixa, média ou alta.

---

## 16. Fluxo do usuário

### 16.1 Criar sala

1. Usuário acessa SOMS.
2. Clica em "Criar sala".
3. Define nome/apelido.
4. Escolhe modo.
5. Escolhe fonte musical.
6. Define número de rounds.
7. Escolhe regras especiais: desligado, leve ou caótico.
8. Cria sala.
9. Compartilha código ou link.

### 16.2 Entrar na sala

1. Jogador acessa link ou digita código.
2. Escolhe apelido.
3. Escolhe avatar básico.
4. Entra no lobby.
5. Aguarda host iniciar.

### 16.3 Durante o round

1. Tela mostra contagem regressiva.
2. Música, capa ou pergunta aparece.
3. Jogadores respondem.
4. Sistema valida em tempo real.
5. Acertos aparecem com animação.
6. Ao fim, resposta é revelada.
7. Pontos são distribuídos.
8. Estatísticas rápidas aparecem.

### 16.4 Final da partida

1. Sistema mostra pódio.
2. Mostra ranking completo.
3. Mostra estatísticas engraçadas.
4. Entrega badges ou títulos desbloqueados.
5. Gera cards compartilháveis.
6. Host pode iniciar revanche.

---

## 17. Requisitos funcionais

### Salas

- Criar sala.
- Entrar por código.
- Entrar por link.
- Listar jogadores no lobby.
- Host pode iniciar partida.
- Host pode remover jogador.
- Host pode encerrar sala.
- Jogador pode reconectar se cair.

### Partida

- Suportar múltiplos rounds.
- Controlar tempo por rodada.
- Sincronizar estado da rodada entre jogadores.
- Validar respostas em tempo real.
- Calcular pontos.
- Exibir ranking.
- Exibir reveal.
- Gerar resumo final.

### Música

- Buscar músicas por tema, playlist ou seleção.
- Verificar disponibilidade de preview.
- Tocar trecho da música.
- Trocar música indisponível.
- Armazenar metadados.
- Não armazenar áudio protegido.

### Modos

- Clássico Turbinado.
- Playlist Wars.
- Blind Test Extremo.
- Capa Revelada.
- Quem Cantou Isso.
- Sala Caótica como preset.

### Estatísticas

- Registrar respostas.
- Registrar tempos.
- Registrar acertos.
- Registrar erros próximos.
- Registrar padrões engraçados.
- Gerar frases pós-partida.
- Gerar cards.

### Progressão

- Dar moedas por participação.
- Dar moedas por conquistas.
- Desbloquear badges.
- Desbloquear títulos.
- Permitir equipar cosméticos simples.

---

## 18. Requisitos não funcionais

### Performance

- A validação de respostas deve parecer instantânea.
- O estado da rodada deve ser sincronizado em tempo real.
- O jogo deve funcionar bem em desktop e mobile.
- O lobby deve carregar rapidamente.
- O sistema deve lidar com reconexão.

### Escalabilidade inicial

- MVP deve suportar salas pequenas e médias.
- Meta inicial: 2 a 20 jogadores por sala.
- Futuramente: até 50 jogadores por sala.

### Segurança

- Sanitizar apelidos e mensagens.
- Impedir scripts em nomes ou respostas.
- Limitar spam de respostas.
- Rate limit por jogador.
- Moderação básica de nomes ofensivos.
- Não expor chaves de APIs no frontend.

### Legal e compliance

- Não baixar, armazenar ou redistribuir áudio protegido.
- Respeitar termos dos provedores.
- Manter links/atribuições quando exigidos.
- Deixar claro que o projeto é sem fins lucrativos.
- Ter fallback para músicas indisponíveis.

---

## 19. Métricas de sucesso

### Métricas de diversão

- Média de rounds jogados por sala.
- Percentual de salas que jogam revanche.
- Tempo médio por sessão.
- Quantidade de cards compartilhados.
- Percentual de jogadores que jogam mais de uma partida.

### Métricas de qualidade

- Taxa de músicas indisponíveis.
- Taxa de respostas "quase".
- Reclamações sobre respostas corretas não aceitas.
- Latência média de validação.
- Quedas ou desconexões por partida.

### Métricas de retenção

- Jogadores que voltam em 7 dias.
- Salas criadas por usuário recorrente.
- Modos mais jogados.
- Cosméticos mais equipados.
- Badges mais desbloqueados.

---

## 20. Dados principais

### User

- id
- nickname
- avatar
- coins
- equippedTitle
- equippedBadge
- createdAt

### Room

- id
- code
- hostId
- mode
- status
- settings
- createdAt

### Game

- id
- roomId
- mode
- rounds
- currentRound
- status
- startedAt
- endedAt

### Round

- id
- gameId
- trackId
- mode
- specialRule
- startedAt
- endedAt
- correctAnswers

### Track

- id
- provider
- providerTrackId
- title
- artists
- feats
- album
- coverUrl
- previewUrl
- duration
- releaseYear
- aliases

### Guess

- id
- roundId
- userId
- rawText
- normalizedText
- result
- matchedField
- score
- submittedAt
- responseTime

### Achievement

- id
- name
- description
- criteria
- rewardCoins

### Cosmetic

- id
- type
- name
- price
- rarity

---

## 21. Configurações de sala

### Básicas

- Nome da sala.
- Modo.
- Número de rounds.
- Tempo por round.
- Fonte musical.
- Dificuldade.
- Individual ou times.

### Avançadas

- Permitir feat.
- Permitir hints.
- Respostas aproximadas.
- Tolerância de resposta.
- Regras especiais.
- Intensidade das regras especiais.
- Mostrar capa no reveal.
- Gerar cards ao final.

### Presets

- Casual.
- Hardcore.
- Playlist Wars.
- Blind Test.
- Capa Revelada.
- Quem Cantou Isso.
- Sala Caótica.

---

## 22. MVP técnico sugerido

### Frontend

- Next.js ou React.
- Interface responsiva.
- Tela de lobby.
- Tela de partida.
- Tela de ranking.
- Tela de resumo final.
- Cards compartilháveis gerados no client ou server.

### Backend

- Node.js.
- WebSocket para partidas em tempo real.
- REST ou RPC para operações simples.
- Banco relacional para dados principais.
- Redis para estado de sala em tempo real, se necessário.
- Worker para buscar e normalizar músicas.

### Banco

- PostgreSQL para dados persistentes.
- Redis para salas ativas, timers e presença.

### Serviços

- Deezer Provider.
- MusicBrainz Provider.
- Cover Art Provider.
- Playlist Importer.
- Answer Matching Service.
- Stats Engine.
- Card Generator.

---

## 23. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Música sem preview | Alto | Validar playlist antes da partida e substituir faixas |
| API externa restringir acesso | Alto | Criar camada abstrata de provider |
| Resposta correta não ser aceita | Alto | Sistema de aliases, normalização e feedback "quase" |
| Jogador spammar respostas | Médio | Rate limit por jogador |
| Latência em tempo real | Alto | WebSocket e estado de sala otimizado |
| Direitos autorais | Alto | Não armazenar áudio, usar apenas previews permitidos e seguir termos |
| Capa indisponível | Médio | Fallback para capa genérica ou outro provider |
| Jogo ficar repetitivo | Médio | Regras especiais opcionais e modos variados |

---

## 24. Roadmap

### Fase 1: Protótipo jogável

- Criar sala.
- Entrar por código.
- Tocar preview.
- Receber respostas.
- Validar resposta simples.
- Pontuar.
- Mostrar ranking.

### Fase 2: MVP fechado

- Clássico Turbinado.
- Blind Test.
- Quem Cantou Isso.
- Respostas aproximadas.
- Estatísticas pós-partida.
- Cards simples.
- Deezer Provider.
- MusicBrainz metadata.

### Fase 3: MVP completo

- Playlist Wars.
- Capa Revelada.
- Sala Caótica.
- Badges.
- Títulos.
- Moedas cosméticas.
- Loja cosmética simples.
- Cards compartilháveis melhores.

### Fase 4: Pós-MVP

- Ranking semanal.
- Times avançados.
- Mais cosméticos.
- Packs temáticos.
- Party mode presencial.
- Streamer mode.
- Torneios.
- Eventos sazonais.

---

## 25. Critérios de aceite do MVP

O MVP será considerado validado quando:

- Um host conseguir criar uma sala.
- Jogadores conseguirem entrar por código ou link.
- A sala conseguir jogar uma partida completa.
- Pelo menos 3 modos estiverem funcionais.
- O sistema conseguir tocar previews disponíveis.
- O sistema conseguir substituir músicas indisponíveis.
- Respostas aproximadas funcionarem de forma aceitável.
- Ranking final for gerado corretamente.
- Estatísticas engraçadas aparecerem ao final.
- Pelo menos 1 card compartilhável for gerado.
- Moedas forem concedidas sem afetar gameplay.
- Pelo menos badges e títulos básicos forem desbloqueáveis.

---

## 26. Definição final do MVP recomendado

Para não inflar demais, o primeiro MVP público deve ter:

1. **Clássico Turbinado**
2. **Blind Test Extremo**
3. **Quem Cantou Isso**
4. **Regras especiais opcionais**
5. **Estatísticas engraçadas**
6. **Badges e títulos básicos**
7. **Cards compartilháveis**
8. **Moedas cosméticas**
9. **Deezer + MusicBrainz + Cover Art Archive**
10. **Spotify apenas como importador de playlist, se for simples implementar**

Playlist Wars e Capa Revelada são muito boas, mas podem entrar logo depois do primeiro teste fechado se o objetivo for lançar mais rápido. Se a intenção for uma versão mais cheia já no primeiro lançamento, elas entram no MVP completo, mas aumentam bastante o escopo.

Recomendação estratégica:

**Primeiro validar o prazer de jogar o Clássico, o Blind Test e o Quem Cantou Isso. Depois adicionar Playlist Wars e Capa Revelada como expansão natural.**

---

## 27. Referências oficiais

- Spotify for Developers, mudanças na Web API em 27 de novembro de 2024: https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api
- Deezer Developers, API: https://developers.deezer.com/api
- Deezer Developers, Terms of Use: https://developers.deezer.com/termsofuse
- MusicBrainz API Rate Limiting: https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting
- Cover Art Archive API: https://musicbrainz.org/doc/Cover_Art_Archive/API

---

## Observação

Este PRD é uma versão inicial para orientar produto, escopo e arquitetura. Antes de lançamento público, é recomendado revisar os termos atualizados das APIs usadas e validar juridicamente qualquer uso de áudio, capa, metadados e links externos.
