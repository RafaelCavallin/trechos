import { Editor } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import { MENSAGEM_OCULTAR, ResultadoOcultar, hideSelection } from './gap-mark';
import { IntervaloLacuna, MARCA_LACUNA, lacunaParaDesocultar } from './gap-ranges';

export function desocultar(editor: Editor, lacuna: IntervaloLacuna): ResultadoOcultar {
  const { schema, tr, doc } = editor.state;
  tr.removeMark(lacuna.from, lacuna.to, schema.marks[MARCA_LACUNA]);
  tr.setSelection(TextSelection.create(tr.doc, lacuna.to));
  editor.view.dispatch(tr);
  return { status: 'desfeita', texto: doc.textBetween(lacuna.from, lacuna.to), id: lacuna.id };
}

export function alternarLacuna(editor: Editor): ResultadoOcultar {
  const lacuna = lacunaParaDesocultar(editor.state);
  return lacuna ? desocultar(editor, lacuna) : hideSelection(editor);
}

const ROTULO_RESULTADO: Record<'ok' | 'ajustada' | 'desfeita', string> = {
  ok: 'Lacuna criada',
  ajustada: 'Lacuna ajustada',
  desfeita: 'Lacuna desfeita',
};

export function mensagemDoResultado(resultado: ResultadoOcultar): string {
  if (!('texto' in resultado)) return MENSAGEM_OCULTAR[resultado.status];
  return `${ROTULO_RESULTADO[resultado.status]}: “${resultado.texto}”`;
}
