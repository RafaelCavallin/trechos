/**
 * Modelo de dados do Trechos (design §2).
 * Tudo em `domain/` é função pura, sem Angular e sem acesso a banco.
 */

export type ID = string;

export interface Materia {
  id: ID;
  nome: string;
  ordem: number;
}

export interface Assunto {
  id: ID;
  materiaId: ID;
  nome: string;
  ordem: number;
}

export interface Resumo {
  id: ID;
  assuntoId: ID;
  titulo: string;
  ordem: number;
  blocos: Bloco[];
}

/** Pedaço de texto rico dentro de um bloco. */
export type Segmento = SegmentoTexto | SegmentoLacuna;

/** Texto comum; `b` = negrito; `n` = significado mostrado num popup (ex.: de uma sigla). */
export interface SegmentoTexto {
  k: 't';
  t: string;
  b?: boolean;
  n?: string;
}

/** Lacuna manual, com id estável que sobrevive a edições do texto ao redor. */
export interface SegmentoLacuna {
  k: 'g';
  id: ID;
  t: string;
}

/** Lacuna dinâmica: só existe durante a revisão, gerada a partir do texto. */
export interface SegmentoDinamico {
  k: 'd';
  id: ID;
  t: string;
}

export interface Pergunta {
  id: ID;
  q: string;
  a: string;
}

export type TipoEspecial = 'pegadinha' | 'excecao' | 'exemplo' | 'analogia';

interface BlocoBase {
  id: ID;
  qs?: Pergunta[];
}

/** Título: inicia trecho, a menos que tenha sido juntado ao anterior (`merge`). */
export interface BlocoH2<S = Segmento> extends BlocoBase {
  type: 'h2';
  segs: S[];
  merge?: boolean;
}

/** Subtítulo: só inicia trecho depois de "Dividir pelos subtítulos" (`split`). */
export interface BlocoH3<S = Segmento> extends BlocoBase {
  type: 'h3';
  segs: S[];
  split?: boolean;
}

export interface BlocoTexto<S = Segmento> extends BlocoBase {
  type: 'p' | 'quote';
  segs: S[];
}

export interface BlocoEspecial<S = Segmento> extends BlocoBase {
  type: 'special';
  kind: TipoEspecial;
  segs: S[];
}

export interface BlocoLista<S = Segmento> extends BlocoBase {
  type: 'list';
  items: S[][];
}

/** `rows[linha][célula]`; a linha 0 é o cabeçalho. */
export interface BlocoTabela<S = Segmento> extends BlocoBase {
  type: 'table';
  rows: S[][][];
}

export interface BlocoAnexo extends BlocoBase {
  type: 'attach';
  kind: 'image' | 'file';
  name: string;
  url: string;
}

export type Bloco<S = Segmento> =
  | BlocoH2<S>
  | BlocoH3<S>
  | BlocoTexto<S>
  | BlocoEspecial<S>
  | BlocoLista<S>
  | BlocoTabela<S>
  | BlocoAnexo;

/** Bloco como aparece na revisão: pode conter lacunas dinâmicas. */
export type BlocoRevisao = Bloco<Segmento | SegmentoDinamico>;

/**
 * Trecho: derivado dos blocos a cada leitura, nunca salvo como conteúdo.
 * O id é o do bloco que o inicia.
 */
export interface Trecho {
  id: ID;
  num: number;
  titulo: string;
  blocos: Bloco[];
  palavras: number;
  lacunas: number;
  perguntas: number;
  /** Itens verificáveis = lacunas manuais + perguntas da margem. */
  itens: number;
  /** H3 que podem virar trechos próprios ao "Dividir pelos subtítulos". */
  subtitulos: BlocoH3[];
}

/** Formato de apresentação na revisão (R10). */
export type Modo = 'lacunas' | 'perguntas' | 'titulo' | 'densas';

export type Estagio = 'Nova' | 'Inicial' | 'Intermediário' | 'Estável';

export type Nota = 'Again' | 'Hard' | 'Good' | 'Easy';

/** Estado FSRS por trecho. Chave = `${resumoId}:${idDoBlocoInicial}`. */
export interface EstadoTrecho {
  key: string;
  S: number;
  D: number;
  due: Date;
  lastReview?: Date;
  reps: number;
  lapses: number;
}

export interface RegistroRevisao {
  id: ID;
  trechoKey: string;
  data: Date;
  modo: Modo;
  total: number;
  acertos: number;
  pct: number;
  nota: Nota;
  /** Resultado por item: true = acertou. */
  marcas: Record<ID, boolean>;
}

/** Desempenho de uma lacuna manual ao longo das revisões. */
export interface EstatLacuna {
  lacunaId: ID;
  n: number;
  erros: number;
}

export type Densidade = 'baixa' | 'média' | 'alta';

export interface FaixasNota {
  easy: number;
  good: number;
  hard: number;
}

export interface Configuracoes {
  retencao: 0.8 | 0.85 | 0.9 | 0.95;
  limiteTipo: 'palavras' | 'lacunas';
  limitePalavras: number;
  limiteLacunas: number;
  faixas: FaixasNota;
  densidade: Densidade;
  /** Limite de alteração (%) de um trecho já revisado antes de reduzir a estabilidade. */
  limiteEdicao: number;
  /** Trechos por dia na sessão. */
  limiteDiario: number;
}

export const CONFIG_PADRAO: Configuracoes = {
  retencao: 0.9,
  limiteTipo: 'palavras',
  limitePalavras: 150,
  limiteLacunas: 10,
  faixas: { easy: 100, good: 90, hard: 60 },
  densidade: 'média',
  limiteEdicao: 30,
  limiteDiario: 20,
};
