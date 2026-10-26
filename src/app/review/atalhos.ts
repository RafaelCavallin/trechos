import { Sessao, podeMarcar } from './session';

export type AcaoAtalho =
  'revelar' | 'acertou' | 'errou' | 'subir' | 'descer' | 'proximo' | 'calcular';

export interface Tecla {
  key: string;
  emBotao: boolean;
}

export interface ContextoAtalho {
  sessao: Sessao;
  todosMarcados: boolean;
}

const TECLAS_DE_MARCACAO: Partial<Record<string, AcaoAtalho>> = {
  '1': 'acertou',
  ArrowLeft: 'acertou',
  '2': 'errou',
  ArrowRight: 'errou',
  ArrowDown: 'descer',
  ArrowUp: 'subir',
};

export function acaoDoAtalho(
  tecla: Tecla,
  { sessao, todosMarcados }: ContextoAtalho,
): AcaoAtalho | null {
  if (sessao.concluida) return null;
  if (tecla.key === ' ') return tecla.emBotao || sessao.revelado ? null : 'revelar';
  if (tecla.key === 'Enter') return acaoDoEnter(sessao, todosMarcados);
  const acao = TECLAS_DE_MARCACAO[tecla.key];
  return acao && podeMarcar(sessao) ? acao : null;
}

function acaoDoEnter(sessao: Sessao, todosMarcados: boolean): AcaoAtalho | null {
  if (sessao.resultado) return 'proximo';
  return todosMarcados ? 'calcular' : null;
}
