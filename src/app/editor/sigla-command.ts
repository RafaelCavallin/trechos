import { Editor } from '@tiptap/core';
import { EditorState, TextSelection } from '@tiptap/pm/state';
import { Intervalo, aparar, lacunasSobrepostas } from './gap-ranges';
import { MARCA_SIGLA, siglaNoCursor } from './sigla-mark';

export interface AlvoSigla extends Intervalo {
  texto: string;
  nota: string;
}

export type FalhaSigla = 'vazia' | 'atravessa' | 'lacuna';

export type ResultadoSigla = { status: 'ok' | 'removida'; texto: string } | { status: FalhaSigla };

export const MENSAGEM_SIGLA: Record<FalhaSigla, string> = {
  vazia: 'Selecione um texto, como uma sigla, para explicar o que ele significa.',
  atravessa: 'Selecione um texto dentro de um mesmo parágrafo, item ou célula.',
  lacuna: 'Lacunas não levam significado. Selecione um texto fora delas.',
};

const ROTULO_RESULTADO: Record<'ok' | 'removida', string> = {
  ok: 'Significado salvo',
  removida: 'Significado removido',
};

function comTexto(state: EditorState, intervalo: Intervalo, nota: string): AlvoSigla {
  return { ...intervalo, nota, texto: state.doc.textBetween(intervalo.from, intervalo.to) };
}

export function alvoDaSigla(state: EditorState): AlvoSigla | FalhaSigla {
  const sel = TextSelection.between(state.selection.$anchor, state.selection.$head);
  const existente = siglaNoCursor(sel);
  if (existente) return comTexto(state, existente, existente.nota);
  if (sel.empty) return 'vazia';
  if (sel.$from.parent !== sel.$to.parent) return 'atravessa';
  const alvo = aparar(state.doc, sel);
  if (alvo.from >= alvo.to) return 'vazia';
  if (lacunasSobrepostas(sel.$from, alvo).length > 0) return 'lacuna';
  return comTexto(state, alvo, '');
}

export function marcarSigla(editor: Editor, nota: string): ResultadoSigla {
  const alvo = alvoDaSigla(editor.state);
  if (typeof alvo === 'string') return { status: alvo };
  const limpa = nota.trim();
  const { schema, tr } = editor.state;
  const tipo = schema.marks[MARCA_SIGLA];
  tr.removeMark(alvo.from, alvo.to, tipo);
  if (limpa) tr.addMark(alvo.from, alvo.to, tipo.create({ nota: limpa }));
  tr.setSelection(TextSelection.create(tr.doc, alvo.to));
  editor.view.dispatch(tr);
  return { status: limpa ? 'ok' : 'removida', texto: alvo.texto };
}

export function mensagemDaSigla(resultado: ResultadoSigla): string {
  if (!('texto' in resultado)) return MENSAGEM_SIGLA[resultado.status];
  return `${ROTULO_RESULTADO[resultado.status]}: “${resultado.texto}”`;
}
