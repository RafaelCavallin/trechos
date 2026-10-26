import { Mark, mergeAttributes } from '@tiptap/core';
import { ResolvedPos } from '@tiptap/pm/model';
import { Selection } from '@tiptap/pm/state';
import { Intervalo } from './gap-ranges';

export const MARCA_SIGLA = 'sigla';
const ATRIBUTO_NOTA = 'data-nota';

export interface IntervaloSigla extends Intervalo {
  nota: string;
}

export const SiglaMark = Mark.create({
  name: MARCA_SIGLA,
  inclusive: false,
  addAttributes() {
    return {
      nota: {
        default: '',
        parseHTML: (el: HTMLElement) => el.getAttribute(ATRIBUTO_NOTA) ?? '',
        renderHTML: (attrs) => ({ [ATRIBUTO_NOTA]: attrs['nota'], title: attrs['nota'] }),
      },
    };
  },
  parseHTML() {
    return [{ tag: `abbr[${ATRIBUTO_NOTA}]` }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['abbr', mergeAttributes(HTMLAttributes, { class: 'sigla' }), 0];
  },
});

function siglasDoTexto($pos: ResolvedPos): IntervaloSigla[] {
  const siglas: IntervaloSigla[] = [];
  const inicio = $pos.start();
  $pos.parent.forEach((node, offset) => {
    const nota = node.marks.find((m) => m.type.name === MARCA_SIGLA)?.attrs['nota'];
    if (!nota) return;
    const from = inicio + offset;
    const anterior = siglas.at(-1);
    if (anterior?.to === from && anterior.nota === nota) anterior.to = from + node.nodeSize;
    else siglas.push({ from, to: from + node.nodeSize, nota });
  });
  return siglas;
}

export function siglaNoCursor(selecao: Selection): IntervaloSigla | null {
  const { $from, $to, from, to, empty } = selecao;
  if ($from.parent !== $to.parent) return null;
  const dentro = (s: IntervaloSigla) =>
    empty ? s.from < from && from < s.to : s.from <= from && to <= s.to;
  return siglasDoTexto($from).find(dentro) ?? null;
}
