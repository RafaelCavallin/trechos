import { dynamicGapInterval, generateDynamicGaps } from './dynamic-gaps';
import { ATOS_ADMINISTRATIVOS } from './examples';
import { splitTrechos } from './trechos';
import { Bloco, BlocoRevisao, SegmentoDinamico } from './types';
import { segmentArrays } from './text';

const dinamicas = (blocos: BlocoRevisao[]) =>
  blocos.flatMap((b) => segmentArrays(b).flat()).filter((s): s is SegmentoDinamico => s.k === 'd');

const paragrafo = (t: string): Bloco => ({ id: 'p', type: 'p', segs: [{ k: 't', t }] });

describe('generateDynamicGaps', () => {
  it('intervalo pela densidade e pelo formato', () => {
    expect(dynamicGapInterval('lacunas', 'baixa')).toBe(8);
    expect(dynamicGapInterval('lacunas', 'média')).toBe(5);
    expect(dynamicGapInterval('lacunas', 'alta')).toBe(3);
    expect(dynamicGapInterval('densas', 'baixa')).toBe(2);
    expect(dynamicGapInterval('titulo', 'alta')).toBe(0);
    expect(dynamicGapInterval('perguntas', 'alta')).toBe(0);
  });

  it('oculta a cada N palavras de 7+ letras, mantendo pontuação e espaços', () => {
    const [b] = generateDynamicGaps(
      { blocos: [paragrafo('Administração pública, princípios constitucionais.')] },
      'densas',
      'média',
    );
    expect(b).toEqual({
      id: 'p',
      type: 'p',
      segs: [
        { k: 't', t: 'Administração ' },
        { k: 'd', id: 'd:p:segs:0:2', t: 'pública' },
        { k: 't', t: ', princípios ' },
        { k: 'd', id: 'd:p:segs:0:6', t: 'constitucionais' },
        { k: 't', t: '.' },
      ],
    });
  });

  it('o texto visível continua o mesmo', () => {
    const texto = 'Administração pública, princípios constitucionais e legalidade estrita.';
    const [b] = generateDynamicGaps({ blocos: [paragrafo(texto)] }, 'densas', 'alta');
    expect(
      segmentArrays(b)[0]
        .map((s) => s.t)
        .join(''),
    ).toBe(texto);
  });

  it('é determinístico para o mesmo texto', () => {
    const [trecho] = splitTrechos(ATOS_ADMINISTRATIVOS);
    expect(generateDynamicGaps(trecho, 'lacunas', 'alta')).toEqual(
      generateDynamicGaps(trecho, 'lacunas', 'alta'),
    );
  });

  it('não oculta títulos, negritos, lacunas manuais, anexos nem o cabeçalho da tabela', () => {
    const blocos: Bloco[] = [
      { id: 'h', type: 'h2', segs: [{ k: 't', t: 'Competência discricionária' }] },
      { id: 's', type: 'h3', segs: [{ k: 't', t: 'Legalidade administrativa' }] },
      {
        id: 'p',
        type: 'p',
        segs: [
          { k: 't', t: 'Competência', b: true },
          { k: 'g', id: 'g1', t: 'vinculada' },
        ],
      },
      {
        id: 't',
        type: 'table',
        rows: [[[{ k: 't', t: 'Atributos importantes' }]], [[{ k: 't', t: 'Imperatividade' }]]],
      },
      { id: 'a', type: 'attach', kind: 'file', name: 'documento-importante.pdf', url: '' },
    ];
    const ids = dinamicas(generateDynamicGaps({ blocos }, 'densas', 'alta')).map((d) => d.id);
    // Só "Imperatividade" é candidata; com intervalo 2 ela é a 1ª, então nada é ocultado.
    expect(ids).toEqual([]);
    const lacunas = dinamicas(
      generateDynamicGaps({ blocos: [...blocos, blocos[3]] }, 'densas', 'alta'),
    );
    expect(lacunas.map((d) => [d.id, d.t])).toEqual([['d:t:rows.1.0:0:0', 'Imperatividade']]);
  });

  it('não oculta texto com significado (sigla) e o mantém com o significado', () => {
    const sigla = { k: 't' as const, t: 'Constituição', n: 'Constituição Federal de 1988' };
    const bloco: Bloco = { id: 'p', type: 'p', segs: [sigla, sigla, sigla] };
    const [b] = generateDynamicGaps({ blocos: [bloco] }, 'densas', 'alta');
    expect(b).toEqual(bloco);
  });

  it('formatos sem lacunas dinâmicas devolvem os blocos como estão', () => {
    const [trecho] = splitTrechos(ATOS_ADMINISTRATIVOS);
    expect(generateDynamicGaps(trecho, 'titulo', 'alta')).toEqual(trecho.blocos);
  });

  it('formato denso oculta mais que o normal', () => {
    const [, , extincao] = splitTrechos(ATOS_ADMINISTRATIVOS);
    const normal = dinamicas(generateDynamicGaps(extincao, 'lacunas', 'média')).length;
    const densas = dinamicas(generateDynamicGaps(extincao, 'densas', 'média')).length;
    expect(normal).toBeGreaterThan(0);
    expect(densas).toBeGreaterThan(normal * 2);
  });
});
