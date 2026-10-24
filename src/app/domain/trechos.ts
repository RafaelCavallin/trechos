import { blockGaps, blockWords, segmentsText } from './text';
import { Bloco, BlocoH3, Configuracoes, ID, Trecho } from './types';

/**
 * Divide o resumo em trechos (R5.1–R5.2, design §3.1).
 * Começa trecho: o primeiro bloco, cada H2 não juntado e cada H3 dividido.
 */
export function splitTrechos(blocos: readonly Bloco[]): Trecho[] {
  const trechos: Trecho[] = [];
  blocos.forEach((bloco, i) => {
    if (i === 0 || startsTrecho(bloco)) {
      trechos.push({
        id: bloco.id,
        num: trechos.length + 1,
        titulo:
          bloco.type === 'h2' || bloco.type === 'h3' ? segmentsText(bloco.segs) : 'Sem título',
        blocos: [],
        palavras: 0,
        lacunas: 0,
        perguntas: 0,
        itens: 0,
        subtitulos: [],
      });
    }
    const atual = trechos[trechos.length - 1];
    if (atual.blocos.length > 0 && bloco.type === 'h3') atual.subtitulos.push(bloco);
    atual.blocos.push(bloco);
    atual.palavras += blockWords(bloco);
    atual.lacunas += blockGaps(bloco);
    atual.perguntas += bloco.qs?.length ?? 0;
    atual.itens = atual.lacunas + atual.perguntas;
  });
  return trechos;
}

function startsTrecho(bloco: Bloco): boolean {
  return (bloco.type === 'h2' && !bloco.merge) || (bloco.type === 'h3' && !!bloco.split);
}

/** Chave do estado FSRS de um trecho. */
export function trechoKey(resumoId: ID, trechoId: ID): string {
  return `${resumoId}:${trechoId}`;
}

/** Em qual trecho está um bloco. */
export function trechoOfBlock(trechos: readonly Trecho[], blocoId: ID): Trecho | undefined {
  return trechos.find((t) => t.blocos.some((b) => b.id === blocoId));
}

/**
 * "Juntar ao anterior" (R5.4): só vale para um H2 que não seja o primeiro bloco.
 * Devolve o mesmo array se não houver o que mudar.
 */
export function mergeWithPrevious(blocos: readonly Bloco[], h2Id: ID): readonly Bloco[] {
  const i = blocos.findIndex((b) => b.id === h2Id);
  const bloco = blocos[i];
  if (i <= 0 || bloco.type !== 'h2' || bloco.merge) return blocos;
  return replaceAt(blocos, i, { ...bloco, merge: true });
}

/** "Separar": desfaz o "Juntar ao anterior". */
export function unmerge(blocos: readonly Bloco[], h2Id: ID): readonly Bloco[] {
  const i = blocos.findIndex((b) => b.id === h2Id);
  const bloco = blocos[i];
  if (i < 0 || bloco.type !== 'h2' || !bloco.merge) return blocos;
  return replaceAt(blocos, i, { ...bloco, merge: false });
}

export interface DivisaoPorSubtitulos {
  blocos: readonly Bloco[];
  /** Ids dos novos trechos; cada um herda o estado FSRS do trecho original (R5.5). */
  novosTrechos: ID[];
}

/** "Dividir pelos subtítulos" (R5.5): cada H3 do trecho passa a iniciar um trecho. */
export function splitBySubtitles(blocos: readonly Bloco[], trecho: Trecho): DivisaoPorSubtitulos {
  const ids = new Set(trecho.subtitulos.map((b) => b.id));
  return {
    blocos: blocos.map((b) =>
      b.type === 'h3' && ids.has(b.id) ? ({ ...b, split: true } as BlocoH3) : b,
    ),
    novosTrechos: [...ids],
  };
}

function replaceAt(blocos: readonly Bloco[], i: number, bloco: Bloco): Bloco[] {
  const copia = [...blocos];
  copia[i] = bloco;
  return copia;
}

// ── Avisos do editor (R6) ──────────────────────────────────────────────────

export interface VerificacaoLimite {
  acima: boolean;
  atual: number;
  limite: number;
  unidade: 'palavras' | 'lacunas';
}

/** Trecho acima do limite de tamanho, por palavras ou por lacunas (R6.1). */
export function isOverLimit(
  trecho: Trecho,
  config: Pick<Configuracoes, 'limiteTipo' | 'limitePalavras' | 'limiteLacunas'>,
): VerificacaoLimite {
  const porPalavras = config.limiteTipo === 'palavras';
  const atual = porPalavras ? trecho.palavras : trecho.lacunas;
  const limite = porPalavras ? config.limitePalavras : config.limiteLacunas;
  return { acima: atual > limite, atual, limite, unidade: config.limiteTipo };
}

/** Trecho sem itens verificáveis não entra na revisão (R6.2). */
export function hasNoItems(trecho: Trecho): boolean {
  return trecho.itens === 0;
}

export type AvisoTrecho =
  | { tipo: 'limite'; mensagem: string; podeDividir: boolean }
  | { tipo: 'semItens'; mensagem: string };

export function trechoWarnings(trecho: Trecho, config: Configuracoes): AvisoTrecho[] {
  const avisos: AvisoTrecho[] = [];
  const limite = isOverLimit(trecho, config);
  if (limite.acima) {
    avisos.push({
      tipo: 'limite',
      mensagem: `Trecho acima do limite: ${limite.atual} de ${limite.limite} ${limite.unidade}.`,
      podeDividir: trecho.subtitulos.length > 0,
    });
  }
  if (hasNoItems(trecho)) {
    avisos.push({
      tipo: 'semItens',
      mensagem:
        'Sem itens verificáveis: oculte ao menos uma lacuna ou adicione uma pergunta na margem para este trecho entrar na revisão.',
    });
  }
  return avisos;
}
