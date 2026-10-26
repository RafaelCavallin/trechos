import { BlocoRevisao, CONFIG_PADRAO } from '../domain/types';
import { sessaoNoTrecho } from './fila-preview';
import { ResultadoTrecho, registrarResultado, revelar } from './session';
import {
  instrucaoDoCartao,
  mostraBlocos,
  partesDoTrecho,
  textoDasFaixas,
  textoProximaRevisao,
} from './textos-cartao';

const inicial = sessaoNoTrecho([], 0);
const hoje = new Date(2026, 9, 23, 10, 0);
const resultado: ResultadoTrecho = {
  key: 'k',
  titulo: 't',
  materiaId: 'm',
  total: 1,
  acertos: 1,
  pct: 100,
  nota: 'Easy',
  due: hoje,
  erradas: [],
};
const h2: BlocoRevisao = { id: 'h', type: 'h2', segs: [{ k: 't', t: 'Título' }] };
const p: BlocoRevisao = { id: 'p', type: 'p', segs: [{ k: 't', t: 'Texto' }] };

describe('instrucaoDoCartao', () => {
  it('antes de revelar, explica o formato', () => {
    expect(instrucaoDoCartao(inicial, 'perguntas')).toBe(
      'Responda mentalmente cada pergunta da margem, sem ver o texto.',
    );
  });

  it('depois de revelar, pede para marcar os itens', () => {
    expect(instrucaoDoCartao(revelar(inicial), 'lacunas')).toBe(
      'Marque cada item como acertou ou errou — clique na lacuna ou use a lista ao lado.',
    );
  });

  it('com a nota calculada, explica a nota', () => {
    const avaliada = registrarResultado(revelar(inicial), resultado);
    expect(instrucaoDoCartao(avaliada, 'lacunas')).toBe(
      'Nota calculada pela proporção de itens acertados.',
    );
  });
});

describe('textoDasFaixas', () => {
  it('lista as faixas da nota configuradas', () => {
    const f = CONFIG_PADRAO.faixas;
    expect(textoDasFaixas(f)).toBe(
      `${f.easy}% Fácil · ≥${f.good}% Lembrei · ≥${f.hard}% Lembrei com esforço · abaixo: Não lembrei`,
    );
  });
});

describe('textoProximaRevisao', () => {
  it('amanhã não mostra a contagem de dias', () => {
    expect(textoProximaRevisao(new Date(2026, 9, 24, 10), hoje)).toBe('Próxima revisão: amanhã');
  });

  it('mais longe, mostra a data e em quantos dias', () => {
    expect(textoProximaRevisao(new Date(2026, 9, 29, 10), hoje)).toBe(
      'Próxima revisão: 29 out (em 6 dias)',
    );
  });
});

describe('partesDoTrecho', () => {
  it('separa o título inicial do corpo', () => {
    expect(partesDoTrecho([h2, p])).toEqual({ titulo: h2, corpo: [p] });
  });

  it('sem título inicial, tudo é corpo', () => {
    expect(partesDoTrecho([p])).toEqual({ titulo: null, corpo: [p] });
  });
});

describe('mostraBlocos', () => {
  it('em "Só perguntas" nunca mostra os blocos', () => {
    expect(mostraBlocos(revelar(inicial), 'perguntas')).toBe(false);
  });

  it('em "Só o título" mostra os blocos só depois de revelar', () => {
    expect(mostraBlocos(inicial, 'titulo')).toBe(false);
    expect(mostraBlocos(revelar(inicial), 'titulo')).toBe(true);
  });

  it('nos formatos com lacunas mostra os blocos desde o começo', () => {
    expect(mostraBlocos(inicial, 'lacunas')).toBe(true);
  });
});
