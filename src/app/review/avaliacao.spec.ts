import { ATOS_ADMINISTRATIVOS } from '../domain/examples';
import { CONFIG_PADRAO, EstadoTrecho, Resumo } from '../domain/types';
import { Agendador } from '../scheduler/fsrs';
import { avaliarTrecho } from './avaliacao';
import { sessaoNoTrecho } from './fila-preview';
import { EntradaFila, revelar } from './session';
import { trechoEmRevisao } from './trecho-em-revisao';

const agora = new Date(2026, 9, 23, 10, 0);
const resumos: Resumo[] = [
  { id: 'r1', assuntoId: 'a1', titulo: 'Atos', ordem: 0, blocos: ATOS_ADMINISTRATIVOS },
];
const entrada: EntradaFila = {
  key: 'r1:b5',
  resumoId: 'r1',
  trechoId: 'b5',
  materiaId: 'm1',
  assuntoId: 'a1',
  modo: 'perguntas',
};
const atual = trechoEmRevisao({ entrada, resumos, assuntos: [], materias: [], densidade: 'média' });
const agendador = new Agendador(CONFIG_PADRAO.retencao);

const avaliar = (acertou: boolean, anterior?: EstadoTrecho) =>
  avaliarTrecho({
    sessao: { ...revelar(sessaoNoTrecho([entrada], 0)), marcas: { q2: acertou } },
    atual,
    faixas: CONFIG_PADRAO.faixas,
    anterior,
    agendador,
    agora,
  });

describe('avaliarTrecho', () => {
  it('com todos os itens certos, dá nota Easy e nenhuma errada', () => {
    const { resultado, marcas, modo } = avaliar(true);
    expect(marcas).toEqual({ q2: true });
    expect(modo).toBe('perguntas');
    expect(resultado).toMatchObject({
      key: 'r1:b5',
      titulo: 'Atributos',
      materiaId: 'm1',
      total: 1,
      acertos: 1,
      pct: 100,
      nota: 'Easy',
      erradas: [],
    });
  });

  it('lista o texto dos itens errados', () => {
    const { resultado } = avaliar(false);
    expect(resultado).toMatchObject({ pct: 0, nota: 'Again' });
    expect(resultado.erradas).toEqual(['Qual atributo dispensa ordem judicial?']);
  });

  it('sem estado anterior, agenda a partir de um trecho novo', () => {
    const { estado, resultado } = avaliar(true);
    expect(estado).toMatchObject({ key: 'r1:b5', reps: 1, lastReview: agora });
    expect(resultado.due).toEqual(estado.due);
  });

  it('com estado anterior, parte dele', () => {
    const anterior = agendador.revisar(Agendador.novo('r1:b5', agora), 'Good', agora);
    expect(avaliar(true, anterior).estado.reps).toBe(2);
  });

  it('item sem marca conta como erro', () => {
    const sessao = revelar(sessaoNoTrecho([entrada], 0));
    const dados = {
      sessao,
      atual,
      faixas: CONFIG_PADRAO.faixas,
      anterior: undefined,
      agendador,
      agora,
    };
    expect(avaliarTrecho(dados).marcas).toEqual({ q2: false });
  });

  it('trecho que sumiu fica sem título e sem itens', () => {
    const sumiu = trechoEmRevisao({
      entrada: { ...entrada, trechoId: 'sumiu' },
      resumos,
      assuntos: [],
      materias: [],
      densidade: 'média',
    });
    const sessao = revelar(sessaoNoTrecho([entrada], 0));
    const dados = {
      sessao,
      atual: sumiu,
      faixas: CONFIG_PADRAO.faixas,
      anterior: undefined,
      agendador,
      agora,
    };
    expect(avaliarTrecho(dados).resultado).toMatchObject({ titulo: '', total: 0, erradas: [] });
  });
});
