import { Bloco } from '../domain/types';
import {
  addQuestion,
  editQuestion,
  insertAfter,
  moveBlock,
  newAttachment,
  newBlock,
  removeBlock,
  removeQuestion,
  replaceBlock,
} from './block-ops';

const p = (id: string): Bloco => ({ id, type: 'p', segs: [{ k: 't', t: id }] });
const blocos = [p('a'), p('b'), p('c')];
const ids = (l: readonly Bloco[]) => l.map((b) => b.id);

describe('operações de bloco', () => {
  it('insere após o selecionado ou no fim', () => {
    const novo = p('x');
    expect(ids(insertAfter(blocos, 'a', novo))).toEqual(['a', 'x', 'b', 'c']);
    expect(ids(insertAfter(blocos, null, novo))).toEqual(['a', 'b', 'c', 'x']);
    expect(ids(insertAfter(blocos, 'sumiu', novo))).toEqual(['a', 'b', 'c', 'x']);
  });

  it('sobe e desce; nos extremos não muda', () => {
    expect(ids(moveBlock(blocos, 'b', -1))).toEqual(['b', 'a', 'c']);
    expect(ids(moveBlock(blocos, 'b', 1))).toEqual(['a', 'c', 'b']);
    expect(moveBlock(blocos, 'a', -1)).toBe(blocos);
    expect(moveBlock(blocos, 'c', 1)).toBe(blocos);
  });

  it('remove e substitui', () => {
    expect(ids(removeBlock(blocos, 'b'))).toEqual(['a', 'c']);
    const novoB = { ...p('b'), segs: [{ k: 't' as const, t: 'novo' }] };
    expect(replaceBlock(blocos, novoB)[1]).toBe(novoB);
  });

  it('perguntas da margem: adiciona aparando espaços e remove', () => {
    const com = addQuestion(blocos, 'b', '  Qual o prazo? ', ' 120 dias ');
    const q = com[1].qs![0];
    expect(q).toMatchObject({ q: 'Qual o prazo?', a: '120 dias' });
    expect(q.id).toMatch(/^q-/);
    expect(removeQuestion(com, 'b', q.id)[1].qs).toEqual([]);
  });

  it('editar pergunta troca o texto, mantém o id e não mexe nas outras', () => {
    const com = addQuestion(
      addQuestion(blocos, 'b', 'Qual o prazo?', ''),
      'b',
      'Quem julga?',
      'STF',
    );
    const [primeira, segunda] = com[1].qs!;
    const editado = editQuestion(com, {
      blocoId: 'b',
      perguntaId: primeira.id,
      q: ' Qual o prazo decadencial? ',
      a: ' 5 anos ',
    });
    expect(editado[1].qs).toEqual([
      { id: primeira.id, q: 'Qual o prazo decadencial?', a: '5 anos' },
      segunda,
    ]);
  });

  it('editar pergunta de outro bloco não altera nada', () => {
    const com = addQuestion(blocos, 'b', 'Qual o prazo?', '');
    const perguntaId = com[1].qs![0].id;
    expect(editQuestion(com, { blocoId: 'a', perguntaId, q: 'Outra', a: '' })).toEqual(com);
  });

  it('blocos novos têm texto inicial e ids únicos', () => {
    const tipos = [
      'h2',
      'h3',
      'p',
      'list',
      'table',
      'quote',
      'pegadinha',
      'excecao',
      'exemplo',
      'analogia',
    ] as const;
    const novos = tipos.map(newBlock);
    expect(new Set(novos.map((b) => b.id)).size).toBe(tipos.length);
    expect(novos[0]).toMatchObject({ type: 'h2', segs: [{ k: 't', t: 'Novo trecho' }] });
    expect(novos[4]).toMatchObject({ type: 'table' });
    expect(novos[6]).toMatchObject({ type: 'special', kind: 'pegadinha' });
    expect(newAttachment('file', 'lei.pdf', 'u/r/lei.pdf')).toMatchObject({
      type: 'attach',
      kind: 'file',
    });
  });
});
