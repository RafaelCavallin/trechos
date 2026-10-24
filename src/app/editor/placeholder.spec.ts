import { dicaDoBloco } from './placeholder';

describe('dicaDoBloco', () => {
  it('título ganha a extensão de dica com "Título do trecho"', () => {
    const [extensao] = dicaDoBloco('h2');
    expect(extensao.name).toBe('placeholder');
    expect(extensao.options.placeholder).toBe('Título do trecho');
  });

  it('subtítulo usa a dica "Subtítulo"', () => {
    expect(dicaDoBloco('h3')[0].options.placeholder).toBe('Subtítulo');
  });

  it.each(['p', 'quote', 'special', 'list'] as const)('%s usa a dica "Escreva aqui…"', (tipo) => {
    expect(dicaDoBloco(tipo)[0].options.placeholder).toBe('Escreva aqui…');
  });

  it('tabela não ganha dica, para não repetir em cada célula vazia', () => {
    expect(dicaDoBloco('table')).toEqual([]);
  });
});
