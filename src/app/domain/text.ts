import { Bloco, Segmento } from './types';

/**
 * Listas de segmentos de um bloco, cada uma um "campo" de texto contínuo:
 * o texto do bloco, cada item de lista ou cada célula de tabela.
 */
export function segmentArrays<S>(bloco: Bloco<S>): S[][] {
  switch (bloco.type) {
    case 'list':
      return bloco.items;
    case 'table':
      return bloco.rows.flat();
    case 'attach':
      return [];
    default:
      return [bloco.segs];
  }
}

/** Texto puro de uma lista de segmentos, sem marcações. */
export function segmentsText(segs: readonly { t: string }[]): string {
  return segs.map((s) => s.t).join('');
}

/** Texto puro do bloco; campos (itens, células) separados por quebra de linha. */
export function blockText(bloco: Bloco): string {
  if (bloco.type === 'attach') return bloco.name;
  return segmentArrays(bloco).map(segmentsText).join('\n');
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Palavras do bloco. Anexos não contam. */
export function blockWords(bloco: Bloco): number {
  return segmentArrays(bloco).reduce((sum, segs) => sum + countWords(segmentsText(segs)), 0);
}

export function blockGaps(bloco: Bloco): number {
  return segmentArrays<Segmento>(bloco)
    .flat()
    .filter((s) => s.k === 'g').length;
}
