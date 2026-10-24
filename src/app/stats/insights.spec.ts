import { itemStats } from '../domain/health';
import { ATOS_ADMINISTRATIVOS, REMEDIOS_CONSTITUCIONAIS } from '../domain/examples';
import { Assunto, Materia, RegistroRevisao, Resumo } from '../domain/types';
import { scheduledTrechos } from '../scheduler/candidates';
import { Agendador } from '../scheduler/fsrs';
import {
  healthRanking,
  heatMap,
  heatTitle,
  history,
  indexGaps,
  longDate,
  rateBand,
  retention,
  reviewedSummaries,
  shortDate,
  weakGaps,
} from './insights';

const hoje = new Date(2026, 9, 23, 10);
const materias: Materia[] = [
  { id: 'adm', nome: 'Direito Administrativo', ordem: 0 },
  { id: 'const', nome: 'Direito Constitucional', ordem: 1 },
  { id: 'port', nome: 'Português', ordem: 2 },
];
const assuntos: Assunto[] = [
  { id: 'atos', materiaId: 'adm', nome: 'Atos', ordem: 0 },
  { id: 'df', materiaId: 'const', nome: 'DF', ordem: 0 },
];
const resumos: Resumo[] = [
  { id: 'r1', assuntoId: 'atos', titulo: 'Atos', ordem: 0, blocos: ATOS_ADMINISTRATIVOS },
  { id: 'r2', assuntoId: 'df', titulo: 'Remédios', ordem: 0, blocos: REMEDIOS_CONSTITUCIONAIS },
];
const registro = (
  key: string,
  marcas: Record<string, boolean>,
  data = hoje,
  over: Partial<RegistroRevisao> = {},
): RegistroRevisao => ({
  id: `${key}-${data.getTime()}`,
  trechoKey: key,
  data,
  modo: 'lacunas',
  total: 0,
  acertos: 0,
  pct: 80,
  nota: 'Hard',
  marcas,
  ...over,
});

describe('datas', () => {
  it('curta e longa', () => {
    expect(shortDate(new Date(2026, 9, 23, 8), hoje)).toBe('hoje');
    expect(shortDate(new Date(2026, 9, 22, 23), hoje)).toBe('ontem');
    expect(shortDate(new Date(2026, 9, 19), hoje)).toBe('19 out');
    expect(longDate(hoje)).toBe('Sexta-feira, 23 de outubro');
  });
});

describe('pontos fracos', () => {
  it('indexa as lacunas com trecho e matéria', () => {
    const indice = indexGaps(resumos, assuntos, materias);
    expect(indice.size).toBe(21);
    expect(indice.get('g10')).toEqual({
      id: 'g10',
      texto: 'Autoexecutoriedade',
      resumoId: 'r1',
      trechoTitulo: 'Atributos',
      materia: 'Direito Administrativo',
    });
  });

  it('as mais erradas, só lacunas que ainda existem', () => {
    const regs = [
      registro('r1:b5', { g10: false, g8: false, sumiu: false, q2: false }),
      registro('r1:b5', { g10: false, g8: true, sumiu: false, q2: false }),
      registro('r1:b5', { g10: false, g8: false, sumiu: false, q2: false }),
    ];
    const pontos = weakGaps(regs, indexGaps(resumos, assuntos, materias));
    expect(pontos.map((p) => [p.id, p.descricao])).toEqual([
      ['g10', 'Errada em 3 de 3 revisões'],
      ['g8', 'Errada em 2 de 3 revisões'],
    ]);
  });
});

describe('retenção', () => {
  const ag = new Agendador(0.9);
  const estados = [ag.revisar(Agendador.novo('r1:b1', hoje), 'Good', new Date(2026, 9, 20))];
  const trechos = scheduledTrechos(resumos, assuntos, estados, ag, hoje);

  it('por matéria e assunto; sem revisão fica vazia', () => {
    const r = retention(materias, assuntos, trechos);
    expect(r[0].pct).toBeGreaterThan(0);
    expect(r[0].assuntos[0].pct).toBe(r[0].pct);
    expect(r[1]).toMatchObject({ pct: null, assuntos: [{ pct: null }] });
    expect(r[2]).toMatchObject({ pct: null, assuntos: [] });
  });

  it('ranking da saúde: só quem tem revisões, do menor para o maior', () => {
    const r = retention(materias, assuntos, trechos);
    expect(healthRanking(r)).toEqual([{ nome: 'Direito Administrativo', pct: r[0].pct }]);
    expect(
      healthRanking([
        { ...r[0], pct: 90 },
        { ...r[1], pct: 60 },
      ]).map((x) => x.pct),
    ).toEqual([60, 90]);
  });

  it('histórico com trecho, matéria e data', () => {
    const regs = [
      registro('r2:c1', {}, new Date(2026, 9, 23, 9), { pct: 100, nota: 'Easy' }),
      registro('r1:b1', {}, new Date(2026, 9, 21), { pct: 50, nota: 'Again' }),
      registro('r9:x', {}, new Date(2026, 9, 1)),
    ];
    expect(
      history(regs, trechos, materias, hoje).map((h) => [
        h.data,
        h.trecho,
        h.materia,
        h.pct,
        h.nota,
      ]),
    ).toEqual([
      ['hoje', 'Remédios constitucionais', 'Direito Constitucional', 100, 'Easy'],
      ['21 out', 'Conceito e requisitos', 'Direito Administrativo', 50, 'Again'],
      ['1 out', 'Trecho removido', '', 80, 'Hard'],
    ]);
    expect(history(regs, trechos, materias, hoje, 1)).toHaveLength(1);
  });
});

describe('mapa de calor', () => {
  const stats = itemStats([
    registro('r1:b1', { g1: false, g2: true }),
    registro('r1:b1', { g1: false, g2: true }),
  ]);

  it('taxa por trecho e rótulos', () => {
    const mapa = heatMap(ATOS_ADMINISTRATIVOS, stats);
    expect(mapa.map((t) => [t.trecho.num, t.taxa, t.rotulo])).toEqual([
      [1, 50, '50% de erro nas lacunas'],
      [2, null, 'Sem revisões'],
      [3, null, 'Sem revisões'],
      [4, null, 'Sem revisões'],
    ]);
  });

  it('faixas da etiqueta e dica da lacuna', () => {
    expect([null, 0, 29, 30].map(rateBand)).toEqual(['nenhuma', 'zero', 'baixa', 'alta']);
    expect(heatTitle(stats.get('g1'))).toBe('Errada em 2 de 2 revisões');
    expect(heatTitle(undefined)).toBe('Ainda não revisada');
  });

  it('opções: só resumos com lacunas revisadas', () => {
    expect(reviewedSummaries(resumos, stats).map((r) => r.id)).toEqual(['r1']);
  });
});
