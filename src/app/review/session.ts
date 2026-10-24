import { modeForStage } from '../domain/review';
import { ID, Modo, Nota } from '../domain/types';
import { TrechoAgendado } from '../scheduler/candidates';
import { daysBetween } from '../scheduler/dates';

/**
 * Sessão de revisão (R9), como funções puras sobre um estado imutável.
 * A fila e o formato de cada trecho ficam congelados ao iniciar.
 */

export interface EntradaFila {
  key: string;
  resumoId: ID;
  trechoId: ID;
  materiaId: ID;
  assuntoId: ID;
  modo: Modo;
}

export interface ResultadoTrecho {
  key: string;
  titulo: string;
  materiaId: ID;
  total: number;
  acertos: number;
  pct: number;
  nota: Nota;
  due: Date;
  /** Textos dos itens errados (lacunas ou perguntas), para a lista "Volta amanhã". */
  erradas: string[];
}

export interface Sessao {
  fila: EntradaFila[];
  indice: number;
  revelado: boolean;
  marcas: Readonly<Record<ID, boolean>>;
  /** Texto livre do formato "Só o título". */
  recall: string;
  resultado: ResultadoTrecho | null;
  resultados: ResultadoTrecho[];
  concluida: boolean;
}

export const TEXTO_MODO: Record<Modo, string> = {
  lacunas: 'Com lacunas',
  perguntas: 'Só perguntas',
  titulo: 'Só o título',
  densas: 'Lacunas densas',
};

/** Congela a fila do dia, com o formato de cada trecho pelo estágio (R10.1). */
export function iniciar(fila: readonly TrechoAgendado[]): Sessao {
  return {
    fila: fila.map((t) => ({
      key: t.key,
      resumoId: t.resumoId,
      trechoId: t.trecho.id,
      materiaId: t.materiaId,
      assuntoId: t.assuntoId,
      modo: modeForStage(t.estado.S, t.trecho),
    })),
    indice: 0,
    revelado: false,
    marcas: {},
    recall: '',
    resultado: null,
    resultados: [],
    concluida: false,
  };
}

export function revelar(s: Sessao): Sessao {
  return s.revelado ? s : { ...s, revelado: true };
}

/** Só dá para marcar depois de revelar e antes de calcular a nota. */
export function podeMarcar(s: Sessao): boolean {
  return s.revelado && !s.resultado;
}

export function marcar(s: Sessao, id: ID, acertou: boolean): Sessao {
  if (!podeMarcar(s)) return s;
  return { ...s, marcas: { ...s.marcas, [id]: acertou } };
}

/** Clique na lacuna: sem marca → acertou → errou → acertou… (R9.4). */
export function alternar(s: Sessao, id: ID): Sessao {
  return marcar(s, id, s.marcas[id] !== true);
}

/** "Marcar restantes como acerto" (R9.5). */
export function marcarRestantes(s: Sessao, itens: readonly { id: ID }[]): Sessao {
  if (!podeMarcar(s)) return s;
  const marcas = { ...s.marcas };
  for (const i of itens) if (marcas[i.id] === undefined) marcas[i.id] = true;
  return { ...s, marcas };
}

export function registrarResultado(s: Sessao, r: ResultadoTrecho): Sessao {
  return { ...s, resultado: r, resultados: [...s.resultados, r] };
}

/** Próximo trecho, ou o resumo da sessão depois do último. */
export function proximo(s: Sessao): Sessao {
  if (s.indice + 1 >= s.fila.length) return { ...s, concluida: true };
  return { ...s, indice: s.indice + 1, revelado: false, marcas: {}, recall: '', resultado: null };
}

/** Sair a qualquer momento (R9.8): com algo avaliado, mostra o resumo; senão, encerra. */
export function sair(s: Sessao): Sessao | null {
  return s.resultados.length ? { ...s, concluida: true } : null;
}

export function progresso(s: Sessao): number {
  return Math.round(((s.indice + (s.resultado ? 1 : 0)) / Math.max(1, s.fila.length)) * 100);
}

export interface ResumoDaSessao {
  revisados: number;
  acertos: number;
  total: number;
  pct: number;
  voltamAmanha: ResultadoTrecho[];
}

/** Totais do fim da sessão (R9.7). "Volta amanhã" = próxima revisão em até 1 dia. */
export function resumoDaSessao(s: Sessao, hoje: Date): ResumoDaSessao {
  const acertos = s.resultados.reduce((t, r) => t + r.acertos, 0);
  const total = s.resultados.reduce((t, r) => t + r.total, 0);
  return {
    revisados: s.resultados.length,
    acertos,
    total,
    pct: Math.round((acertos / Math.max(1, total)) * 100),
    voltamAmanha: s.resultados.filter((r) => daysBetween(hoje, r.due) <= 1),
  };
}
