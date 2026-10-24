import { blockText } from './text';
import { Bloco } from './types';

/**
 * Percentual de texto alterado entre duas versões (R7.1, design §3.7), de 0 a 100.
 * Remove o prefixo e o sufixo comuns e mede o que sobrou em relação ao texto antigo.
 * Recebe texto puro: lacunas e negrito não contam como alteração (R7.4).
 */
export function changeRatio(antes: string, depois: string): number {
  if (antes === depois) return 0;
  const max = Math.min(antes.length, depois.length);
  let prefixo = 0;
  while (prefixo < max && antes[prefixo] === depois[prefixo]) prefixo++;
  let sufixo = 0;
  while (
    sufixo < max - prefixo &&
    antes[antes.length - 1 - sufixo] === depois[depois.length - 1 - sufixo]
  ) {
    sufixo++;
  }
  const alterado = Math.max(antes.length, depois.length) - prefixo - sufixo;
  return Math.min(100, Math.round((alterado / Math.max(1, antes.length)) * 100));
}

/** Percentual alterado entre duas versões de um bloco, ignorando marcações. */
export function blockChangeRatio(antes: Bloco, depois: Bloco): number {
  return changeRatio(blockText(antes), blockText(depois));
}

/** Estabilidade após uma edição grande (R7.3): ×0,4, mínimo de meio dia. */
export const FATOR_EDICAO = 0.4;
export const ESTABILIDADE_MINIMA_EDICAO = 0.5;

export interface EfeitoEdicao {
  pct: number;
  /** true = estabilidade reduzida e trecho volta para revisão hoje. */
  reduzir: boolean;
  novoS: number;
}

/** O que fazer com o estado FSRS depois de editar um trecho (R7.2–R7.3). */
export function editEffect(S: number, pct: number, limiteEdicao: number): EfeitoEdicao {
  const reduzir = S > 0 && pct > limiteEdicao;
  return {
    pct,
    reduzir,
    novoS: reduzir ? Math.max(ESTABILIDADE_MINIMA_EDICAO, S * FATOR_EDICAO) : S,
  };
}
