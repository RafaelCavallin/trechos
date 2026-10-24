import { newId } from '../domain/ids';
import { Bloco, BlocoAnexo, ID, Pergunta, Segmento, TipoEspecial } from '../domain/types';

/** Operações puras sobre a lista de blocos de um resumo (R2, R4). */

export type TipoNovoBloco = 'h2' | 'h3' | 'p' | 'list' | 'table' | 'quote' | TipoEspecial;

const T = (t: string): Segmento[] => [{ k: 't', t }];

/** Bloco novo com texto inicial (selecionado ao abrir, para digitar por cima). */
export function newBlock(tipo: TipoNovoBloco): Bloco {
  const id = newId('b');
  switch (tipo) {
    case 'h2':
      return { id, type: 'h2', segs: T('Novo trecho') };
    case 'h3':
      return { id, type: 'h3', segs: T('Subtítulo') };
    case 'p':
      return { id, type: 'p', segs: T('Escreva o parágrafo aqui.') };
    case 'quote':
      return { id, type: 'quote', segs: T('Citação. — Fonte') };
    case 'list':
      return { id, type: 'list', items: [T('Primeiro item'), T('Segundo item')] };
    case 'table':
      return {
        id,
        type: 'table',
        rows: [
          [T('Coluna 1'), T('Coluna 2')],
          [T('…'), T('…')],
        ],
      };
    default:
      return { id, type: 'special', kind: tipo, segs: T('Escreva aqui.') };
  }
}

export function newAttachment(kind: BlocoAnexo['kind'], name: string, url: string): BlocoAnexo {
  return { id: newId('b'), type: 'attach', kind, name, url };
}

/** Insere logo após o bloco selecionado, ou no fim se nenhum estiver selecionado (R2.2). */
export function insertAfter(
  blocos: readonly Bloco[],
  selecionado: ID | null,
  novo: Bloco,
): Bloco[] {
  const i = selecionado ? blocos.findIndex((b) => b.id === selecionado) : -1;
  const pos = i < 0 ? blocos.length : i + 1;
  return [...blocos.slice(0, pos), novo, ...blocos.slice(pos)];
}

export function replaceBlock(blocos: readonly Bloco[], bloco: Bloco): Bloco[] {
  return blocos.map((b) => (b.id === bloco.id ? bloco : b));
}

/** Sobe (-1) ou desce (+1) um bloco. Nos extremos, nada muda. */
export function moveBlock(blocos: readonly Bloco[], id: ID, direcao: -1 | 1): readonly Bloco[] {
  const i = blocos.findIndex((b) => b.id === id);
  const j = i + direcao;
  if (i < 0 || j < 0 || j >= blocos.length) return blocos;
  const copia = [...blocos];
  [copia[i], copia[j]] = [copia[j], copia[i]];
  return copia;
}

export function removeBlock(blocos: readonly Bloco[], id: ID): Bloco[] {
  return blocos.filter((b) => b.id !== id);
}

export function addQuestion(blocos: readonly Bloco[], blocoId: ID, q: string, a: string): Bloco[] {
  const pergunta: Pergunta = { id: newId('q'), q: q.trim(), a: a.trim() };
  return blocos.map((b) => (b.id === blocoId ? { ...b, qs: [...(b.qs ?? []), pergunta] } : b));
}

export function removeQuestion(blocos: readonly Bloco[], blocoId: ID, perguntaId: ID): Bloco[] {
  return blocos.map((b) =>
    b.id === blocoId ? { ...b, qs: (b.qs ?? []).filter((q) => q.id !== perguntaId) } : b,
  );
}

export interface EdicaoPergunta {
  blocoId: ID;
  perguntaId: ID;
  q: string;
  a: string;
}

export function editQuestion(blocos: readonly Bloco[], edicao: EdicaoPergunta): Bloco[] {
  const trocar = (p: Pergunta): Pergunta =>
    p.id === edicao.perguntaId ? { id: p.id, q: edicao.q.trim(), a: edicao.a.trim() } : p;
  return blocos.map((b) => (b.id === edicao.blocoId && b.qs ? { ...b, qs: b.qs.map(trocar) } : b));
}
