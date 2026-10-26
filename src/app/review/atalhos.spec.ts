import { acaoDoAtalho } from './atalhos';
import { sessaoNoTrecho } from './fila-preview';
import { ResultadoTrecho, Sessao, registrarResultado, revelar } from './session';

const inicial = sessaoNoTrecho([], 0);
const revelada = revelar(inicial);
const resultado: ResultadoTrecho = {
  key: 'k',
  titulo: 't',
  materiaId: 'm',
  total: 1,
  acertos: 1,
  pct: 100,
  nota: 'Easy',
  due: new Date(2026, 9, 24),
  erradas: [],
};
const avaliada = registrarResultado(revelada, resultado);

const acao = (key: string, sessao: Sessao, extra: { emBotao?: boolean; todos?: boolean } = {}) =>
  acaoDoAtalho({ key, emBotao: !!extra.emBotao }, { sessao, todosMarcados: !!extra.todos });

describe('acaoDoAtalho', () => {
  it('Espaço revela, mas não sobre um botão nem depois de revelado', () => {
    expect(acao(' ', inicial)).toBe('revelar');
    expect(acao(' ', inicial, { emBotao: true })).toBeNull();
    expect(acao(' ', revelada)).toBeNull();
  });

  it('1 e ← marcam acerto; 2 e → marcam erro; ↑ e ↓ mudam o item', () => {
    expect(
      ['1', 'ArrowLeft', '2', 'ArrowRight', 'ArrowUp', 'ArrowDown'].map((k) => acao(k, revelada)),
    ).toEqual(['acertou', 'acertou', 'errou', 'errou', 'subir', 'descer']);
  });

  it('as teclas de marcação não fazem nada antes de revelar nem depois da nota', () => {
    expect(acao('1', inicial)).toBeNull();
    expect(acao('2', avaliada)).toBeNull();
  });

  it('Enter calcula a nota só com tudo marcado e avança depois da nota', () => {
    expect(acao('Enter', revelada)).toBeNull();
    expect(acao('Enter', revelada, { todos: true })).toBe('calcular');
    expect(acao('Enter', avaliada)).toBe('proximo');
  });

  it('ignora teclas sem atalho e a sessão concluída', () => {
    expect(acao('x', revelada)).toBeNull();
    expect(acao(' ', { ...inicial, concluida: true })).toBeNull();
  });
});
