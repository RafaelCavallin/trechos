import {
  Assunto,
  Bloco,
  Configuracoes,
  EstadoTrecho,
  ID,
  Materia,
  Modo,
  Nota,
  RegistroRevisao,
  Resumo,
} from '../domain/types';
import { trechoKey } from '../domain/trechos';

/**
 * Linhas das tabelas do Supabase (snake_case) e a conversão para o modelo do app.
 * user_id nunca é enviado: o banco preenche com o usuário logado.
 */

export interface MateriaRow {
  id: ID;
  nome: string;
  ordem: number;
}

export interface AssuntoRow {
  id: ID;
  materia_id: ID;
  nome: string;
  ordem: number;
}

export interface ResumoRow {
  id: ID;
  assunto_id: ID;
  titulo: string;
  ordem: number;
  blocos: Bloco[];
}

export interface EstadoTrechoRow {
  resumo_id: ID;
  bloco_id: ID;
  stability: number;
  difficulty: number;
  due: string;
  last_review: string | null;
  reps: number;
  lapses: number;
}

export interface RegistroRevisaoRow {
  id: ID;
  resumo_id: ID;
  bloco_id: ID;
  data: string;
  modo: Modo;
  total: number;
  acertos: number;
  pct: number;
  nota: Nota;
  marcas: Record<ID, boolean>;
}

export interface ConfiguracoesRow {
  retencao: number | string;
  limite_tipo: Configuracoes['limiteTipo'];
  limite_palavras: number;
  limite_lacunas: number;
  faixa_easy: number;
  faixa_good: number;
  faixa_hard: number;
  densidade: Configuracoes['densidade'];
  limite_edicao: number;
  limite_diario: number;
}

export const toMateria = (r: MateriaRow): Materia => ({ id: r.id, nome: r.nome, ordem: r.ordem });

export const toAssunto = (r: AssuntoRow): Assunto => ({
  id: r.id,
  materiaId: r.materia_id,
  nome: r.nome,
  ordem: r.ordem,
});

export const toResumo = (r: ResumoRow): Resumo => ({
  id: r.id,
  assuntoId: r.assunto_id,
  titulo: r.titulo,
  ordem: r.ordem,
  blocos: r.blocos ?? [],
});

/** Separa a chave do trecho em resumo e bloco. O id do resumo é um uuid, sem ":". */
export function splitTrechoKey(key: string): { resumoId: ID; blocoId: ID } {
  const i = key.indexOf(':');
  if (i <= 0) throw new Error(`Chave de trecho inválida: ${key}`);
  return { resumoId: key.slice(0, i), blocoId: key.slice(i + 1) };
}

export const toEstadoTrecho = (r: EstadoTrechoRow): EstadoTrecho => ({
  key: trechoKey(r.resumo_id, r.bloco_id),
  S: r.stability,
  D: r.difficulty,
  due: new Date(r.due),
  ...(r.last_review ? { lastReview: new Date(r.last_review) } : {}),
  reps: r.reps,
  lapses: r.lapses,
});

export function fromEstadoTrecho(e: EstadoTrecho): EstadoTrechoRow {
  const { resumoId, blocoId } = splitTrechoKey(e.key);
  return {
    resumo_id: resumoId,
    bloco_id: blocoId,
    stability: e.S,
    difficulty: e.D,
    due: e.due.toISOString(),
    last_review: e.lastReview ? e.lastReview.toISOString() : null,
    reps: e.reps,
    lapses: e.lapses,
  };
}

export const toRegistroRevisao = (r: RegistroRevisaoRow): RegistroRevisao => ({
  id: r.id,
  trechoKey: trechoKey(r.resumo_id, r.bloco_id),
  data: new Date(r.data),
  modo: r.modo,
  total: r.total,
  acertos: r.acertos,
  pct: r.pct,
  nota: r.nota,
  marcas: r.marcas ?? {},
});

export function fromRegistroRevisao(
  r: Omit<RegistroRevisao, 'id'>,
): Omit<RegistroRevisaoRow, 'id'> {
  const { resumoId, blocoId } = splitTrechoKey(r.trechoKey);
  return {
    resumo_id: resumoId,
    bloco_id: blocoId,
    data: r.data.toISOString(),
    modo: r.modo,
    total: r.total,
    acertos: r.acertos,
    pct: r.pct,
    nota: r.nota,
    marcas: r.marcas,
  };
}

export const toConfiguracoes = (r: ConfiguracoesRow): Configuracoes => ({
  retencao: Number(r.retencao) as Configuracoes['retencao'],
  limiteTipo: r.limite_tipo,
  limitePalavras: r.limite_palavras,
  limiteLacunas: r.limite_lacunas,
  faixas: { easy: r.faixa_easy, good: r.faixa_good, hard: r.faixa_hard },
  densidade: r.densidade,
  limiteEdicao: r.limite_edicao,
  limiteDiario: r.limite_diario,
});

export const fromConfiguracoes = (c: Configuracoes): ConfiguracoesRow => ({
  retencao: c.retencao,
  limite_tipo: c.limiteTipo,
  limite_palavras: c.limitePalavras,
  limite_lacunas: c.limiteLacunas,
  faixa_easy: c.faixas.easy,
  faixa_good: c.faixas.good,
  faixa_hard: c.faixas.hard,
  densidade: c.densidade,
  limite_edicao: c.limiteEdicao,
  limite_diario: c.limiteDiario,
});
