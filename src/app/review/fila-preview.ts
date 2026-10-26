import { modeForStage } from '../domain/review';
import { splitTrechos, trechoKey } from '../domain/trechos';
import { EstadoTrecho, ID, Modo, Resumo } from '../domain/types';
import { EntradaFila, Sessao } from './session';

export type FormatoPreview = 'auto' | Modo;

export interface DadosDaFilaPreview {
  resumo: Resumo;
  materiaId: ID;
  estados: readonly EstadoTrecho[];
  formato: FormatoPreview;
}

export function filaDoPreview({
  resumo,
  materiaId,
  estados,
  formato,
}: DadosDaFilaPreview): EntradaFila[] {
  const estabilidade = new Map(estados.map((e) => [e.key, e.S]));
  return splitTrechos(resumo.blocos).map((trecho) => {
    const key = trechoKey(resumo.id, trecho.id);
    const modo = formato === 'auto' ? modeForStage(estabilidade.get(key) ?? 0, trecho) : formato;
    return {
      key,
      resumoId: resumo.id,
      trechoId: trecho.id,
      materiaId,
      assuntoId: resumo.assuntoId,
      modo,
    };
  });
}

export function indiceDoTrecho(fila: readonly EntradaFila[], trechoId?: ID | null): number {
  return Math.max(
    0,
    fila.findIndex((e) => e.trechoId === trechoId),
  );
}

export function sessaoNoTrecho(fila: EntradaFila[], indice: number): Sessao {
  return {
    fila,
    indice,
    revelado: false,
    marcas: {},
    recall: '',
    resultado: null,
    resultados: [],
    concluida: false,
  };
}
