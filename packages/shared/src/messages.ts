/**
 * Mensagens pt-BR padronizadas para erros e estados de UI.
 *
 * Princípio: tom SOMS — lowercase, leve, sem emoji, sem ponto de exclamação
 * exceto em momentos de explosão. Erros são secos, sem culpar o jogador.
 */

/**
 * Mensagem do erro `INSUFFICIENT_TRACKS` (Sprint 1 / Bloco E3).
 * Emitida pelo server quando Provider Deezer + cache do Postgres não juntam
 * `totalRounds` tracks para a combinação de gêneros/décadas escolhida.
 *
 * @param count quantas tracks foram encontradas (pode ser 0).
 */
export function insufficientTracksMessage(count: number): string {
  if (count === 0) {
    return 'não achei nenhuma música pra essa combinação. afrouxa um pouco — adiciona um gênero ou década.';
  }
  if (count === 1) {
    return 'só achei 1 música pra essa combinação. afrouxa um pouco — adiciona um gênero ou década.';
  }
  return `só achei ${count} músicas pra essa combinação. afrouxa um pouco — adiciona um gênero ou década.`;
}

