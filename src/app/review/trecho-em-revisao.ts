import { TrechoParaRevisao, prepareReview, withFallback } from '../domain/review';
import { splitTrechos } from '../domain/trechos';
import { Assunto, Densidade, Materia, Resumo, Trecho } from '../domain/types';
import { EntradaFila } from './session';

export interface TrechoEmRevisao extends TrechoParaRevisao {
  entrada: EntradaFila;
  trecho: Trecho | null;
  materia: string;
  assunto: string;
}

export interface DadosDoTrecho {
  entrada: EntradaFila;
  resumos: readonly Resumo[];
  assuntos: readonly Assunto[];
  materias: readonly Materia[];
  densidade: Densidade;
}

export function trechoEmRevisao(dados: DadosDoTrecho): TrechoEmRevisao {
  const { entrada, resumos, assuntos, materias, densidade } = dados;
  const resumo = resumos.find((r) => r.id === entrada.resumoId);
  const trecho = resumo && splitTrechos(resumo.blocos).find((t) => t.id === entrada.trechoId);
  const contexto = {
    entrada,
    materia: materias.find((m) => m.id === entrada.materiaId)?.nome ?? '',
    assunto: assuntos.find((a) => a.id === entrada.assuntoId)?.nome ?? '',
  };
  if (!trecho) return { ...contexto, trecho: null, modo: entrada.modo, blocos: [], itens: [] };
  const modo = withFallback(entrada.modo, trecho);
  return { ...contexto, trecho, ...prepareReview(trecho, modo, densidade) };
}
