import {
  healthBand,
  healthByAssunto,
  healthByMateria,
  heatLevel,
  itemStats,
  mean,
  trechoErrorPct,
  weakPoints,
} from './health';
import { RegistroRevisao } from './types';

describe('saúde', () => {
  it('mean', () => {
    expect(mean([])).toBeNull();
    expect(mean([0.5, 1])).toBe(0.75);
  });

  it('assunto = média dos trechos; matéria = média dos assuntos', () => {
    const porAssunto = healthByAssunto([
      { assuntoId: 'a1', r: 0.6 },
      { assuntoId: 'a1', r: 0.8 },
      { assuntoId: 'a2', r: 1 },
    ]);
    expect(porAssunto.get('a1')).toBeCloseTo(0.7);
    expect(porAssunto.get('a2')).toBe(1);

    const porMateria = healthByMateria(
      [
        { id: 'a1', materiaId: 'm1' },
        { id: 'a2', materiaId: 'm1' },
        { id: 'a3', materiaId: 'm1' }, // sem trechos: não entra na média
        { id: 'a4', materiaId: 'm2' },
      ],
      porAssunto,
    );
    expect(porMateria.get('m1')).toBeCloseTo(0.85);
    expect(porMateria.has('m2')).toBe(false);
  });

  it('faixas de cor', () => {
    expect(healthBand(69)).toBe('baixa');
    expect(healthBand(70)).toBe('media');
    expect(healthBand(84)).toBe('media');
    expect(healthBand(85)).toBe('alta');
  });
});

describe('estatísticas por item', () => {
  const registro = (marcas: Record<string, boolean>): RegistroRevisao => ({
    id: 'r',
    trechoKey: 'k',
    data: new Date(2026, 9, 23),
    modo: 'lacunas',
    total: 0,
    acertos: 0,
    pct: 0,
    nota: 'Good',
    marcas,
  });

  it('soma revisões e erros por item e ignora lacunas dinâmicas', () => {
    const stats = itemStats([
      registro({ g1: true, g2: false, 'd:b1:segs:0:3': false }),
      registro({ g1: false, g2: false }),
    ]);
    expect(stats.get('g1')).toEqual({ lacunaId: 'g1', n: 2, erros: 1 });
    expect(stats.get('g2')).toEqual({ lacunaId: 'g2', n: 2, erros: 2 });
    expect(stats.has('d:b1:segs:0:3')).toBe(false);
  });

  it('pontos fracos: mín. 3 revisões, algum erro, maior taxa primeiro, até 4', () => {
    const s = (lacunaId: string, n: number, erros: number) => ({ lacunaId, n, erros });
    const pontos = weakPoints([
      s('poucas', 2, 2),
      s('sem-erro', 6, 0),
      s('g10', 6, 4),
      s('g8', 6, 3),
      s('g17', 5, 3),
      s('g19', 5, 3),
      s('g6', 4, 2),
    ]);
    expect(pontos.map((p) => p.lacunaId)).toEqual(['g10', 'g17', 'g19', 'g8']);
  });

  it('níveis do mapa de calor', () => {
    expect(heatLevel(undefined)).toBe(0);
    expect(heatLevel({ n: 5, erros: 0 })).toBe(0);
    expect(heatLevel({ n: 5, erros: 1 })).toBe(1); // 20%
    expect(heatLevel({ n: 4, erros: 1 })).toBe(2); // 25%
    expect(heatLevel({ n: 4, erros: 2 })).toBe(3); // 50%
  });

  it('taxa de erro do trecho agrega suas lacunas', () => {
    const stats = new Map([
      ['g1', { lacunaId: 'g1', n: 5, erros: 1 }],
      ['g2', { lacunaId: 'g2', n: 5, erros: 2 }],
    ]);
    expect(trechoErrorPct(['g1', 'g2', 'nunca-revisada'], stats)).toBe(30);
    expect(trechoErrorPct(['nunca-revisada'], stats)).toBeNull();
  });
});
