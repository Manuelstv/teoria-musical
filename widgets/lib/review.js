// Lógica pura de revisão espaçada estilo Leitner (D-01/D-02) e métrica de acerto (SYS-06).
// Sem estado, sem I/O — só funções puras testáveis por `node --test`.

export const BOXES = ['box-1-ainda-nao-sei', 'box-2-quase-la', 'box-3-ja-sei'];

/**
 * Calcula o próximo índice de caixa Leitner.
 * @param {number} index - índice atual (0..BOXES.length-1)
 * @param {'forward'|'back'} result - 'forward' (acertou, avança) ou 'back' (errou, recua)
 * @returns {number} próximo índice, com clamp nas pontas
 */
export function nextBox(index, result) {
  const delta = result === 'forward' ? 1 : -1;
  return Math.max(0, Math.min(BOXES.length - 1, index + delta));
}

/**
 * % de acerto sem divisão por zero (SYS-06).
 * @param {number} correct
 * @param {number} attempts
 * @returns {number}
 */
export function accuracy(correct, attempts) {
  return attempts === 0 ? 0 : correct / attempts;
}
