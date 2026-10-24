import { Node as PMNode, ResolvedPos } from '@tiptap/pm/model';
import { EditorState } from '@tiptap/pm/state';

export const MARCA_LACUNA = 'gap';

export interface Intervalo {
  from: number;
  to: number;
}

export interface IntervaloLacuna extends Intervalo {
  id: string;
}

export function aparar(doc: PMNode, { from, to }: Intervalo): Intervalo {
  const texto = doc.textBetween(from, to);
  const inicio = texto.length - texto.trimStart().length;
  const fim = texto.length - texto.trimEnd().length;
  return { from: from + inicio, to: to - fim };
}

export function lacunasDoTexto($pos: ResolvedPos): Map<string, IntervaloLacuna> {
  const lacunas = new Map<string, IntervaloLacuna>();
  const inicio = $pos.start();
  $pos.parent.forEach((node, offset) => {
    const id = node.marks.find((m) => m.type.name === MARCA_LACUNA)?.attrs['id'];
    if (!id) return;
    const from = inicio + offset;
    lacunas.set(id, { id, from: lacunas.get(id)?.from ?? from, to: from + node.nodeSize });
  });
  return lacunas;
}

export function lacunasSobrepostas($pos: ResolvedPos, alvo: Intervalo): IntervaloLacuna[] {
  return [...lacunasDoTexto($pos).values()].filter((l) => l.from < alvo.to && l.to > alvo.from);
}

export function lacunaParaDesocultar(state: EditorState): IntervaloLacuna | null {
  const { $from, $to, from, empty } = state.selection;
  if ($from.parent !== $to.parent) return null;
  const lacunas = [...lacunasDoTexto($from).values()];
  if (empty) return lacunas.find((l) => l.from < from && from < l.to) ?? null;
  const alvo = aparar(state.doc, state.selection);
  return lacunas.find((l) => l.from === alvo.from && l.to === alvo.to) ?? null;
}
