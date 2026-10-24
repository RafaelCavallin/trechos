import { ID } from '../domain/types';
import { isDueBy, isSameDay } from './dates';

export interface CandidatoFila {
  key: string;
  materiaId: ID;
  itens: number;
  due: Date;
  lastReview?: Date;
  /** Retrievability (0–1); null para trecho nunca revisado. */
  r: number | null;
}

/** Minutos estimados por trecho (R8.4). */
export const MINUTOS_POR_TRECHO = 2;

/**
 * Monta a fila do dia (R8.1–R8.3, design §3.8):
 * 1. trechos com revisão marcada até hoje, com itens e não revisados hoje;
 * 2. do mais esquecido para o mais lembrado (trecho novo conta como R = 0,
 *    então entra no mesmo dia em que foi criado);
 * 3. intercalando as matérias, uma de cada vez;
 * 4. cortando no limite diário.
 */
export function buildDailyQueue<C extends CandidatoFila>(
  candidatos: readonly C[],
  hoje: Date,
  limiteDiario: number,
): C[] {
  const elegiveis = candidatos
    .filter(
      (c) =>
        c.itens > 0 && isDueBy(c.due, hoje) && !(c.lastReview && isSameDay(c.lastReview, hoje)),
    )
    .sort((a, b) => (a.r ?? 0) - (b.r ?? 0) || a.due.getTime() - b.due.getTime());
  return interleaveBy(elegiveis, (c) => c.materiaId).slice(0, Math.max(0, limiteDiario));
}

/**
 * Intercala os grupos em rodízio, mantendo a ordem dentro de cada grupo.
 * Os grupos aparecem na ordem do seu primeiro elemento.
 */
export function interleaveBy<T>(itens: readonly T[], grupo: (item: T) => string): T[] {
  const grupos = new Map<string, T[]>();
  for (const item of itens) {
    const g = grupo(item);
    grupos.set(g, [...(grupos.get(g) ?? []), item]);
  }
  const filas = [...grupos.values()];
  const saida: T[] = [];
  for (let i = 0; saida.length < itens.length; i++) {
    for (const fila of filas) if (i < fila.length) saida.push(fila[i]);
  }
  return saida;
}

/** Resumo por matéria para a tela inicial: "3 trechos · ~6 min". */
export function queueByMateria<C extends CandidatoFila>(
  fila: readonly C[],
): { materiaId: ID; trechos: number; minutos: number }[] {
  const contagem = new Map<ID, number>();
  for (const c of fila) contagem.set(c.materiaId, (contagem.get(c.materiaId) ?? 0) + 1);
  return [...contagem].map(([materiaId, trechos]) => ({
    materiaId,
    trechos,
    minutos: trechos * MINUTOS_POR_TRECHO,
  }));
}
