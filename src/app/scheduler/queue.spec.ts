import { CandidatoFila, buildDailyQueue, interleaveBy, queueByMateria } from './queue';
import { dayLabel, daysBetween, isDueBy, isSameDay, startOfDay } from './dates';

const hoje = new Date(2026, 9, 23, 10, 0);
const dia = (n: number, hora = 12) => new Date(2026, 9, 23 + n, hora, 0);

const c = (key: string, materiaId: string, extra: Partial<CandidatoFila> = {}): CandidatoFila => ({
  key,
  materiaId,
  itens: 3,
  due: dia(0),
  r: 0.8,
  ...extra,
});

describe('buildDailyQueue', () => {
  it('inclui o que vence hoje (mesmo mais tarde no dia) ou antes; exclui o futuro', () => {
    const fila = buildDailyQueue(
      [
        c('hoje-tarde', 'm', { due: dia(0, 23) }),
        c('atrasado', 'm', { due: dia(-3) }),
        c('amanha', 'm', { due: dia(1, 0) }),
      ],
      hoje,
      20,
    );
    expect(fila.map((x) => x.key).sort()).toEqual(['atrasado', 'hoje-tarde']);
  });

  it('exclui trechos sem itens e os já revisados hoje', () => {
    const fila = buildDailyQueue(
      [
        c('sem-itens', 'm', { itens: 0 }),
        c('revisado', 'm', { lastReview: dia(0, 8) }),
        c('ok', 'm', { lastReview: dia(-1) }),
      ],
      hoje,
      20,
    );
    expect(fila.map((x) => x.key)).toEqual(['ok']);
  });

  it('prioriza o mais esquecido; trecho novo conta como R = 0', () => {
    const fila = buildDailyQueue(
      [c('bem', 'm', { r: 0.95 }), c('novo', 'm', { r: null }), c('mal', 'm', { r: 0.5 })],
      hoje,
      20,
    );
    expect(fila.map((x) => x.key)).toEqual(['novo', 'mal', 'bem']);
  });

  it('intercala as matérias', () => {
    const fila = buildDailyQueue(
      [
        c('adm1', 'adm', { r: 0.1 }),
        c('adm2', 'adm', { r: 0.2 }),
        c('adm3', 'adm', { r: 0.3 }),
        c('const1', 'const', { r: 0.4 }),
        c('pen1', 'pen', { r: 0.5 }),
      ],
      hoje,
      20,
    );
    expect(fila.map((x) => x.key)).toEqual(['adm1', 'const1', 'pen1', 'adm2', 'adm3']);
  });

  it('corta no limite diário depois de intercalar', () => {
    const fila = buildDailyQueue(
      [c('a1', 'a', { r: 0.1 }), c('a2', 'a', { r: 0.2 }), c('b1', 'b', { r: 0.9 })],
      hoje,
      2,
    );
    expect(fila.map((x) => x.key)).toEqual(['a1', 'b1']);
    expect(buildDailyQueue([c('a1', 'a')], hoje, 0)).toEqual([]);
  });

  it('desempata pelo vencimento mais antigo', () => {
    const fila = buildDailyQueue(
      [c('recente', 'm', { due: dia(-1) }), c('antigo', 'm', { due: dia(-5) })],
      hoje,
      20,
    );
    expect(fila.map((x) => x.key)).toEqual(['antigo', 'recente']);
  });
});

describe('interleaveBy e queueByMateria', () => {
  it('rodízio com grupos de tamanhos diferentes', () => {
    expect(interleaveBy(['a1', 'a2', 'a3', 'b1', 'c1', 'c2'], (s) => s[0])).toEqual([
      'a1',
      'b1',
      'c1',
      'a2',
      'c2',
      'a3',
    ]);
    expect(interleaveBy([], (s: string) => s)).toEqual([]);
  });

  it('conta trechos e minutos por matéria', () => {
    expect(queueByMateria([c('1', 'adm'), c('2', 'const'), c('3', 'adm')])).toEqual([
      { materiaId: 'adm', trechos: 2, minutos: 4 },
      { materiaId: 'const', trechos: 1, minutos: 2 },
    ]);
  });
});

describe('datas', () => {
  it('trabalham por dia local', () => {
    expect(startOfDay(dia(0, 23))).toEqual(new Date(2026, 9, 23));
    expect(isSameDay(dia(0, 0), dia(0, 23))).toBe(true);
    expect(isDueBy(dia(1, 0), hoje)).toBe(false);
    expect(daysBetween(dia(0, 23), dia(1, 0))).toBe(1);
  });
});

describe('dayLabel', () => {
  const hoje = new Date(2026, 9, 23, 10);
  it('hoje, amanhã ou "dia mês"', () => {
    expect(dayLabel(new Date(2026, 9, 20), hoje)).toBe('hoje');
    expect(dayLabel(new Date(2026, 9, 23, 23), hoje)).toBe('hoje');
    expect(dayLabel(new Date(2026, 9, 24, 0, 30), hoje)).toBe('amanhã');
    expect(dayLabel(new Date(2026, 9, 29), hoje)).toBe('29 out');
    expect(dayLabel(new Date(2026, 11, 2), hoje)).toBe('2 dez');
  });
});
