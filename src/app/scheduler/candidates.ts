import { splitTrechos, trechoKey } from '../domain/trechos';
import { Assunto, EstadoTrecho, ID, Resumo, Trecho } from '../domain/types';
import { Agendador } from './fsrs';
import { CandidatoFila } from './queue';

/** Trecho candidato à revisão, com o contexto que as telas precisam. */
export interface TrechoAgendado extends CandidatoFila {
  resumoId: ID;
  assuntoId: ID;
  trecho: Trecho;
  estado: EstadoTrecho;
}

/**
 * Junta resumos, assuntos e estados FSRS numa lista de trechos agendados.
 * Trecho sem estado salvo é novo: vence hoje (R8.3).
 */
export function scheduledTrechos(
  resumos: readonly Resumo[],
  assuntos: readonly Assunto[],
  estados: readonly EstadoTrecho[],
  agendador: Agendador,
  agora: Date,
): TrechoAgendado[] {
  const materiaDe = new Map(assuntos.map((a) => [a.id, a.materiaId]));
  const estadoDe = new Map(estados.map((e) => [e.key, e]));
  return resumos.flatMap((resumo) => {
    const materiaId = materiaDe.get(resumo.assuntoId);
    if (!materiaId) return [];
    return splitTrechos(resumo.blocos).map((trecho) => {
      const key = trechoKey(resumo.id, trecho.id);
      const estado = estadoDe.get(key) ?? Agendador.novo(key, agora);
      return {
        key,
        materiaId,
        assuntoId: resumo.assuntoId,
        resumoId: resumo.id,
        trecho,
        estado,
        itens: trecho.itens,
        due: estado.due,
        lastReview: estado.lastReview,
        r: agendador.retrievability(estado, agora),
      };
    });
  });
}
