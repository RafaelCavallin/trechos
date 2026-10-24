import { ATOS_ADMINISTRATIVOS } from './examples';
import { blockWords } from './text';
import {
  hasNoItems,
  isOverLimit,
  mergeWithPrevious,
  splitBySubtitles,
  splitTrechos,
  trechoOfBlock,
  trechoWarnings,
  unmerge,
} from './trechos';
import { Bloco, CONFIG_PADRAO } from './types';

const p = (id: string, t: string): Bloco => ({ id, type: 'p', segs: [{ k: 't', t }] });
const h2 = (id: string, t: string, merge?: boolean): Bloco => ({
  id,
  type: 'h2',
  segs: [{ k: 't', t }],
  merge,
});
const h3 = (id: string, t: string, split?: boolean): Bloco => ({
  id,
  type: 'h3',
  segs: [{ k: 't', t }],
  split,
});

describe('splitTrechos', () => {
  it('divide o resumo de exemplo em 4 trechos, um por H2', () => {
    const trechos = splitTrechos(ATOS_ADMINISTRATIVOS);
    expect(trechos.map((t) => [t.id, t.num, t.titulo])).toEqual([
      ['b1', 1, 'Conceito e requisitos'],
      ['b5', 2, 'Atributos'],
      ['b8', 3, 'Extinção do ato'],
      ['b16', 4, 'Convalidação'],
    ]);
  });

  it('conta lacunas, perguntas e itens de cada trecho', () => {
    const trechos = splitTrechos(ATOS_ADMINISTRATIVOS);
    expect(trechos.map((t) => [t.lacunas, t.perguntas, t.itens])).toEqual([
      [6, 1, 7],
      [7, 1, 8],
      [6, 0, 6],
      [0, 0, 0],
    ]);
  });

  it('lista os H3 do trecho como subtítulos', () => {
    const [, , extincao] = splitTrechos(ATOS_ADMINISTRATIVOS);
    expect(extincao.subtitulos.map((b) => b.id)).toEqual(['b9', 'b12']);
  });

  it('o primeiro bloco sempre inicia um trecho, mesmo sem título', () => {
    const [t] = splitTrechos([p('x', 'Introdução solta'), h2('y', 'Depois')]);
    expect(t.id).toBe('x');
    expect(t.titulo).toBe('Sem título');
  });

  it('H3 não inicia trecho, a menos que tenha sido dividido', () => {
    expect(splitTrechos([h2('a', 'A'), h3('b', 'B'), p('c', 'texto')])).toHaveLength(1);
    expect(splitTrechos([h2('a', 'A'), h3('b', 'B', true), p('c', 'texto')])).toHaveLength(2);
  });

  it('H2 juntado ao anterior não inicia trecho', () => {
    const trechos = splitTrechos([h2('a', 'A'), p('x', 'um'), h2('b', 'B', true), p('y', 'dois')]);
    expect(trechos).toHaveLength(1);
    expect(trechos[0].blocos.map((b) => b.id)).toEqual(['a', 'x', 'b', 'y']);
  });

  it('resumo vazio não tem trechos', () => {
    expect(splitTrechos([])).toEqual([]);
  });

  it('acha o trecho de um bloco', () => {
    const trechos = splitTrechos(ATOS_ADMINISTRATIVOS);
    expect(trechoOfBlock(trechos, 'b13')?.id).toBe('b8');
    expect(trechoOfBlock(trechos, 'nao-existe')).toBeUndefined();
  });
});

describe('contagem de palavras', () => {
  it('não quebra palavras divididas entre segmentos (negrito no meio)', () => {
    const bloco: Bloco = {
      id: 'x',
      type: 'p',
      segs: [
        { k: 't', t: 'Compe', b: true },
        { k: 't', t: 'tência é ' },
        { k: 'g', id: 'g', t: 'vinculada' },
      ],
    };
    expect(blockWords(bloco)).toBe(3);
  });

  it('separa itens de lista e células de tabela', () => {
    const lista: Bloco = {
      id: 'l',
      type: 'list',
      items: [[{ k: 't', t: 'um' }], [{ k: 't', t: 'dois' }]],
    };
    expect(blockWords(lista)).toBe(2);
  });

  it('anexos não contam', () => {
    expect(blockWords({ id: 'a', type: 'attach', kind: 'file', name: 'lei.pdf', url: '' })).toBe(0);
  });
});

describe('juntar e separar', () => {
  const blocos = [h2('a', 'A'), p('x', 'um'), h2('b', 'B'), p('y', 'dois')];

  it('juntar ao anterior mescla os trechos e separar desfaz', () => {
    const juntado = mergeWithPrevious(blocos, 'b');
    expect(splitTrechos(juntado)).toHaveLength(1);
    expect(splitTrechos(unmerge(juntado, 'b'))).toHaveLength(2);
  });

  it('não junta o primeiro bloco nem blocos que não são H2', () => {
    expect(mergeWithPrevious(blocos, 'a')).toBe(blocos);
    expect(mergeWithPrevious(blocos, 'x')).toBe(blocos);
  });

  it('separar um H2 que não está juntado não muda nada', () => {
    expect(unmerge(blocos, 'b')).toBe(blocos);
    expect(unmerge(blocos, 'nao-existe')).toBe(blocos);
  });

  it('não altera o array original', () => {
    mergeWithPrevious(blocos, 'b');
    expect(blocos[2]).toEqual(h2('b', 'B'));
  });
});

describe('splitBySubtitles', () => {
  it('cada H3 do trecho vira um trecho próprio', () => {
    const extincao = splitTrechos(ATOS_ADMINISTRATIVOS)[2];
    const { blocos, novosTrechos } = splitBySubtitles(ATOS_ADMINISTRATIVOS, extincao);
    expect(novosTrechos).toEqual(['b9', 'b12']);
    expect(splitTrechos(blocos).map((t) => t.titulo)).toEqual([
      'Conceito e requisitos',
      'Atributos',
      'Extinção do ato',
      'Anulação',
      'Revogação',
      'Convalidação',
    ]);
  });

  it('sem subtítulos, nada muda', () => {
    const conceito = splitTrechos(ATOS_ADMINISTRATIVOS)[0];
    expect(splitBySubtitles(ATOS_ADMINISTRATIVOS, conceito).novosTrechos).toEqual([]);
  });
});

describe('avisos do trecho', () => {
  const trechos = splitTrechos(ATOS_ADMINISTRATIVOS);

  it('limite por palavras', () => {
    const r = isOverLimit(trechos[2], { ...CONFIG_PADRAO, limitePalavras: 10 });
    expect(r).toEqual({ acima: true, atual: trechos[2].palavras, limite: 10, unidade: 'palavras' });
    expect(isOverLimit(trechos[2], CONFIG_PADRAO).acima).toBe(false);
  });

  it('limite por lacunas: acima só quando passa do limite', () => {
    const cfg = { ...CONFIG_PADRAO, limiteTipo: 'lacunas' as const, limiteLacunas: 6 };
    expect(isOverLimit(trechos[0], cfg).acima).toBe(false); // 6 de 6
    expect(isOverLimit(trechos[1], cfg).acima).toBe(true); // 7 de 6
  });

  it('mensagem de limite oferece dividir só quando há subtítulos', () => {
    const cfg = { ...CONFIG_PADRAO, limiteTipo: 'lacunas' as const, limiteLacunas: 2 };
    const [comSub] = trechoWarnings(trechos[2], cfg);
    expect(comSub).toEqual({
      tipo: 'limite',
      mensagem: 'Trecho acima do limite: 6 de 2 lacunas.',
      podeDividir: true,
    });
    expect(trechoWarnings(trechos[1], cfg)[0]).toMatchObject({ podeDividir: false });
  });

  it('trecho sem itens recebe o aviso', () => {
    expect(hasNoItems(trechos[3])).toBe(true);
    expect(trechoWarnings(trechos[3], CONFIG_PADRAO)).toEqual([
      expect.objectContaining({ tipo: 'semItens' }),
    ]);
    expect(trechoWarnings(trechos[0], CONFIG_PADRAO)).toEqual([]);
  });
});
