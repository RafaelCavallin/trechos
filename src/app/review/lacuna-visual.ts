import { ItemVerificavel } from '../domain/review';
import { SegmentoDinamico, SegmentoLacuna } from '../domain/types';
import { EstadoLacuna, VisualLacuna } from '../shared/block-view/block-view';
import { Sessao, podeMarcar } from './session';

const TITULO_MARCAR = 'Clique para marcar acerto ou erro';

export interface ContextoVisual {
  sessao: Sessao | null;
  itens: readonly ItemVerificavel[];
  foco: number;
}

export type VisualDaLacuna = (seg: SegmentoLacuna | SegmentoDinamico) => VisualLacuna;

export function visualDaLacuna({ sessao, itens, foco }: ContextoVisual): VisualDaLacuna {
  const numeros = new Map(itens.map((i) => [i.id, i.num]));
  const focado = sessao && podeMarcar(sessao) ? itens[foco]?.id : undefined;
  return (seg) => {
    const dinamica = seg.k === 'd';
    if (!sessao?.revelado) {
      return { estado: dinamica ? 'oculta-dinamica' : 'oculta', numero: numeros.get(seg.id) };
    }
    return {
      estado: estadoRevelado(sessao.marcas[seg.id], dinamica),
      clicavel: !sessao.resultado,
      titulo: sessao.resultado ? undefined : TITULO_MARCAR,
      focado: seg.id === focado,
    };
  };
}

function estadoRevelado(marca: boolean | undefined, dinamica: boolean): EstadoLacuna {
  if (marca === true) return 'acertou';
  if (marca === false) return 'errou';
  return dinamica ? 'revelada-dinamica' : 'revelada';
}
