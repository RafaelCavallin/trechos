import { ItemVerificavel, ResultadoNota, gradeFromMarks } from '../domain/review';
import { EstadoTrecho, FaixasNota, ID, Modo } from '../domain/types';
import { Agendador } from '../scheduler/fsrs';
import { ResultadoTrecho, Sessao } from './session';
import { TrechoEmRevisao } from './trecho-em-revisao';

export interface DadosDaAvaliacao {
  sessao: Sessao;
  atual: TrechoEmRevisao;
  faixas: FaixasNota;
  anterior: EstadoTrecho | undefined;
  agendador: Agendador;
  agora: Date;
}

export interface Avaliacao {
  modo: Modo;
  marcas: Record<ID, boolean>;
  nota: ResultadoNota;
  estado: EstadoTrecho;
  resultado: ResultadoTrecho;
}

export function avaliarTrecho(dados: DadosDaAvaliacao): Avaliacao {
  const { sessao, atual, faixas, agendador, agora } = dados;
  const marcas = Object.fromEntries(atual.itens.map((i) => [i.id, sessao.marcas[i.id] === true]));
  const nota = gradeFromMarks(marcas, atual.itens, faixas);
  const anterior = dados.anterior ?? Agendador.novo(atual.entrada.key, agora);
  const estado = agendador.revisar(anterior, nota.nota, agora);
  const resultado: ResultadoTrecho = {
    key: atual.entrada.key,
    titulo: atual.trecho?.titulo ?? '',
    materiaId: atual.entrada.materiaId,
    ...nota,
    due: estado.due,
    erradas: textosErrados(atual.itens, marcas),
  };
  return { modo: atual.modo, marcas, nota, estado, resultado };
}

function textosErrados(
  itens: readonly ItemVerificavel[],
  marcas: Readonly<Record<ID, boolean>>,
): string[] {
  return itens
    .filter((i) => !marcas[i.id])
    .map((i) => (i.tipo === 'pergunta' ? i.pergunta : i.texto));
}
