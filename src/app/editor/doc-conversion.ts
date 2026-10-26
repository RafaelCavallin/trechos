import { JSONContent } from '@tiptap/core';
import { newId } from '../domain/ids';
import { Bloco, BlocoAnexo, Segmento, SegmentoTexto } from '../domain/types';
import { FormaDoc } from './schema';
import { MARCA_SIGLA } from './sigla-mark';

/**
 * Conversão entre os blocos do Trechos (segmentos) e o documento do TipTap (JSON).
 * Funções puras: o editor nunca é a fonte da verdade, os blocos são.
 */

export type BlocoDeTexto = Exclude<Bloco, BlocoAnexo>;

export function formaDoBloco(bloco: BlocoDeTexto): FormaDoc {
  if (bloco.type === 'list') return 'lista';
  if (bloco.type === 'table') return 'tabela';
  return 'linha';
}

// ── Bloco → documento ──────────────────────────────────────────────────────

export function blockToDoc(bloco: BlocoDeTexto): JSONContent {
  switch (bloco.type) {
    case 'list':
      return {
        type: 'doc',
        content: [
          {
            type: 'bulletList',
            content: (bloco.items.length ? bloco.items : [[]]).map((item) => ({
              type: 'listItem',
              content: [paragraph(item)],
            })),
          },
        ],
      };
    case 'table':
      return {
        type: 'doc',
        content: [
          {
            type: 'table',
            content: bloco.rows.map((row, ri) => ({
              type: 'tableRow',
              content: row.map((cell) => ({
                type: ri === 0 ? 'tableHeader' : 'tableCell',
                content: [paragraph(cell)],
              })),
            })),
          },
        ],
      };
    default:
      return { type: 'doc', content: [paragraph(bloco.segs)] };
  }
}

function paragraph(segs: readonly Segmento[]): JSONContent {
  const content = segs.filter((s) => s.t.length > 0).map(segToText);
  return content.length ? { type: 'paragraph', content } : { type: 'paragraph' };
}

function segToText(s: Segmento): JSONContent {
  if (s.k === 'g')
    return { type: 'text', text: s.t, marks: [{ type: 'gap', attrs: { id: s.id } }] };
  const marks = marcasDoTexto(s);
  return marks.length ? { type: 'text', text: s.t, marks } : { type: 'text', text: s.t };
}

type Marca = NonNullable<JSONContent['marks']>[number];

function marcasDoTexto(s: SegmentoTexto): Marca[] {
  const marks: Marca[] = s.b ? [{ type: 'bold' }] : [];
  if (s.n) marks.push({ type: MARCA_SIGLA, attrs: { nota: s.n } });
  return marks;
}

function segmentoDeTexto(node: JSONContent): SegmentoTexto {
  const seg: SegmentoTexto = { k: 't', t: node.text ?? '' };
  if (node.marks?.some((m) => m.type === 'bold')) seg.b = true;
  const nota = node.marks?.find((m) => m.type === MARCA_SIGLA)?.attrs?.['nota'];
  if (nota) seg.n = String(nota);
  return seg;
}

// ── Documento → bloco ──────────────────────────────────────────────────────

/** Atualiza o bloco com o conteúdo do documento, mantendo id, perguntas e atributos. */
export function docToBlock<B extends BlocoDeTexto>(bloco: B, doc: JSONContent): B {
  const vistas = new Set<string>();
  const segs = (p: JSONContent | undefined) => inlineToSegs(p?.content, vistas);
  const raiz = doc.content?.[0];
  switch (bloco.type) {
    case 'list':
      return {
        ...bloco,
        items: (raiz?.content ?? []).map((li) => segs(li.content?.[0])),
      };
    case 'table':
      return {
        ...bloco,
        rows: (raiz?.content ?? []).map((row) =>
          (row.content ?? []).map((cell) => segs(cell.content?.[0])),
        ),
      };
    default:
      return { ...bloco, segs: segs(raiz) };
  }
}

/**
 * Nós de texto → segmentos. Junta vizinhos com a mesma formatação e garante
 * que uma lacuna com id repetido (ex.: texto duplicado) ganhe id novo.
 */
export function inlineToSegs(
  nodes: JSONContent[] | undefined,
  vistas = new Set<string>(),
): Segmento[] {
  const segs: Segmento[] = [];
  let ultimoGap: string | null = null;
  for (const node of nodes ?? []) {
    if (node.type !== 'text' || !node.text) continue;
    const gap = node.marks?.find((m) => m.type === 'gap');
    const anterior = segs.at(-1);
    if (gap) {
      const idOriginal = String(gap.attrs?.['id'] ?? '');
      if (anterior?.k === 'g' && ultimoGap === idOriginal) {
        anterior.t += node.text;
        continue;
      }
      const id = idOriginal && !vistas.has(idOriginal) ? idOriginal : newId('g');
      vistas.add(id);
      ultimoGap = idOriginal;
      segs.push({ k: 'g', id, t: node.text });
      continue;
    }
    ultimoGap = null;
    const seg = segmentoDeTexto(node);
    if (anterior?.k === 't' && !!anterior.b === !!seg.b && anterior.n === seg.n) {
      anterior.t += node.text;
    } else {
      segs.push(seg);
    }
  }
  return segs;
}

/** Divide um parágrafo em dois no ponto do cursor (Enter no meio de um bloco). */
export function splitInline(
  nodes: JSONContent[] | undefined,
  offset: number,
): [JSONContent[], JSONContent[]] {
  const antes: JSONContent[] = [];
  const depois: JSONContent[] = [];
  let pos = 0;
  for (const node of nodes ?? []) {
    const texto = node.text ?? '';
    const fim = pos + texto.length;
    if (fim <= offset) antes.push(node);
    else if (pos >= offset) depois.push(node);
    else {
      antes.push({ ...node, text: texto.slice(0, offset - pos) });
      depois.push({ ...node, text: texto.slice(offset - pos) });
    }
    pos = fim;
  }
  return [antes, depois];
}
