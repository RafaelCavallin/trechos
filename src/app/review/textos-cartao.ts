import { BlocoRevisao, FaixasNota, Modo } from '../domain/types';
import { dayLabel, daysBetween } from '../scheduler/dates';
import { Sessao } from './session';

const INSTRUCAO: Record<Modo, string> = {
  lacunas:
    'Tente lembrar o que falta em cada lacuna — as numeradas em verde são dinâmicas. Depois, revele.',
  perguntas: 'Responda mentalmente cada pergunta da margem, sem ver o texto.',
  titulo: 'Lembre livremente tudo o que puder sobre este trecho. Depois, compare com o gabarito.',
  densas: 'Trecho estável: muito mais texto oculto. Reconstrua de memória.',
};

const INSTRUCAO_RESULTADO = 'Nota calculada pela proporção de itens acertados.';
const INSTRUCAO_MARCAR =
  'Marque cada item como acertou ou errou — clique na lacuna ou use a lista ao lado.';

export function instrucaoDoCartao(sessao: Sessao, modo: Modo): string {
  if (sessao.resultado) return INSTRUCAO_RESULTADO;
  if (sessao.revelado) return INSTRUCAO_MARCAR;
  return INSTRUCAO[modo];
}

export function textoDasFaixas(f: FaixasNota): string {
  return `${f.easy}% Fácil · ≥${f.good}% Lembrei · ≥${f.hard}% Lembrei com esforço · abaixo: Não lembrei`;
}

export function textoProximaRevisao(due: Date, agora: Date): string {
  const dias = daysBetween(agora, due);
  return `Próxima revisão: ${dayLabel(due, agora)}${dias > 1 ? ` (em ${dias} dias)` : ''}`;
}

export interface PartesDoTrecho {
  titulo: BlocoRevisao | null;
  corpo: BlocoRevisao[];
}

export function partesDoTrecho(blocos: BlocoRevisao[]): PartesDoTrecho {
  const primeiro = blocos[0];
  if (primeiro?.type !== 'h2' && primeiro?.type !== 'h3') return { titulo: null, corpo: blocos };
  return { titulo: primeiro, corpo: blocos.slice(1) };
}

export function mostraBlocos(sessao: Sessao, modo: Modo): boolean {
  if (modo === 'perguntas') return false;
  return modo !== 'titulo' || sessao.revelado;
}
