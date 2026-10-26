import { ATOS_ADMINISTRATIVOS } from '../domain/examples';
import { Assunto, Materia, Resumo } from '../domain/types';
import { EntradaFila } from './session';
import { trechoEmRevisao } from './trecho-em-revisao';

const resumos: Resumo[] = [
  { id: 'r1', assuntoId: 'a1', titulo: 'Atos', ordem: 0, blocos: ATOS_ADMINISTRATIVOS },
];
const assuntos: Assunto[] = [{ id: 'a1', materiaId: 'm1', nome: 'Atos', ordem: 0 }];
const materias: Materia[] = [{ id: 'm1', nome: 'Adm', ordem: 0 }];

const entrada = (trechoId: string, modo: EntradaFila['modo'] = 'lacunas'): EntradaFila => ({
  key: `r1:${trechoId}`,
  resumoId: 'r1',
  trechoId,
  materiaId: 'm1',
  assuntoId: 'a1',
  modo,
});

const montar = (e: EntradaFila) =>
  trechoEmRevisao({ entrada: e, resumos, assuntos, materias, densidade: 'média' });

describe('trechoEmRevisao', () => {
  it('monta o trecho com matéria, assunto, blocos e itens numerados', () => {
    const atual = montar(entrada('b1'));
    expect(atual.trecho?.titulo).toBe('Conceito e requisitos');
    expect(atual).toMatchObject({ materia: 'Adm', assunto: 'Atos', modo: 'lacunas' });
    expect(atual.blocos[0].id).toBe('b1');
    expect(atual.itens.map((i) => i.num)).toEqual(atual.itens.map((_, i) => i + 1));
  });

  it('no formato "Só perguntas", os itens são as perguntas da margem', () => {
    const atual = montar(entrada('b5', 'perguntas'));
    expect(atual.itens).toEqual([
      {
        tipo: 'pergunta',
        id: 'q2',
        num: 1,
        pergunta: 'Qual atributo dispensa ordem judicial?',
        resposta: 'Autoexecutoriedade',
      },
    ]);
  });

  it('aplica a alternativa do formato quando o trecho não tem perguntas', () => {
    expect(montar(entrada('b8', 'perguntas')).modo).toBe('titulo');
  });

  it('quando o trecho não existe mais, devolve o trecho vazio com o formato da fila', () => {
    expect(montar(entrada('sumiu', 'densas'))).toEqual({
      entrada: entrada('sumiu', 'densas'),
      trecho: null,
      materia: 'Adm',
      assunto: 'Atos',
      modo: 'densas',
      blocos: [],
      itens: [],
    });
  });

  it('sem matéria ou assunto conhecidos, os nomes ficam vazios', () => {
    const atual = trechoEmRevisao({
      entrada: entrada('b1'),
      resumos,
      assuntos: [],
      materias: [],
      densidade: 'média',
    });
    expect([atual.materia, atual.assunto]).toEqual(['', '']);
  });
});
