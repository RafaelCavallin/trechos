import { ATOS_ADMINISTRATIVOS, REMEDIOS_CONSTITUCIONAIS } from '../domain/examples';
import { Assunto, Resumo } from '../domain/types';
import { scheduledTrechos } from '../scheduler/candidates';
import { Agendador } from '../scheduler/fsrs';
import {
  ResultadoTrecho,
  alternar,
  iniciar,
  marcar,
  marcarRestantes,
  podeMarcar,
  progresso,
  proximo,
  registrarResultado,
  resumoDaSessao,
  revelar,
  sair,
} from './session';

const agora = new Date(2026, 9, 23, 10);
const assuntos: Assunto[] = [
  { id: 'a1', materiaId: 'adm', nome: 'Atos', ordem: 0 },
  { id: 'a2', materiaId: 'const', nome: 'DF', ordem: 0 },
];
const resumos: Resumo[] = [
  { id: 'r1', assuntoId: 'a1', titulo: 'Atos', ordem: 0, blocos: ATOS_ADMINISTRATIVOS },
  { id: 'r2', assuntoId: 'a2', titulo: 'Remédios', ordem: 0, blocos: REMEDIOS_CONSTITUCIONAIS },
];
const ag = new Agendador(0.9);
const estados = [
  { key: 'r1:b5', S: 8, D: 5, due: agora, reps: 2, lapses: 0, lastReview: new Date(2026, 9, 15) },
  { key: 'r1:b8', S: 20, D: 5, due: agora, reps: 4, lapses: 0, lastReview: new Date(2026, 9, 1) },
  { key: 'r2:c1', S: 8, D: 5, due: agora, reps: 2, lapses: 0, lastReview: new Date(2026, 9, 15) },
];
const trechos = scheduledTrechos(resumos, assuntos, estados, ag, agora).filter((t) => t.itens > 0);

const resultado = (over: Partial<ResultadoTrecho> = {}): ResultadoTrecho => ({
  key: 'k',
  titulo: 'T',
  materiaId: 'adm',
  total: 4,
  acertos: 3,
  pct: 75,
  nota: 'Hard',
  due: new Date(2026, 9, 26),
  erradas: [],
  ...over,
});

describe('sessão de revisão', () => {
  it('congela a fila com o formato de cada trecho pelo estágio', () => {
    const s = iniciar(trechos);
    expect(s.fila.map((e) => [e.key, e.modo])).toEqual([
      ['r1:b1', 'lacunas'], // novo
      ['r1:b5', 'perguntas'], // intermediário, com pergunta
      ['r1:b8', 'densas'], // estável
      ['r2:c1', 'perguntas'],
    ]);
    expect(s).toMatchObject({
      indice: 0,
      revelado: false,
      marcas: {},
      resultado: null,
      concluida: false,
    });
  });

  it('só marca depois de revelar e antes da nota', () => {
    let s = iniciar(trechos);
    expect(marcar(s, 'g1', true)).toBe(s);
    s = revelar(s);
    expect(podeMarcar(s)).toBe(true);
    s = marcar(s, 'g1', false);
    expect(s.marcas).toEqual({ g1: false });
    s = registrarResultado(s, resultado());
    expect(marcar(s, 'g2', true)).toBe(s);
  });

  it('clique alterna sem marca → acertou → errou → acertou', () => {
    let s = revelar(iniciar(trechos));
    s = alternar(s, 'g1');
    expect(s.marcas['g1']).toBe(true);
    s = alternar(s, 'g1');
    expect(s.marcas['g1']).toBe(false);
    s = alternar(s, 'g1');
    expect(s.marcas['g1']).toBe(true);
  });

  it('marcar restantes como acerto não mexe nos já marcados', () => {
    let s = marcar(revelar(iniciar(trechos)), 'g2', false);
    s = marcarRestantes(s, [{ id: 'g1' }, { id: 'g2' }, { id: 'g3' }]);
    expect(s.marcas).toEqual({ g1: true, g2: false, g3: true });
  });

  it('avança limpando o trecho e conclui depois do último', () => {
    let s = registrarResultado(marcar(revelar(iniciar(trechos)), 'g1', true), resultado());
    expect(progresso(s)).toBe(25);
    s = proximo(s);
    expect(s).toMatchObject({
      indice: 1,
      revelado: false,
      marcas: {},
      resultado: null,
      recall: '',
    });
    expect(s.resultados).toHaveLength(1);
    expect(progresso(s)).toBe(25);
    s = proximo(proximo(proximo(s)));
    expect(s.concluida).toBe(true);
  });

  it('sair: sem nada avaliado encerra; com algo avaliado mostra o resumo', () => {
    const s = iniciar(trechos);
    expect(sair(s)).toBeNull();
    expect(sair(registrarResultado(s, resultado()))?.concluida).toBe(true);
  });

  it('resumo da sessão com quem volta amanhã', () => {
    let s = iniciar(trechos);
    s = registrarResultado(
      s,
      resultado({ key: 'a', acertos: 2, total: 5, due: new Date(2026, 9, 24, 15), erradas: ['x'] }),
    );
    s = registrarResultado(
      s,
      resultado({ key: 'b', acertos: 5, total: 5, due: new Date(2026, 9, 30) }),
    );
    expect(resumoDaSessao(s, agora)).toEqual({
      revisados: 2,
      acertos: 7,
      total: 10,
      pct: 70,
      voltamAmanha: [expect.objectContaining({ key: 'a' })],
    });
  });
});
