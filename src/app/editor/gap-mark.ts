import { Editor, Mark, mergeAttributes } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import { newId } from '../domain/ids';
import { IntervaloLacuna, MARCA_LACUNA, aparar, lacunasSobrepostas } from './gap-ranges';
import { MARCA_SIGLA } from './sigla-mark';

/**
 * Lacuna manual: marca de texto com id estável (R3.5).
 * - Não convive com negrito nem com sigla (a lacuna vence).
 * - Digitar na borda não estende a lacuna.
 * - Ao colar HTML, ganha id novo (evita duas lacunas com o mesmo id).
 */
export const GapMark = Mark.create({
  name: MARCA_LACUNA,
  inclusive: false,
  excludes: `bold ${MARCA_SIGLA}`,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: () => newId('g'),
        renderHTML: (attrs) => ({ 'data-gap': attrs['id'] }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-gap]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'lacuna' }), 0];
  },
});

export type ResultadoOcultar =
  | { status: 'ok' | 'ajustada' | 'desfeita'; texto: string; id: string }
  | { status: 'vazia' }
  | { status: 'atravessa' };

export const MENSAGEM_OCULTAR: Record<'vazia' | 'atravessa', string> = {
  vazia: 'Selecione um texto do resumo para ocultar como lacuna.',
  atravessa: 'Selecione dentro de um mesmo trecho de texto, sem atravessar lacunas ou negritos.',
};

export function hideSelection(editor: Editor, id = newId('g')): ResultadoOcultar {
  const sel = editor.state.selection;
  if (!(sel instanceof TextSelection) || sel.empty) return { status: 'vazia' };
  if (sel.$from.parent !== sel.$to.parent) return { status: 'atravessa' };
  const alvo = aparar(editor.state.doc, sel);
  if (alvo.from >= alvo.to) return { status: 'vazia' };
  const sobrepostas = lacunasSobrepostas(sel.$from, alvo);
  if (sobrepostas.length > 1) return { status: 'atravessa' };
  const [antiga] = sobrepostas;
  const lacuna = { ...alvo, id: antiga?.id ?? id };
  marcarLacuna(editor, lacuna, antiga);
  const texto = editor.state.doc.textBetween(alvo.from, alvo.to);
  return { status: antiga ? 'ajustada' : 'ok', texto, id: lacuna.id };
}

function marcarLacuna(editor: Editor, lacuna: IntervaloLacuna, antiga?: IntervaloLacuna): void {
  const { schema, tr } = editor.state;
  const gap = schema.marks[MARCA_LACUNA];
  if (antiga) tr.removeMark(antiga.from, antiga.to, gap);
  tr.removeMark(lacuna.from, lacuna.to, schema.marks['bold']);
  tr.removeMark(lacuna.from, lacuna.to, schema.marks[MARCA_SIGLA]);
  tr.addMark(lacuna.from, lacuna.to, gap.create({ id: lacuna.id }));
  tr.setSelection(TextSelection.create(tr.doc, lacuna.to));
  editor.view.dispatch(tr);
}
