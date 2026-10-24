import { BlocoTabela, BlocoTexto } from '../domain/types';
import { blocosDeExemplo, editorPara } from '../testing/editor';
import { lacunaParaDesocultar, lacunasDoTexto } from './gap-ranges';

const LACUNA = 'manifestação unilateral de vontade';

describe('lacunasDoTexto', () => {
  it('lista as lacunas do parágrafo com o intervalo de cada uma', () => {
    const { editor, selecionar } = editorPara(blocosDeExemplo['b2'] as BlocoTexto);
    selecionar('Ato', 0, 0);
    const lacunas = lacunasDoTexto(editor.state.selection.$from);
    const textos = [...lacunas].map(([id, r]) => [id, editor.state.doc.textBetween(r.from, r.to)]);
    expect(textos).toEqual([
      ['g1', LACUNA],
      ['g2', 'efeitos jurídicos imediatos'],
    ]);
  });

  it('numa tabela, só olha a célula onde está a seleção', () => {
    const { editor, selecionar } = editorPara(blocosDeExemplo['b6'] as BlocoTabela);
    selecionar('Impõe obrigações', 0, 0);
    expect([...lacunasDoTexto(editor.state.selection.$from).keys()]).toEqual([]);
  });
});

describe('lacunaParaDesocultar', () => {
  function estadoCom(de: number, ate: number) {
    const { editor, selecionar } = editorPara(blocosDeExemplo['b2'] as BlocoTexto);
    selecionar(LACUNA, de, ate);
    return editor.state;
  }

  it('cursor no meio da lacuna devolve a lacuna inteira', () => {
    const lacuna = lacunaParaDesocultar(estadoCom(3, 3));
    expect(lacuna?.id).toBe('g1');
    expect(lacuna!.to - lacuna!.from).toBe(LACUNA.length);
  });

  it('seleção igual à lacuna devolve a lacuna', () => {
    expect(lacunaParaDesocultar(estadoCom(0, LACUNA.length))?.id).toBe('g1');
  });

  it('cursor na borda da lacuna não conta como dentro', () => {
    expect(lacunaParaDesocultar(estadoCom(0, 0))).toBeNull();
    expect(lacunaParaDesocultar(estadoCom(LACUNA.length, LACUNA.length))).toBeNull();
  });

  it('seleção de parte da lacuna não desoculta (é ajuste)', () => {
    expect(lacunaParaDesocultar(estadoCom(0, 5))).toBeNull();
  });

  it('cursor fora de lacuna devolve null', () => {
    const { editor, selecionar } = editorPara(blocosDeExemplo['b2'] as BlocoTexto);
    selecionar('Ato', 1, 1);
    expect(lacunaParaDesocultar(editor.state)).toBeNull();
  });
});
