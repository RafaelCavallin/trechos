/** Datas por dia local: o Trechos agenda por dia, não por hora. */

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/** O dia de `d` é hoje ou já passou. */
export function isDueBy(d: Date, hoje: Date): boolean {
  return startOfDay(d).getTime() <= startOfDay(hoje).getTime();
}

/** Dias inteiros entre o dia de `de` e o dia de `ate`. */
export function daysBetween(de: Date, ate: Date): number {
  return Math.round((startOfDay(ate).getTime() - startOfDay(de).getTime()) / 86_400_000);
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Data no formato do app (R15.4): "hoje", "amanhã" ou "29 out". */
export function dayLabel(d: Date, hoje: Date): string {
  const dias = daysBetween(hoje, d);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'amanhã';
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}
