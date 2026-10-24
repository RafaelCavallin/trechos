import { generateDynamicGaps } from './dynamic-gaps';
import { segmentArrays } from './text';
import {
  BlocoRevisao,
  Densidade,
  Estagio,
  FaixasNota,
  ID,
  Modo,
  Nota,
  Segmento,
  SegmentoDinamico,
  Trecho,
} from './types';

// ── Estágio e formato (R10, design §3.5) ───────────────────────────────────

/** Limites de estabilidade (dias) entre os estágios. */
export const LIMIAR_INTERMEDIARIO = 4;
export const LIMIAR_ESTAVEL = 16;

export function stageOf(S: number): Estagio {
  if (S <= 0) return 'Nova';
  if (S < LIMIAR_INTERMEDIARIO) return 'Inicial';
  if (S < LIMIAR_ESTAVEL) return 'Intermediário';
  return 'Estável';
}

/**
 * Formato da revisão pelo estágio, já com as alternativas (R10.2):
 * pede perguntas e não há → "Só o título"; pede lacunas e não há → "Só perguntas".
 */
export function modeForStage(S: number, trecho: Pick<Trecho, 'lacunas' | 'perguntas'>): Modo {
  let modo: Modo;
  if (S < LIMIAR_INTERMEDIARIO) modo = 'lacunas';
  else if (S < LIMIAR_ESTAVEL) modo = trecho.perguntas > 0 ? 'perguntas' : 'titulo';
  else modo = 'densas';
  return withFallback(modo, trecho);
}

/** Aplica as alternativas de R10.2 a um formato escolhido. */
export function withFallback(modo: Modo, trecho: Pick<Trecho, 'lacunas' | 'perguntas'>): Modo {
  if (modo === 'perguntas' && trecho.perguntas === 0) modo = 'titulo';
  if (modo !== 'perguntas' && trecho.lacunas === 0) modo = 'perguntas';
  return modo;
}

// ── Itens verificáveis (design §3.4) ───────────────────────────────────────

export type ItemVerificavel =
  | { tipo: 'lacuna' | 'dinamica'; id: ID; num: number; texto: string }
  | { tipo: 'pergunta'; id: ID; num: number; pergunta: string; resposta: string };

export interface TrechoParaRevisao {
  modo: Modo;
  /** Blocos como devem ser mostrados, já com as lacunas dinâmicas. */
  blocos: BlocoRevisao[];
  itens: ItemVerificavel[];
}

/**
 * Monta o trecho para revisão no formato dado: gera as lacunas dinâmicas e
 * lista os itens numerados na ordem do texto.
 */
export function prepareReview(trecho: Trecho, modo: Modo, densidade: Densidade): TrechoParaRevisao {
  const blocos = generateDynamicGaps(trecho, modo, densidade);
  return { modo, blocos, itens: collectItems(trecho, modo, blocos) };
}

/**
 * Itens verificáveis do trecho no formato dado.
 * "Só perguntas": as perguntas da margem. Demais formatos: as lacunas na ordem
 * do texto (manuais e, se houver, dinâmicas, já geradas em `blocos`).
 */
export function collectItems(
  trecho: Pick<Trecho, 'blocos'>,
  modo: Modo,
  blocos: readonly BlocoRevisao[] = trecho.blocos,
): ItemVerificavel[] {
  if (modo === 'perguntas') {
    return trecho.blocos
      .flatMap((b) => b.qs ?? [])
      .map((q, i) => ({ tipo: 'pergunta', id: q.id, num: i + 1, pergunta: q.q, resposta: q.a }));
  }
  return blocos
    .flatMap((b) => segmentArrays<Segmento | SegmentoDinamico>(b).flat())
    .filter((s) => s.k !== 't')
    .map((s, i) => ({
      tipo: s.k === 'd' ? 'dinamica' : 'lacuna',
      id: s.id,
      num: i + 1,
      texto: s.t,
    }));
}

/** Lacunas dinâmicas não têm identidade persistente (R11.3). */
export function isDynamicItem(id: ID): boolean {
  return id.startsWith('d:');
}

// ── Nota (R11, design §3.4) ────────────────────────────────────────────────

export interface ResultadoNota {
  total: number;
  acertos: number;
  pct: number;
  nota: Nota;
}

export const NOTA_TEXTO: Record<Nota, string> = {
  Easy: 'Fácil',
  Good: 'Lembrei',
  Hard: 'Lembrei com esforço',
  Again: 'Não lembrei',
};

/** "Calcular nota" só é liberado com todos os itens marcados (R9.5). */
export function allMarked(
  marcas: Readonly<Record<ID, boolean>>,
  itens: readonly { id: ID }[],
): boolean {
  return itens.every((i) => typeof marcas[i.id] === 'boolean');
}

/** Nota pela proporção de itens acertados. Item sem marca conta como erro. */
export function gradeFromMarks(
  marcas: Readonly<Record<ID, boolean>>,
  itens: readonly { id: ID }[],
  faixas: FaixasNota,
): ResultadoNota {
  const total = itens.length;
  const acertos = itens.filter((i) => marcas[i.id] === true).length;
  const pct = Math.round((acertos / Math.max(1, total)) * 100);
  return { total, acertos, pct, nota: noteForPct(pct, faixas) };
}

export function noteForPct(pct: number, faixas: FaixasNota): Nota {
  if (pct >= faixas.easy) return 'Easy';
  if (pct >= faixas.good) return 'Good';
  if (pct >= faixas.hard) return 'Hard';
  return 'Again';
}
