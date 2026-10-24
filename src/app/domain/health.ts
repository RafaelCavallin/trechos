import { isDynamicItem } from './review';
import { EstatLacuna, ID, RegistroRevisao } from './types';

/** Média simples; null quando não há valores. */
export function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

// ── Saúde (R13.1, design §3.9) ─────────────────────────────────────────────

export interface RetencaoTrecho {
  assuntoId: ID;
  /** Retrievability do trecho, de 0 a 1. */
  r: number;
}

/** Saúde de cada assunto: média da retrievability dos seus trechos. */
export function healthByAssunto(trechos: readonly RetencaoTrecho[]): Map<ID, number> {
  const grupos = new Map<ID, number[]>();
  for (const t of trechos) grupos.set(t.assuntoId, [...(grupos.get(t.assuntoId) ?? []), t.r]);
  return new Map([...grupos].map(([id, rs]) => [id, mean(rs) as number]));
}

/** Saúde de cada matéria: média dos seus assuntos que têm saúde. */
export function healthByMateria(
  assuntos: readonly { id: ID; materiaId: ID }[],
  saudeAssunto: ReadonlyMap<ID, number>,
): Map<ID, number> {
  const grupos = new Map<ID, number[]>();
  for (const a of assuntos) {
    const r = saudeAssunto.get(a.id);
    if (r === undefined) continue;
    grupos.set(a.materiaId, [...(grupos.get(a.materiaId) ?? []), r]);
  }
  return new Map([...grupos].map(([id, rs]) => [id, mean(rs) as number]));
}

export type FaixaSaude = 'baixa' | 'media' | 'alta';

/** Faixa de cor da saúde (design §5.1): < 70%, 70–84%, ≥ 85%. */
export function healthBand(pct: number): FaixaSaude {
  if (pct < 70) return 'baixa';
  if (pct < 85) return 'media';
  return 'alta';
}

// ── Estatísticas por lacuna ────────────────────────────────────────────────

/**
 * Quantas vezes cada item foi revisado e errado, a partir das revisões.
 * Lacunas dinâmicas ficam de fora (R11.3).
 */
export function itemStats(registros: readonly RegistroRevisao[]): Map<ID, EstatLacuna> {
  const stats = new Map<ID, EstatLacuna>();
  for (const r of registros) {
    for (const [id, acertou] of Object.entries(r.marcas)) {
      if (isDynamicItem(id)) continue;
      const s = stats.get(id) ?? { lacunaId: id, n: 0, erros: 0 };
      stats.set(id, { ...s, n: s.n + 1, erros: s.erros + (acertou ? 0 : 1) });
    }
  }
  return stats;
}

export const PONTOS_FRACOS_MIN_REVISOES = 3;
export const PONTOS_FRACOS_QTD = 4;

/**
 * Pontos fracos (R13.2): lacunas com pelo menos 3 revisões e algum erro,
 * da maior para a menor taxa de erro, no máximo 4.
 */
export function weakPoints(stats: Iterable<EstatLacuna>): EstatLacuna[] {
  return [...stats]
    .filter((s) => s.n >= PONTOS_FRACOS_MIN_REVISOES && s.erros > 0)
    .sort((a, b) => b.erros / b.n - a.erros / a.n || b.erros - a.erros)
    .slice(0, PONTOS_FRACOS_QTD);
}

// ── Mapa de calor (R13.3) ──────────────────────────────────────────────────

export type NivelCalor = 0 | 1 | 2 | 3;

/** Nível pela taxa de erro: 0%, até 25%, 25–50%, acima de 50%. */
export function heatLevel(stat: Pick<EstatLacuna, 'n' | 'erros'> | undefined): NivelCalor {
  if (!stat || stat.n === 0 || stat.erros === 0) return 0;
  const taxa = stat.erros / stat.n;
  if (taxa < 0.25) return 1;
  if (taxa < 0.5) return 2;
  return 3;
}

/** Taxa de erro agregada (%) das lacunas de um trecho; null se nunca revisado. */
export function trechoErrorPct(
  lacunaIds: readonly ID[],
  stats: ReadonlyMap<ID, EstatLacuna>,
): number | null {
  let n = 0;
  let erros = 0;
  for (const id of lacunaIds) {
    const s = stats.get(id);
    if (!s) continue;
    n += s.n;
    erros += s.erros;
  }
  return n === 0 ? null : Math.round((erros / n) * 100);
}
