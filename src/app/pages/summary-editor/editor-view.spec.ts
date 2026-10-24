import { ATOS_ADMINISTRATIVOS } from '../../domain/examples';
import { CONFIG_PADRAO, EstadoTrecho } from '../../domain/types';
import { buildEditorView, stageText } from './editor-view';

const agora = new Date(2026, 9, 23, 10);
const estado = (S: number, due = agora): EstadoTrecho => ({
  key: 'k',
  S,
  D: 5,
  due,
  reps: 1,
  lapses: 0,
});

describe('buildEditorView', () => {
  const estados: Record<string, EstadoTrecho> = {
    b1: estado(1.6),
    b5: estado(3.1, new Date(2026, 9, 29)),
    b8: estado(22),
  };
  const visao = buildEditorView(
    ATOS_ADMINISTRATIVOS,
    (id) => estados[id],
    { ...CONFIG_PADRAO, limitePalavras: 100 },
    agora,
  );

  it('totais do cabeçalho', () => {
    expect(visao.totais).toEqual({
      trechos: '4 trechos',
      itens: '21 itens verificáveis',
      avisos: '2 avisos',
    });
  });

  it('lista lateral com estágio ou aviso', () => {
    expect(visao.lista.map((t) => [t.rotulo, t.meta, t.alerta])).toEqual([
      ['1. Conceito e requisitos', '7 itens · Inicial', false],
      ['2. Atributos', '8 itens · Inicial', false],
      ['3. Extinção do ato', '6 itens · acima do limite', true],
      ['4. Convalidação', 'Sem itens', true],
    ]);
  });

  it('cabeçalho só no primeiro bloco de cada trecho', () => {
    const comCabecalho = visao.linhas.filter((l) => l.cabecalho).map((l) => l.bloco.id);
    expect(comCabecalho).toEqual(['b1', 'b5', 'b8', 'b16']);
    const [c1, c2, c3, c4] = visao.linhas.filter((l) => l.cabecalho).map((l) => l.cabecalho!);
    expect(c1.meta).toBe(`7 itens · ${c1.trecho.palavras} palavras · Inicial · próxima hoje`);
    expect(c2.meta.endsWith('Inicial · próxima 29 out')).toBe(true);
    expect(c1.podeJuntar).toBe(false);
    expect(c2.podeJuntar).toBe(true);
    expect(c3.avisos.map((a) => a.tipo)).toEqual(['limite']);
    expect(c4.meta.endsWith('Nova · 1ª revisão hoje')).toBe(true);
    expect(c4.avisos.map((a) => a.tipo)).toEqual(['semItens']);
  });

  it('H2 juntado não tem cabeçalho e mostra o selo', () => {
    const blocos = ATOS_ADMINISTRATIVOS.map((b) => (b.id === 'b5' ? { ...b, merge: true } : b));
    const v = buildEditorView(blocos, () => undefined, CONFIG_PADRAO, agora);
    const b5 = v.linhas.find((l) => l.bloco.id === 'b5')!;
    expect(b5.cabecalho).toBeNull();
    expect(b5.juntado).toBe(true);
    expect(v.totais.trechos).toBe('3 trechos');
  });

  it('singulares', () => {
    const v = buildEditorView(
      [{ id: 'x', type: 'p', segs: [{ k: 'g', id: 'g', t: 'a' }] }],
      () => undefined,
      CONFIG_PADRAO,
      agora,
    );
    expect(v.totais).toEqual({ trechos: '1 trecho', itens: '1 item verificável', avisos: null });
    expect(v.lista[0].meta).toBe('1 item · Nova');
  });

  it('stageText', () => {
    expect(stageText(undefined, agora)).toBe('Nova · 1ª revisão hoje');
    expect(stageText(estado(20, new Date(2026, 9, 24)), agora)).toBe('Estável · próxima amanhã');
  });
});
