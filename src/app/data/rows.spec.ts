import { CONFIG_PADRAO, EstadoTrecho } from '../domain/types';
import {
  fromConfiguracoes,
  fromEstadoTrecho,
  fromRegistroRevisao,
  splitTrechoKey,
  toAssunto,
  toConfiguracoes,
  toEstadoTrecho,
  toRegistroRevisao,
  toResumo,
} from './rows';

const RESUMO = '30000000-0000-0000-0000-000000000001';

describe('conversão entre linhas do banco e o modelo', () => {
  it('assunto e resumo', () => {
    expect(toAssunto({ id: 'a', materia_id: 'm', nome: 'Atos', ordem: 2 })).toEqual({
      id: 'a',
      materiaId: 'm',
      nome: 'Atos',
      ordem: 2,
    });
    expect(
      toResumo({ id: 'r', assunto_id: 'a', titulo: 'T', ordem: 0, blocos: null as never }).blocos,
    ).toEqual([]);
  });

  it('chave do trecho: separa no primeiro ":"', () => {
    expect(splitTrechoKey(`${RESUMO}:b1`)).toEqual({ resumoId: RESUMO, blocoId: 'b1' });
    expect(splitTrechoKey(`${RESUMO}:bloco:com:dois-pontos`).blocoId).toBe('bloco:com:dois-pontos');
    expect(() => splitTrechoKey('sem-separador')).toThrow();
  });

  it('estado do trecho vai e volta sem perder nada', () => {
    const estado: EstadoTrecho = {
      key: `${RESUMO}:b5`,
      S: 3.1,
      D: 6.4,
      due: new Date('2026-10-25T12:00:00Z'),
      lastReview: new Date('2026-10-22T12:00:00Z'),
      reps: 2,
      lapses: 1,
    };
    const row = fromEstadoTrecho(estado);
    expect(row).toMatchObject({
      resumo_id: RESUMO,
      bloco_id: 'b5',
      last_review: '2026-10-22T12:00:00.000Z',
    });
    expect(toEstadoTrecho(row)).toEqual(estado);
  });

  it('estado nunca revisado não tem lastReview', () => {
    const row = fromEstadoTrecho({
      key: `${RESUMO}:b1`,
      S: 0,
      D: 0,
      due: new Date(0),
      reps: 0,
      lapses: 0,
    });
    expect(row.last_review).toBeNull();
    expect('lastReview' in toEstadoTrecho(row)).toBe(false);
  });

  it('registro de revisão vai e volta', () => {
    const registro = {
      trechoKey: `${RESUMO}:b1`,
      data: new Date('2026-10-23T15:00:00Z'),
      modo: 'lacunas' as const,
      total: 5,
      acertos: 4,
      pct: 80,
      nota: 'Hard' as const,
      marcas: { g1: true, g2: false },
    };
    const row = { id: 'x', ...fromRegistroRevisao(registro) };
    expect(toRegistroRevisao(row)).toEqual({ id: 'x', ...registro });
  });

  it('configurações vão e voltam; retenção numérica pode vir como texto', () => {
    const row = fromConfiguracoes(CONFIG_PADRAO);
    expect(toConfiguracoes(row)).toEqual(CONFIG_PADRAO);
    expect(toConfiguracoes({ ...row, retencao: '0.85' }).retencao).toBe(0.85);
  });
});
