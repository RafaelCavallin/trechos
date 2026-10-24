import {
  healthByAssunto,
  healthByMateria,
  itemStats,
  trechoErrorPct,
  weakPoints,
} from '../domain/health';
import { segmentArrays } from '../domain/text';
import { splitTrechos } from '../domain/trechos';
import {
  Assunto,
  Bloco,
  EstatLacuna,
  ID,
  Materia,
  Nota,
  RegistroRevisao,
  Resumo,
  Segmento,
  Trecho,
} from '../domain/types';
import { TrechoAgendado } from '../scheduler/candidates';
import { daysBetween } from '../scheduler/dates';

/** Cálculos das telas Início e Estatísticas (R13), em funções puras. */

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Data passada curta: "hoje", "ontem" ou "22 out". */
export function shortDate(d: Date, hoje: Date): string {
  const dias = daysBetween(d, hoje);
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'ontem';
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

/** "Sexta-feira, 23 de outubro". */
export function longDate(d: Date): string {
  const texto = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// ── Lacunas existentes ─────────────────────────────────────────────────────

export interface LacunaIndexada {
  id: ID;
  texto: string;
  resumoId: ID;
  trechoTitulo: string;
  materia: string;
}

/** Todas as lacunas manuais dos resumos atuais, com onde estão. */
export function indexGaps(
  resumos: readonly Resumo[],
  assuntos: readonly Assunto[],
  materias: readonly Materia[],
): Map<ID, LacunaIndexada> {
  const materiaDoAssunto = new Map(
    assuntos.map((a) => [a.id, materias.find((m) => m.id === a.materiaId)?.nome ?? '']),
  );
  const indice = new Map<ID, LacunaIndexada>();
  for (const r of resumos) {
    for (const t of splitTrechos(r.blocos)) {
      for (const s of lacunasDe(t.blocos)) {
        indice.set(s.id, {
          id: s.id,
          texto: s.t,
          resumoId: r.id,
          trechoTitulo: t.titulo,
          materia: materiaDoAssunto.get(r.assuntoId) ?? '',
        });
      }
    }
  }
  return indice;
}

function lacunasDe(blocos: readonly Bloco[]): Extract<Segmento, { k: 'g' }>[] {
  return blocos
    .flatMap((b) => segmentArrays<Segmento>(b).flat())
    .filter((s): s is Extract<Segmento, { k: 'g' }> => s.k === 'g');
}

// ── Pontos fracos (R13.2) ──────────────────────────────────────────────────

export interface PontoFraco extends LacunaIndexada {
  n: number;
  erros: number;
  descricao: string;
}

/** As lacunas mais erradas que ainda existem nos resumos. */
export function weakGaps(
  registros: readonly RegistroRevisao[],
  indice: ReadonlyMap<ID, LacunaIndexada>,
): PontoFraco[] {
  const stats = [...itemStats(registros).values()].filter((s) => indice.has(s.lacunaId));
  return weakPoints(stats).map((s) => ({
    ...indice.get(s.lacunaId)!,
    n: s.n,
    erros: s.erros,
    descricao: `Errada em ${s.erros} de ${s.n} revisões`,
  }));
}

// ── Saúde / retenção (R13.1) ───────────────────────────────────────────────

export interface RetencaoMateria {
  materia: Materia;
  /** % de 0 a 100; null se nada foi revisado. */
  pct: number | null;
  assuntos: { assunto: Assunto; pct: number | null }[];
}

export function retention(
  materias: readonly Materia[],
  assuntos: readonly Assunto[],
  trechos: readonly TrechoAgendado[],
): RetencaoMateria[] {
  const porAssunto = healthByAssunto(
    trechos.flatMap((t) => (t.r === null ? [] : [{ assuntoId: t.assuntoId, r: t.r }])),
  );
  const porMateria = healthByMateria(assuntos, porAssunto);
  const pct = (r: number | undefined) => (r === undefined ? null : Math.round(r * 100));
  return materias.map((materia) => ({
    materia,
    pct: pct(porMateria.get(materia.id)),
    assuntos: assuntos
      .filter((a) => a.materiaId === materia.id)
      .map((assunto) => ({ assunto, pct: pct(porAssunto.get(assunto.id)) })),
  }));
}

/** Saúde para a tela inicial: só matérias com revisões, da menor para a maior. */
export function healthRanking(
  retencao: readonly RetencaoMateria[],
): { nome: string; pct: number }[] {
  return retencao
    .filter((m): m is RetencaoMateria & { pct: number } => m.pct !== null)
    .map((m) => ({ nome: m.materia.nome, pct: m.pct }))
    .sort((a, b) => a.pct - b.pct);
}

// ── Histórico (R13.3) ──────────────────────────────────────────────────────

export interface LinhaHistorico {
  id: ID;
  data: string;
  trecho: string;
  materia: string;
  pct: number;
  nota: Nota;
}

export function history(
  registros: readonly RegistroRevisao[],
  trechos: readonly TrechoAgendado[],
  materias: readonly Materia[],
  hoje: Date,
  limite = 12,
): LinhaHistorico[] {
  const porKey = new Map(trechos.map((t) => [t.key, t]));
  const nomeMateria = new Map(materias.map((m) => [m.id, m.nome]));
  return registros.slice(0, limite).map((r) => {
    const t = porKey.get(r.trechoKey);
    return {
      id: r.id,
      data: shortDate(r.data, hoje),
      trecho: t?.trecho.titulo ?? 'Trecho removido',
      materia: t ? (nomeMateria.get(t.materiaId) ?? '') : '',
      pct: r.pct,
      nota: r.nota,
    };
  });
}

// ── Mapa de calor (R13.3) ──────────────────────────────────────────────────

export interface TrechoNoMapa {
  trecho: Trecho;
  /** % de erro nas lacunas do trecho; null se nunca revisado. */
  taxa: number | null;
  rotulo: string;
}

export function heatMap(
  blocos: readonly Bloco[],
  stats: ReadonlyMap<ID, EstatLacuna>,
): TrechoNoMapa[] {
  return splitTrechos(blocos).map((trecho) => {
    const taxa = trechoErrorPct(
      lacunasDe(trecho.blocos).map((s) => s.id),
      stats,
    );
    return {
      trecho,
      taxa,
      rotulo: taxa === null ? 'Sem revisões' : `${taxa}% de erro nas lacunas`,
    };
  });
}

/** Faixa de cor da etiqueta de taxa do trecho (protótipo: 0, até 30%, 30% ou mais). */
export function rateBand(taxa: number | null): 'nenhuma' | 'zero' | 'baixa' | 'alta' {
  if (taxa === null) return 'nenhuma';
  if (taxa === 0) return 'zero';
  return taxa < 30 ? 'baixa' : 'alta';
}

/** Resumos com alguma lacuna já revisada (opções do mapa de calor). */
export function reviewedSummaries(
  resumos: readonly Resumo[],
  stats: ReadonlyMap<ID, EstatLacuna>,
): Resumo[] {
  return resumos.filter((r) => r.blocos.some((b) => lacunasDe([b]).some((s) => stats.has(s.id))));
}

export function heatTitle(stat: EstatLacuna | undefined): string {
  return stat ? `Errada em ${stat.erros} de ${stat.n} revisões` : 'Ainda não revisada';
}
