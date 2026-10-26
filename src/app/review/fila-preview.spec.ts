import { ATOS_ADMINISTRATIVOS } from '../domain/examples';
import { Bloco, EstadoTrecho, Resumo } from '../domain/types';
import { filaDoPreview, indiceDoTrecho, sessaoNoTrecho } from './fila-preview';

const resumo = (blocos: Bloco[] = ATOS_ADMINISTRATIVOS): Resumo => ({
  id: 'r1',
  assuntoId: 'a1',
  titulo: 'Atos',
  ordem: 0,
  blocos,
});

const estado = (key: string, S: number): EstadoTrecho => ({
  key,
  S,
  D: 5,
  due: new Date(2026, 9, 23),
  reps: 1,
  lapses: 0,
});

describe('filaDoPreview', () => {
  it('gera uma entrada por trecho, com a chave resumoId:trechoId', () => {
    const fila = filaDoPreview({ resumo: resumo(), materiaId: 'm1', estados: [], formato: 'auto' });
    expect(fila.map((e) => e.key)).toEqual(['r1:b1', 'r1:b5', 'r1:b8', 'r1:b16']);
    expect(fila[0]).toEqual({
      key: 'r1:b1',
      resumoId: 'r1',
      trechoId: 'b1',
      materiaId: 'm1',
      assuntoId: 'a1',
      modo: 'lacunas',
    });
  });

  it('inclui os trechos sem itens, para ver o resumo inteiro enquanto escreve', () => {
    const blocos: Bloco[] = [
      { id: 'h1', type: 'h2', segs: [{ k: 'g', id: 'g1', t: 'Com lacuna' }] },
      { id: 'h2', type: 'h2', segs: [{ k: 't', t: 'Sem lacunas' }] },
    ];
    const fila = filaDoPreview({
      resumo: resumo(blocos),
      materiaId: 'm1',
      estados: [],
      formato: 'auto',
    });
    expect(fila.map((e) => e.trechoId)).toEqual(['h1', 'h2']);
  });

  it('no formato automático usa o formato do estágio de cada trecho', () => {
    const estados = [estado('r1:b5', 10), estado('r1:b8', 30)];
    const fila = filaDoPreview({ resumo: resumo(), materiaId: 'm1', estados, formato: 'auto' });
    expect(fila.map((e) => e.modo)).toEqual(['lacunas', 'perguntas', 'densas', 'perguntas']);
  });

  it('com um formato escolhido, força esse formato em todos os trechos', () => {
    const fila = filaDoPreview({
      resumo: resumo(),
      materiaId: 'm1',
      estados: [],
      formato: 'titulo',
    });
    expect(fila.map((e) => e.modo)).toEqual(['titulo', 'titulo', 'titulo', 'titulo']);
  });
});

describe('indiceDoTrecho', () => {
  const fila = filaDoPreview({ resumo: resumo(), materiaId: 'm1', estados: [], formato: 'auto' });

  it('acha a posição do trecho na fila', () => {
    expect(indiceDoTrecho(fila, 'b8')).toBe(2);
  });

  it('quando o trecho não está na fila ou não foi informado, volta para o primeiro', () => {
    expect(indiceDoTrecho(fila, 'nao-existe')).toBe(0);
    expect(indiceDoTrecho(fila, null)).toBe(0);
  });
});

describe('sessaoNoTrecho', () => {
  it('cria a sessão parada no trecho, sem nada revelado nem marcado', () => {
    const fila = filaDoPreview({ resumo: resumo(), materiaId: 'm1', estados: [], formato: 'auto' });
    expect(sessaoNoTrecho(fila, 1)).toEqual({
      fila,
      indice: 1,
      revelado: false,
      marcas: {},
      recall: '',
      resultado: null,
      resultados: [],
      concluida: false,
    });
  });
});
