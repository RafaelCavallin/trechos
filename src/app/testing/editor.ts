import { Editor } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import { ATOS_ADMINISTRATIVOS } from '../domain/examples';
import { Bloco } from '../domain/types';
import { BlocoDeTexto, blockToDoc, docToBlock, formaDoBloco } from '../editor/doc-conversion';
import { extensionsFor } from '../editor/schema';

export const blocosDeExemplo = Object.fromEntries(
  ATOS_ADMINISTRATIVOS.map((b) => [b.id, b]),
) as Record<string, Bloco>;

function posicaoDoTexto(editor: Editor, alvo: string): number {
  let achou: number | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (achou !== null || !node.isTextblock) return;
    const i = node.textContent.indexOf(alvo);
    if (i >= 0) achou = pos + 1 + i;
  });
  if (achou === null) throw new Error(`texto não encontrado: ${alvo}`);
  return achou;
}

export function editorPara(bloco: BlocoDeTexto) {
  const editor = new Editor({
    element: null,
    extensions: extensionsFor(formaDoBloco(bloco)),
    content: blockToDoc(bloco),
  });
  const ler = () => docToBlock(bloco, editor.getJSON());
  const selecionar = (alvo: string, de = 0, ate = alvo.length) => {
    const inicio = posicaoDoTexto(editor, alvo);
    const selecao = TextSelection.create(editor.state.doc, inicio + de, inicio + ate);
    editor.view.dispatch(editor.state.tr.setSelection(selecao));
  };
  return { editor, ler, selecionar };
}
