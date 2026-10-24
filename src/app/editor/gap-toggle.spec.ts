import { blockText } from '../domain/text';
import { BlocoTexto } from '../domain/types';
import { blocosDeExemplo, editorPara } from '../testing/editor';
import { alternarLacuna, mensagemDoResultado } from './gap-toggle';

const LACUNA = 'manifestação unilateral de vontade';
const b2 = blocosDeExemplo['b2'] as BlocoTexto;

describe('alternarLacuna', () => {
  it('cursor dentro da lacuna desoculta e o texto do bloco não muda', () => {
    const { editor, ler, selecionar } = editorPara(b2);
    selecionar(LACUNA, 3, 3);
    const r = alternarLacuna(editor);
    expect(r).toEqual({ status: 'desfeita', texto: LACUNA, id: 'g1' });
    const segs = (ler() as BlocoTexto).segs;
    expect(segs.filter((s) => s.k === 'g').map((s) => s.k === 'g' && s.id)).toEqual(['g2']);
    expect(blockText(ler())).toBe(blockText(b2));
  });

  it('seleção igual à lacuna desoculta', () => {
    const { editor, selecionar } = editorPara(b2);
    selecionar(LACUNA);
    expect(alternarLacuna(editor).status).toBe('desfeita');
  });

  it('depois de desocultar, o cursor fica no fim do texto que era lacuna', () => {
    const { editor, selecionar } = editorPara(b2);
    selecionar(LACUNA, 3, 3);
    alternarLacuna(editor);
    const { from, empty } = editor.state.selection;
    expect([empty, editor.state.doc.textBetween(from - LACUNA.length, from)]).toEqual([
      true,
      LACUNA,
    ]);
  });

  it('seleção fora de lacuna oculta como antes', () => {
    const { editor, selecionar } = editorPara(b2);
    selecionar('Ato administrativo');
    expect(alternarLacuna(editor)).toMatchObject({ status: 'ok', texto: 'Ato administrativo' });
  });

  it('seleção por cima da lacuna ajusta em vez de desocultar', () => {
    const { editor, selecionar } = editorPara(b2);
    selecionar('a manifestação unilateral de vontade');
    expect(alternarLacuna(editor)).toMatchObject({ status: 'ajustada', id: 'g1' });
  });

  it('cursor na borda da lacuna avisa que não há seleção', () => {
    const { editor, selecionar } = editorPara(b2);
    selecionar(LACUNA, 0, 0);
    expect(alternarLacuna(editor).status).toBe('vazia');
  });
});

describe('mensagemDoResultado', () => {
  it.each([
    [{ status: 'ok', texto: 'vício', id: 'g' }, 'Lacuna criada: “vício”'],
    [{ status: 'ajustada', texto: 'vício', id: 'g' }, 'Lacuna ajustada: “vício”'],
    [{ status: 'desfeita', texto: 'vício', id: 'g' }, 'Lacuna desfeita: “vício”'],
    [{ status: 'vazia' }, 'Selecione um texto do resumo para ocultar como lacuna.'],
    [
      { status: 'atravessa' },
      'Selecione dentro de um mesmo trecho de texto, sem atravessar lacunas ou negritos.',
    ],
  ] as const)('%o vira "%s"', (resultado, mensagem) => {
    expect(mensagemDoResultado(resultado)).toBe(mensagem);
  });
});
