import { TextSelection } from '@tiptap/pm/state';
import { BlocoLista, BlocoTexto } from '../domain/types';
import { blocosDeExemplo, editorPara } from '../testing/editor';
import { hideSelection } from './gap-mark';
import { alvoDaSigla, marcarSigla, mensagemDaSigla } from './sigla-command';

const b2 = blocosDeExemplo['b2'] as BlocoTexto;
const comSigla: BlocoTexto = {
  id: 'p1',
  type: 'p',
  segs: [
    { k: 't', t: 'Decisão do ' },
    { k: 't', t: 'STF', n: 'Supremo Tribunal Federal' },
    { k: 't', t: ' hoje' },
  ],
};

describe('alvoDaSigla', () => {
  it('seleção comum vira alvo sem significado, com espaços aparados', () => {
    const { editor, selecionar } = editorPara(b2);
    selecionar(' administrativo ');
    expect(alvoDaSigla(editor.state)).toMatchObject({ texto: 'administrativo', nota: '' });
  });

  it('cursor dentro de uma sigla traz a sigla inteira e o significado atual', () => {
    const { editor, selecionar } = editorPara(comSigla);
    selecionar('STF', 1, 1);
    expect(alvoDaSigla(editor.state)).toMatchObject({
      texto: 'STF',
      nota: 'Supremo Tribunal Federal',
    });
  });

  it.each([
    ['sem seleção', 'Ato', 0, 0, 'vazia'],
    ['só espaços', ' é ', 0, 1, 'vazia'],
    ['por cima de uma lacuna', 'a manifestação', 0, 14, 'lacuna'],
  ] as const)('%s não serve de alvo', (_, alvo, de, ate, falha) => {
    const { editor, selecionar } = editorPara(b2);
    selecionar(alvo, de, ate);
    expect(alvoDaSigla(editor.state)).toBe(falha);
  });

  it('seleção que atravessa itens de uma lista não serve de alvo', () => {
    const { editor, selecionar } = editorPara(blocosDeExemplo['b3'] as BlocoLista);
    selecionar('Competência');
    const inicio = editor.state.selection.from;
    selecionar('Finalidade');
    const selecao = TextSelection.create(editor.state.doc, inicio, editor.state.selection.to);
    editor.view.dispatch(editor.state.tr.setSelection(selecao));
    expect(alvoDaSigla(editor.state)).toBe('atravessa');
  });
});

describe('marcarSigla', () => {
  it('guarda o significado no segmento e o texto do bloco não muda', () => {
    const { editor, ler, selecionar } = editorPara(b2);
    selecionar('Ato administrativo');
    const resultado = marcarSigla(editor, '  Ato da Administração  ');
    expect(resultado).toEqual({ status: 'ok', texto: 'Ato administrativo' });
    expect((ler() as BlocoTexto).segs[0]).toEqual({
      k: 't',
      t: 'Ato administrativo',
      n: 'Ato da Administração',
    });
  });

  it('com o cursor na sigla, troca o significado da sigla inteira', () => {
    const { editor, ler, selecionar } = editorPara(comSigla);
    selecionar('STF', 2, 2);
    marcarSigla(editor, 'Supremo');
    expect((ler() as BlocoTexto).segs[1]).toEqual({ k: 't', t: 'STF', n: 'Supremo' });
  });

  it('significado vazio remove a sigla e junta o texto de novo', () => {
    const { editor, ler, selecionar } = editorPara(comSigla);
    selecionar('STF', 1, 1);
    expect(marcarSigla(editor, ' ')).toEqual({ status: 'removida', texto: 'STF' });
    expect((ler() as BlocoTexto).segs).toEqual([{ k: 't', t: 'Decisão do STF hoje' }]);
  });

  it('sem alvo, não muda nada e devolve a falha', () => {
    const { editor, ler } = editorPara(comSigla);
    expect(marcarSigla(editor, 'x')).toEqual({ status: 'vazia' });
    expect(ler()).toEqual(comSigla);
  });

  it('convive com negrito', () => {
    const { editor, ler, selecionar } = editorPara(comSigla);
    selecionar('STF');
    editor.commands.toggleBold();
    expect((ler() as BlocoTexto).segs[1]).toEqual({
      k: 't',
      t: 'STF',
      b: true,
      n: 'Supremo Tribunal Federal',
    });
  });

  it('ocultar como lacuna tira o significado', () => {
    const { editor, ler, selecionar } = editorPara(comSigla);
    selecionar('STF');
    hideSelection(editor, 'g-novo');
    expect((ler() as BlocoTexto).segs[1]).toEqual({ k: 'g', id: 'g-novo', t: 'STF' });
  });
});

describe('conversão de siglas', () => {
  it('bloco com sigla volta idêntico do editor', () => {
    const { ler } = editorPara(comSigla);
    expect(ler()).toEqual(comSigla);
  });

  it('no editor, a sigla vira abbr com o significado no title', () => {
    const { editor } = editorPara(comSigla);
    expect(editor.getHTML()).toContain(
      '<abbr data-nota="Supremo Tribunal Federal" title="Supremo Tribunal Federal" class="sigla">STF</abbr>',
    );
  });

  it('ao colar HTML com sigla, mantém o significado', () => {
    const { editor, ler } = editorPara(comSigla);
    editor.commands.setContent('<p><abbr data-nota="Código Civil">CC</abbr> art. 1</p>');
    expect((ler() as BlocoTexto).segs[0]).toEqual({ k: 't', t: 'CC', n: 'Código Civil' });
  });
});

describe('mensagemDaSigla', () => {
  it.each([
    [{ status: 'ok', texto: 'STF' }, 'Significado salvo: “STF”'],
    [{ status: 'removida', texto: 'STF' }, 'Significado removido: “STF”'],
    [{ status: 'vazia' }, 'Selecione um texto, como uma sigla, para explicar o que ele significa.'],
    [{ status: 'atravessa' }, 'Selecione um texto dentro de um mesmo parágrafo, item ou célula.'],
    [{ status: 'lacuna' }, 'Lacunas não levam significado. Selecione um texto fora delas.'],
  ] as const)('%o', (resultado, mensagem) => {
    expect(mensagemDaSigla(resultado)).toBe(mensagem);
  });
});
