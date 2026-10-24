import { stageOf } from '../../domain/review';
import { AvisoTrecho, isOverLimit, splitTrechos, trechoWarnings } from '../../domain/trechos';
import { Bloco, Configuracoes, EstadoTrecho, Trecho } from '../../domain/types';
import { dayLabel } from '../../scheduler/dates';

/** Cabeçalho mostrado antes do primeiro bloco de cada trecho (R5.3, R6). */
export interface CabecalhoTrecho {
  trecho: Trecho;
  meta: string;
  podeJuntar: boolean;
  avisos: AvisoTrecho[];
}

export interface LinhaDoEditor {
  bloco: Bloco;
  cabecalho: CabecalhoTrecho | null;
  /** H2 juntado ao trecho anterior: mostra o selo e "Separar". */
  juntado: boolean;
}

export interface ItemListaTrechos {
  id: string;
  rotulo: string;
  meta: string;
  alerta: boolean;
}

export interface VisaoDoEditor {
  trechos: Trecho[];
  linhas: LinhaDoEditor[];
  lista: ItemListaTrechos[];
  totais: { trechos: string; itens: string; avisos: string | null };
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** "Nova · 1ª revisão hoje" ou "Inicial · próxima 29 out" (design §6). */
export function stageText(estado: EstadoTrecho | undefined, agora: Date): string {
  if (!estado || estado.S <= 0) return 'Nova · 1ª revisão hoje';
  return `${stageOf(estado.S)} · próxima ${dayLabel(estado.due, agora)}`;
}

/** Tudo o que o editor mostra além dos blocos, calculado dos blocos e estados. */
export function buildEditorView(
  blocos: readonly Bloco[],
  estadoDe: (trechoId: string) => EstadoTrecho | undefined,
  config: Configuracoes,
  agora: Date,
): VisaoDoEditor {
  const trechos = splitTrechos(blocos);
  const inicio = new Map(trechos.map((t) => [t.id, t]));
  let totalAvisos = 0;

  const lista = trechos.map((t) => {
    const semItens = t.itens === 0;
    const acima = isOverLimit(t, config).acima;
    const estado = estadoDe(t.id);
    return {
      id: t.id,
      rotulo: `${t.num}. ${t.titulo}`,
      meta: semItens
        ? 'Sem itens'
        : acima
          ? `${plural(t.itens, 'item', 'itens')} · acima do limite`
          : `${plural(t.itens, 'item', 'itens')} · ${stageOf(estado?.S ?? 0)}`,
      alerta: semItens || acima,
    };
  });

  const linhas = blocos.map((bloco): LinhaDoEditor => {
    const trecho = inicio.get(bloco.id);
    let cabecalho: CabecalhoTrecho | null = null;
    if (trecho) {
      const avisos = trechoWarnings(trecho, config);
      totalAvisos += avisos.length;
      cabecalho = {
        trecho,
        meta: `${plural(trecho.itens, 'item', 'itens')} · ${trecho.palavras} palavras · ${stageText(estadoDe(trecho.id), agora)}`,
        podeJuntar: trecho.num > 1 && bloco.type === 'h2',
        avisos,
      };
    }
    return { bloco, cabecalho, juntado: bloco.type === 'h2' && !!bloco.merge };
  });

  const itens = trechos.reduce((s, t) => s + t.itens, 0);
  return {
    trechos,
    linhas,
    lista,
    totais: {
      trechos: plural(trechos.length, 'trecho', 'trechos'),
      itens: `${itens} ${itens === 1 ? 'item verificável' : 'itens verificáveis'}`,
      avisos: totalAvisos ? plural(totalAvisos, 'aviso', 'avisos') : null,
    },
  };
}
