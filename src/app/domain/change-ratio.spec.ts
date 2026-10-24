import { blockChangeRatio, changeRatio, editEffect } from './change-ratio';
import { Bloco } from './types';

describe('changeRatio', () => {
  it('texto igual: 0%', () => {
    expect(changeRatio('igual', 'igual')).toBe(0);
  });

  it('mede só o miolo alterado', () => {
    // Prefixo "O " e sufixo "o dorme." iguais; sobram "gat" → "cã": 3 de 13 caracteres.
    expect(changeRatio('O gato dorme.', 'O cão dorme.')).toBe(23);
  });

  it('acrescentar texto conta pelo tamanho do acréscimo', () => {
    expect(changeRatio('abcd', 'abcdabcd')).toBe(100);
    expect(changeRatio('abcdefghij', 'abcdefghij!')).toBe(10);
  });

  it('nunca passa de 100%', () => {
    expect(changeRatio('a', 'texto totalmente novo')).toBe(100);
  });

  it('texto vazio antes', () => {
    expect(changeRatio('', 'novo')).toBe(100);
  });

  it('transformar trecho em lacuna ou negrito não conta como alteração', () => {
    const antes: Bloco = { id: 'x', type: 'p', segs: [{ k: 't', t: 'Efeitos ex tunc.' }] };
    const depois: Bloco = {
      id: 'x',
      type: 'p',
      segs: [
        { k: 't', t: 'Efeitos', b: true },
        { k: 't', t: ' ' },
        { k: 'g', id: 'g1', t: 'ex tunc' },
        { k: 't', t: '.' },
      ],
    };
    expect(blockChangeRatio(antes, depois)).toBe(0);
  });
});

describe('blockChangeRatio em anexos', () => {
  it('compara o nome do arquivo', () => {
    const anexo = (name: string): Bloco => ({
      id: 'a',
      type: 'attach',
      kind: 'file',
      name,
      url: '',
    });
    expect(blockChangeRatio(anexo('lei.pdf'), anexo('lei.pdf'))).toBe(0);
    expect(blockChangeRatio(anexo('lei.pdf'), anexo('lei-2.pdf'))).toBeGreaterThan(0);
  });
});

describe('editEffect', () => {
  it('até o limite mantém o estado', () => {
    expect(editEffect(10, 30, 30)).toEqual({ pct: 30, reduzir: false, novoS: 10 });
  });

  it('acima do limite reduz a estabilidade para 40%', () => {
    expect(editEffect(10, 31, 30)).toEqual({ pct: 31, reduzir: true, novoS: 4 });
  });

  it('nunca abaixo de meio dia', () => {
    expect(editEffect(1, 80, 30).novoS).toBe(0.5);
  });

  it('trecho nunca revisado não é afetado', () => {
    expect(editEffect(0, 100, 30).reduzir).toBe(false);
  });
});
