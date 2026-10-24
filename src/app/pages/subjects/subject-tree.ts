import { healthByAssunto, healthByMateria } from '../../domain/health';
import { Assunto, ID, Materia, Resumo } from '../../domain/types';
import { TrechoAgendado } from '../../scheduler/candidates';

export interface NoResumo {
  resumo: Resumo;
  trechos: number;
  itens: number;
}

export interface NoAssunto {
  assunto: Assunto;
  resumos: NoResumo[];
  /** Retenção estimada em % (0–100); null se nada foi revisado ainda. */
  retencao: number | null;
  /** Próxima revisão entre os trechos com itens; null se não houver. */
  proxima: Date | null;
}

export interface NoMateria {
  materia: Materia;
  assuntos: NoAssunto[];
  retencao: number | null;
}

/**
 * Árvore Matéria → Assunto → Resumo com contagens, retenção e próxima revisão
 * (R1.1, R1.6, R1.7). As listas já chegam ordenadas.
 */
export function buildSubjectTree(
  materias: readonly Materia[],
  assuntos: readonly Assunto[],
  resumos: readonly Resumo[],
  trechos: readonly TrechoAgendado[],
): NoMateria[] {
  const porResumo = agrupar(trechos, (t) => t.resumoId);
  const revisados = trechos.flatMap((t) =>
    t.r === null ? [] : [{ assuntoId: t.assuntoId, r: t.r }],
  );
  const saudeAssunto = healthByAssunto(revisados);
  const saudeMateria = healthByMateria(
    assuntos.map((a) => ({ id: a.id, materiaId: a.materiaId })),
    saudeAssunto,
  );
  const proximaDe = new Map<ID, Date>();
  for (const t of trechos) {
    if (t.itens === 0) continue;
    const atual = proximaDe.get(t.assuntoId);
    if (!atual || t.due < atual) proximaDe.set(t.assuntoId, t.due);
  }
  const assuntosDe = agrupar(assuntos, (a) => a.materiaId);
  const resumosDe = agrupar(resumos, (r) => r.assuntoId);

  return materias.map((materia) => ({
    materia,
    retencao: pct(saudeMateria.get(materia.id)),
    assuntos: (assuntosDe.get(materia.id) ?? []).map((assunto) => ({
      assunto,
      retencao: pct(saudeAssunto.get(assunto.id)),
      proxima: proximaDe.get(assunto.id) ?? null,
      resumos: (resumosDe.get(assunto.id) ?? []).map((resumo) => {
        const ts = porResumo.get(resumo.id) ?? [];
        return { resumo, trechos: ts.length, itens: ts.reduce((s, t) => s + t.itens, 0) };
      }),
    })),
  }));
}

function pct(r: number | undefined): number | null {
  return r === undefined ? null : Math.round(r * 100);
}

function agrupar<T>(lista: readonly T[], chave: (x: T) => ID): Map<ID, T[]> {
  const grupos = new Map<ID, T[]>();
  for (const x of lista) grupos.set(chave(x), [...(grupos.get(chave(x)) ?? []), x]);
  return grupos;
}
