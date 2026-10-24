import {
  allMarked,
  collectItems,
  gradeFromMarks,
  isDynamicItem,
  modeForStage,
  prepareReview,
  stageOf,
  withFallback,
} from './review';
import { ATOS_ADMINISTRATIVOS, REMEDIOS_CONSTITUCIONAIS } from './examples';
import { splitTrechos } from './trechos';
import { CONFIG_PADRAO } from './types';

const [conceito, , extincao, convalidacao] = splitTrechos(ATOS_ADMINISTRATIVOS);
const [remedios] = splitTrechos(REMEDIOS_CONSTITUCIONAIS);

describe('stageOf', () => {
  it('classifica pela estabilidade', () => {
    expect(stageOf(0)).toBe('Nova');
    expect(stageOf(3.9)).toBe('Inicial');
    expect(stageOf(4)).toBe('Intermediário');
    expect(stageOf(15.9)).toBe('Intermediário');
    expect(stageOf(16)).toBe('Estável');
  });
});

describe('modeForStage', () => {
  it('S < 4: com lacunas', () => {
    expect(modeForStage(0, conceito)).toBe('lacunas');
    expect(modeForStage(3.9, conceito)).toBe('lacunas');
  });

  it('4 ≤ S < 16: só perguntas, se houver; senão só o título', () => {
    expect(modeForStage(4, conceito)).toBe('perguntas');
    expect(modeForStage(10, extincao)).toBe('titulo');
  });

  it('S ≥ 16: lacunas densas', () => {
    expect(modeForStage(16, conceito)).toBe('densas');
  });

  it('formato com lacunas num trecho sem lacunas vira só perguntas', () => {
    const soPerguntas = { lacunas: 0, perguntas: 2 };
    expect(modeForStage(1, soPerguntas)).toBe('perguntas');
    expect(modeForStage(20, soPerguntas)).toBe('perguntas');
  });

  it('withFallback: perguntas sem perguntas vira título; título sem lacunas vira perguntas', () => {
    expect(withFallback('perguntas', { lacunas: 3, perguntas: 0 })).toBe('titulo');
    expect(withFallback('titulo', { lacunas: 0, perguntas: 1 })).toBe('perguntas');
    expect(withFallback('lacunas', { lacunas: 1, perguntas: 0 })).toBe('lacunas');
  });
});

describe('collectItems', () => {
  it('só perguntas: as perguntas da margem, numeradas', () => {
    expect(collectItems(remedios, 'perguntas')).toEqual([
      {
        tipo: 'pergunta',
        id: 'cq1',
        num: 1,
        pergunta: 'Qual remédio protege a liberdade de locomoção?',
        resposta: 'Habeas corpus',
      },
      expect.objectContaining({ id: 'cq2', num: 2 }),
      expect.objectContaining({ id: 'cq3', num: 3 }),
    ]);
  });

  it('só o título: apenas as lacunas manuais, na ordem do texto', () => {
    const itens = collectItems(conceito, 'titulo');
    expect(itens.map((i) => i.id)).toEqual(['g1', 'g2', 'g3', 'g4', 'g5', 'g6']);
    expect(itens[0]).toEqual({
      tipo: 'lacuna',
      id: 'g1',
      num: 1,
      texto: 'manifestação unilateral de vontade',
    });
  });

  it('lacunas da tabela entram linha por linha', () => {
    const atributos = splitTrechos(ATOS_ADMINISTRATIVOS)[1];
    expect(collectItems(atributos, 'titulo').map((i) => i.id)).toEqual([
      'g7',
      'g8',
      'g9',
      'g10',
      'g11',
      'g12',
      'g13',
    ]);
  });

  it('com lacunas: manuais e dinâmicas intercaladas na ordem do texto, numeradas 1..n', () => {
    const { modo, itens } = prepareReview(extincao, 'lacunas', 'média');
    expect(modo).toBe('lacunas');
    const manuais = itens.filter((i) => i.tipo === 'lacuna').map((i) => i.id);
    expect(manuais).toEqual(['g14', 'g15', 'g16', 'g17', 'g18', 'g19']);
    expect(itens.some((i) => i.tipo === 'dinamica')).toBe(true);
    expect(itens.map((i) => i.num)).toEqual(itens.map((_, i) => i + 1));
    expect(itens.filter((i) => i.tipo === 'dinamica').every((i) => isDynamicItem(i.id))).toBe(true);
  });

  it('trecho sem itens não tem o que revisar', () => {
    expect(collectItems(convalidacao, 'titulo')).toEqual([]);
  });
});

describe('gradeFromMarks', () => {
  const itens = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }];
  const marcas = (acertos: number) =>
    Object.fromEntries(itens.map((it, i) => [it.id, i < acertos]));

  it.each([
    [5, 100, 'Easy'],
    [4, 80, 'Hard'],
    [3, 60, 'Hard'],
    [2, 40, 'Again'],
    [0, 0, 'Again'],
  ])('%i de 5 acertos → %i%% → %s', (acertos, pct, nota) => {
    expect(gradeFromMarks(marcas(acertos), itens, CONFIG_PADRAO.faixas)).toEqual({
      total: 5,
      acertos,
      pct,
      nota,
    });
  });

  it('90% é Lembrei (Good)', () => {
    const dez = Array.from({ length: 10 }, (_, i) => ({ id: String(i) }));
    const m = Object.fromEntries(dez.map((it, i) => [it.id, i < 9]));
    expect(gradeFromMarks(m, dez, CONFIG_PADRAO.faixas).nota).toBe('Good');
  });

  it('respeita faixas configuradas', () => {
    expect(gradeFromMarks(marcas(4), itens, { easy: 100, good: 80, hard: 50 }).nota).toBe('Good');
  });

  it('item sem marca conta como erro; sem itens dá 0%', () => {
    expect(gradeFromMarks({ a: true }, itens, CONFIG_PADRAO.faixas).acertos).toBe(1);
    expect(gradeFromMarks({}, [], CONFIG_PADRAO.faixas)).toEqual({
      total: 0,
      acertos: 0,
      pct: 0,
      nota: 'Again',
    });
  });

  it('allMarked exige marca em todos os itens', () => {
    expect(allMarked({ a: true, b: false }, [{ id: 'a' }, { id: 'b' }])).toBe(true);
    expect(allMarked({ a: true }, [{ id: 'a' }, { id: 'b' }])).toBe(false);
  });
});
