import { TextSelection } from '@tiptap/pm/state';
import { BlocoLista, BlocoTabela, BlocoTexto } from '../domain/types';
import { blocosDeExemplo, editorPara } from '../testing/editor';
import { BlocoDeTexto, inlineToSegs, splitInline } from './doc-conversion';
import { hideSelection } from './gap-mark';

const blocos = blocosDeExemplo;

describe('conversão bloco ↔ documento', () => {
  it.each(['b1', 'b2', 'b3', 'b4', 'b6', 'b9', 'b11'])('bloco %s volta idêntico', (id) => {
    const bloco = blocos[id] as BlocoDeTexto;
    const { ler } = editorPara(bloco);
    expect(ler()).toEqual(bloco);
  });

  it('junta segmentos vizinhos iguais e descarta vazios', () => {
    expect(
      inlineToSegs([
        { type: 'text', text: 'a' },
        { type: 'text', text: 'b' },
        { type: 'text', text: 'c', marks: [{ type: 'bold' }] },
        { type: 'text', text: '' },
      ]),
    ).toEqual([
      { k: 't', t: 'ab' },
      { k: 't', t: 'c', b: true },
    ]);
  });

  it('lacuna com id repetido em outro lugar ganha id novo', () => {
    const g = (t: string) => ({
      type: 'text',
      text: t,
      marks: [{ type: 'gap', attrs: { id: 'g1' } }],
    });
    const segs = inlineToSegs([g('um'), { type: 'text', text: ' e ' }, g('um')]);
    expect(segs[0]).toEqual({ k: 'g', id: 'g1', t: 'um' });
    expect(segs[2].k === 'g' && segs[2].id).not.toBe('g1');
  });

  it('divide o parágrafo no cursor, inclusive no meio de uma lacuna', () => {
    const [antes, depois] = splitInline(
      [
        { type: 'text', text: 'Ato é ' },
        { type: 'text', text: 'vinculado', marks: [{ type: 'gap', attrs: { id: 'g' } }] },
      ],
      9,
    );
    expect(antes.map((n) => n.text)).toEqual(['Ato é ', 'vin']);
    expect(depois.map((n) => n.text)).toEqual(['culado']);
  });
});

describe('Ocultar', () => {
  it('cria lacuna com id estável e apara espaços', () => {
    const { editor, ler, selecionar } = editorPara(blocos['b17'] as BlocoTexto);
    selecionar(' suprimento do vício ');
    const r = hideSelection(editor, 'g-novo');
    expect(r).toEqual({ status: 'ok', texto: 'suprimento do vício', id: 'g-novo' });
    const segs = (ler() as BlocoTexto).segs;
    expect(segs.slice(0, 2)).toEqual([
      { k: 't', t: 'Convalidação é o ' },
      { k: 'g', id: 'g-novo', t: 'suprimento do vício' },
    ]);
    expect(segs[2].t.startsWith(' de um ato ilegal')).toBe(true);
  });

  it('o id da lacuna sobrevive a edições do texto ao redor', () => {
    const { editor, ler } = editorPara(blocos['b2'] as BlocoTexto);
    editor.commands.setTextSelection(1);
    editor.commands.insertContent('Em resumo: ');
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    editor.commands.insertContent(' Fim.');
    const segs = (ler() as BlocoTexto).segs;
    expect(segs.filter((s) => s.k === 'g')).toEqual([
      { k: 'g', id: 'g1', t: 'manifestação unilateral de vontade' },
      { k: 'g', id: 'g2', t: 'efeitos jurídicos imediatos' },
    ]);
    expect(segs[0]).toEqual({ k: 't', t: 'Em resumo: Ato administrativo é a ' });
  });

  it('digitar logo depois da lacuna não entra nela', () => {
    const { editor, ler, selecionar } = editorPara(blocos['b10'] as BlocoTexto);
    selecionar('ilegal', 6, 6);
    editor.commands.insertContent('!');
    const segs = (ler() as BlocoTexto).segs;
    expect(segs[1]).toEqual({ k: 'g', id: 'g14', t: 'ilegal' });
    expect(segs[2].t.startsWith('! e pode')).toBe(true);
  });

  it('funciona dentro de célula de tabela', () => {
    const { editor, ler, selecionar } = editorPara(blocos['b6'] as BlocoTabela);
    selecionar('Impõe obrigações');
    expect(hideSelection(editor, 'g-tab').status).toBe('ok');
    const cell = (ler() as BlocoTabela).rows[2][1];
    expect(cell[0]).toEqual({ k: 'g', id: 'g-tab', t: 'Impõe obrigações' });
  });

  it('funciona em item de lista e remove o negrito da seleção', () => {
    const { editor, ler, selecionar } = editorPara(blocos['b3'] as BlocoLista);
    selecionar('Forma');
    expect(hideSelection(editor, 'g-lista').status).toBe('ok');
    expect((ler() as BlocoLista).items[2][0]).toEqual({ k: 'g', id: 'g-lista', t: 'Forma' });
  });

  it('recusa seleção vazia ou só de espaços', () => {
    const { editor, selecionar } = editorPara(blocos['b2'] as BlocoTexto);
    selecionar('Ato', 0, 0);
    expect(hideSelection(editor).status).toBe('vazia');
    selecionar(' da Administração', 0, 1);
    expect(hideSelection(editor).status).toBe('vazia');
  });

  it('seleção por cima de uma lacuna aumenta a lacuna e mantém o id', () => {
    const { editor, ler, selecionar } = editorPara(blocos['b2'] as BlocoTexto);
    selecionar('é a manifestação unilateral de vontade', 2);
    const r = hideSelection(editor);
    expect(r).toEqual({
      status: 'ajustada',
      texto: 'a manifestação unilateral de vontade',
      id: 'g1',
    });
    expect((ler() as BlocoTexto).segs.slice(0, 3)).toEqual([
      { k: 't', t: 'Ato administrativo é ' },
      { k: 'g', id: 'g1', t: 'a manifestação unilateral de vontade' },
      { k: 't', t: ' da Administração que, agindo nessa qualidade, produz ' },
    ]);
  });

  it('seleção menor dentro de uma lacuna encolhe a lacuna e o resto volta a ser texto', () => {
    const { editor, ler, selecionar } = editorPara(blocos['b2'] as BlocoTexto);
    selecionar('manifestação unilateral');
    expect(hideSelection(editor)).toMatchObject({ status: 'ajustada', id: 'g1' });
    expect((ler() as BlocoTexto).segs.slice(1, 3)).toEqual([
      { k: 'g', id: 'g1', t: 'manifestação unilateral' },
      { k: 't', t: ' de vontade da Administração que, agindo nessa qualidade, produz ' },
    ]);
  });

  it('recusa seleção que atravessa duas lacunas', () => {
    const { editor, selecionar } = editorPara(blocos['b2'] as BlocoTexto);
    selecionar('vontade da Administração que, agindo nessa qualidade, produz efeitos');
    expect(hideSelection(editor).status).toBe('atravessa');
  });

  it('recusa seleção entre duas células', () => {
    const { editor } = editorPara(blocos['b6'] as BlocoTabela);
    const doc = editor.state.doc;
    let primeira = -1;
    let ultima = -1;
    doc.descendants((n, pos) => {
      if (n.isText) {
        if (primeira < 0) primeira = pos;
        ultima = pos + n.nodeSize;
      }
    });
    editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(doc, primeira, ultima)));
    expect(hideSelection(editor).status).toBe('atravessa');
  });

  it('negrito não se aplica sobre lacuna', () => {
    const { editor, ler, selecionar } = editorPara(blocos['b2'] as BlocoTexto);
    selecionar('é a manifestação unilateral');
    editor.commands.setBold();
    const segs = (ler() as BlocoTexto).segs;
    expect(segs.find((s) => s.k === 'g')).toEqual({
      k: 'g',
      id: 'g1',
      t: 'manifestação unilateral de vontade',
    });
    expect(segs.some((s) => s.k === 't' && s.b && s.t === 'é a ')).toBe(true);
  });
});
