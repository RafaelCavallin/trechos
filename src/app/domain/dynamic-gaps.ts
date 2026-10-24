import { Bloco, BlocoRevisao, Densidade, Modo, Segmento, SegmentoDinamico, Trecho } from './types';

/** A cada quantas palavras candidatas uma vira lacuna (design §3.3). 0 = nenhuma. */
export function dynamicGapInterval(modo: Modo, densidade: Densidade): number {
  if (modo === 'densas') return 2;
  if (modo === 'lacunas') return { baixa: 8, média: 5, alta: 3 }[densidade];
  return 0;
}

/** Palavra candidata: 7+ letras, com pontuação final opcional. */
const CANDIDATA = /^(\p{L}{7,})([.,;:!?)]*)$/u;

/**
 * Gera as lacunas dinâmicas do trecho (R10.3, design §3.3).
 * Nunca em títulos/subtítulos, negritos, lacunas manuais, anexos ou no cabeçalho
 * de tabelas. É determinístico: o mesmo texto gera sempre as mesmas lacunas,
 * com ids `d:<bloco>:<caminho>:<segmento>:<palavra>`.
 */
export function generateDynamicGaps(
  trecho: Pick<Trecho, 'blocos'>,
  modo: Modo,
  densidade: Densidade,
): BlocoRevisao[] {
  const n = dynamicGapInterval(modo, densidade);
  if (n === 0) return [...trecho.blocos];

  let contador = 0;
  const expandir = (segs: Segmento[], blocoId: string, caminho: string) => {
    const saida: (Segmento | SegmentoDinamico)[] = [];
    segs.forEach((seg, si) => {
      if (seg.k !== 't' || seg.b) {
        saida.push(seg);
        return;
      }
      let buffer = '';
      seg.t.split(/(\s+)/).forEach((parte, wi) => {
        const m = CANDIDATA.exec(parte);
        if (m && ++contador % n === 0) {
          if (buffer) saida.push({ k: 't', t: buffer });
          saida.push({ k: 'd', id: `d:${blocoId}:${caminho}:${si}:${wi}`, t: m[1] });
          buffer = m[2];
        } else {
          buffer += parte;
        }
      });
      if (buffer) saida.push({ k: 't', t: buffer });
    });
    return saida;
  };

  return trecho.blocos.map((bloco): BlocoRevisao => {
    switch (bloco.type) {
      case 'h2':
      case 'h3':
      case 'attach':
        return bloco;
      case 'list':
        return {
          ...bloco,
          items: bloco.items.map((it, i) => expandir(it, bloco.id, `items.${i}`)),
        };
      case 'table':
        return {
          ...bloco,
          rows: bloco.rows.map((row, ri) =>
            ri === 0 ? row : row.map((cell, ci) => expandir(cell, bloco.id, `rows.${ri}.${ci}`)),
          ),
        };
      default:
        return { ...bloco, segs: expandir(bloco.segs, bloco.id, 'segs') } as Bloco<
          Segmento | SegmentoDinamico
        >;
    }
  });
}
