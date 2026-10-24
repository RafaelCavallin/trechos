import { Injectable, inject } from '@angular/core';
import { PostgrestError } from '@supabase/supabase-js';
import { SUPABASE } from '../core/supabase';
import {
  Assunto,
  Bloco,
  CONFIG_PADRAO,
  Configuracoes,
  EstadoTrecho,
  ID,
  Materia,
  RegistroRevisao,
  Resumo,
} from '../domain/types';
import {
  AssuntoRow,
  ConfiguracoesRow,
  EstadoTrechoRow,
  MateriaRow,
  RegistroRevisaoRow,
  ResumoRow,
  fromConfiguracoes,
  fromEstadoTrecho,
  fromRegistroRevisao,
  splitTrechoKey,
  toAssunto,
  toConfiguracoes,
  toEstadoTrecho,
  toMateria,
  toRegistroRevisao,
  toResumo,
} from './rows';

export const BUCKET_ANEXOS = 'anexos';

/**
 * Acesso aos dados do usuário logado no Supabase (T2.1).
 * O banco filtra por usuário (RLS), então nenhuma consulta precisa de user_id.
 * Em caso de erro, os métodos lançam `ErroDeDados`.
 */
@Injectable({ providedIn: 'root' })
export class StudyRepository {
  private readonly db = inject(SUPABASE);

  // ── Matérias ──────────────────────────────────────────────────────────────

  async listMaterias(): Promise<Materia[]> {
    const rows = await this.run<MateriaRow[]>(
      this.db.from('materias').select('id, nome, ordem').order('ordem').order('criado_em'),
    );
    return rows.map(toMateria);
  }

  async createMateria(nome: string, ordem: number): Promise<Materia> {
    const row = await this.run<MateriaRow>(
      this.db.from('materias').insert({ nome, ordem }).select('id, nome, ordem').single(),
    );
    return toMateria(row);
  }

  async renameMateria(id: ID, nome: string): Promise<void> {
    await this.run(this.db.from('materias').update({ nome }).eq('id', id));
  }

  async deleteMateria(id: ID): Promise<void> {
    await this.run(this.db.from('materias').delete().eq('id', id));
  }

  // ── Assuntos ──────────────────────────────────────────────────────────────

  async listAssuntos(): Promise<Assunto[]> {
    const rows = await this.run<AssuntoRow[]>(
      this.db
        .from('assuntos')
        .select('id, materia_id, nome, ordem')
        .order('ordem')
        .order('criado_em'),
    );
    return rows.map(toAssunto);
  }

  async createAssunto(materiaId: ID, nome: string, ordem: number): Promise<Assunto> {
    const row = await this.run<AssuntoRow>(
      this.db
        .from('assuntos')
        .insert({ materia_id: materiaId, nome, ordem })
        .select('id, materia_id, nome, ordem')
        .single(),
    );
    return toAssunto(row);
  }

  async renameAssunto(id: ID, nome: string): Promise<void> {
    await this.run(this.db.from('assuntos').update({ nome }).eq('id', id));
  }

  async deleteAssunto(id: ID): Promise<void> {
    await this.run(this.db.from('assuntos').delete().eq('id', id));
  }

  // ── Resumos ───────────────────────────────────────────────────────────────

  async listResumos(): Promise<Resumo[]> {
    const rows = await this.run<ResumoRow[]>(
      this.db
        .from('resumos')
        .select('id, assunto_id, titulo, ordem, blocos')
        .order('ordem')
        .order('criado_em'),
    );
    return rows.map(toResumo);
  }

  async getResumo(id: ID): Promise<Resumo | null> {
    const row = await this.run<ResumoRow | null>(
      this.db
        .from('resumos')
        .select('id, assunto_id, titulo, ordem, blocos')
        .eq('id', id)
        .maybeSingle(),
    );
    return row ? toResumo(row) : null;
  }

  async createResumo(
    assuntoId: ID,
    titulo: string,
    ordem: number,
    blocos: Bloco[],
  ): Promise<Resumo> {
    const row = await this.run<ResumoRow>(
      this.db
        .from('resumos')
        .insert({ assunto_id: assuntoId, titulo, ordem, blocos })
        .select('id, assunto_id, titulo, ordem, blocos')
        .single(),
    );
    return toResumo(row);
  }

  async renameResumo(id: ID, titulo: string): Promise<void> {
    await this.run(this.db.from('resumos').update({ titulo }).eq('id', id));
  }

  async saveBlocos(id: ID, blocos: Bloco[]): Promise<void> {
    await this.run(this.db.from('resumos').update({ blocos }).eq('id', id));
  }

  async deleteResumo(id: ID): Promise<void> {
    await this.run(this.db.from('resumos').delete().eq('id', id));
  }

  /** Grava a nova ordem de matérias, assuntos ou resumos (arrastar para reordenar). */
  async reorder(tabela: 'materias' | 'assuntos' | 'resumos', idsEmOrdem: ID[]): Promise<void> {
    await Promise.all(
      idsEmOrdem.map((id, ordem) => this.run(this.db.from(tabela).update({ ordem }).eq('id', id))),
    );
  }

  // ── Estado FSRS dos trechos ───────────────────────────────────────────────

  async listEstados(): Promise<EstadoTrecho[]> {
    const rows = await this.run<EstadoTrechoRow[]>(
      this.db
        .from('estados_trecho')
        .select('resumo_id, bloco_id, stability, difficulty, due, last_review, reps, lapses'),
    );
    return rows.map(toEstadoTrecho);
  }

  async saveEstados(estados: EstadoTrecho[]): Promise<void> {
    if (estados.length === 0) return;
    await this.run(
      this.db
        .from('estados_trecho')
        .upsert(estados.map(fromEstadoTrecho), { onConflict: 'resumo_id,bloco_id' }),
    );
  }

  async deleteEstado(key: string): Promise<void> {
    const { resumoId, blocoId } = splitTrechoKey(key);
    await this.run(
      this.db.from('estados_trecho').delete().eq('resumo_id', resumoId).eq('bloco_id', blocoId),
    );
  }

  // ── Registros de revisão ──────────────────────────────────────────────────

  async listRegistros(): Promise<RegistroRevisao[]> {
    const rows = await this.run<RegistroRevisaoRow[]>(
      this.db
        .from('registros_revisao')
        .select('id, resumo_id, bloco_id, data, modo, total, acertos, pct, nota, marcas')
        .order('data', { ascending: false }),
    );
    return rows.map(toRegistroRevisao);
  }

  async addRegistro(registro: Omit<RegistroRevisao, 'id'>): Promise<RegistroRevisao> {
    const row = await this.run<RegistroRevisaoRow>(
      this.db
        .from('registros_revisao')
        .insert(fromRegistroRevisao(registro))
        .select('id, resumo_id, bloco_id, data, modo, total, acertos, pct, nota, marcas')
        .single(),
    );
    return toRegistroRevisao(row);
  }

  // ── Configurações ─────────────────────────────────────────────────────────

  /** Configurações do usuário; os padrões quando ainda não salvou nenhuma. */
  async getConfiguracoes(): Promise<Configuracoes> {
    const row = await this.run<ConfiguracoesRow | null>(
      this.db.from('configuracoes').select('*').maybeSingle(),
    );
    return row ? toConfiguracoes(row) : CONFIG_PADRAO;
  }

  async saveConfiguracoes(config: Configuracoes): Promise<void> {
    await this.run(this.db.from('configuracoes').upsert(fromConfiguracoes(config)));
  }

  // ── Anexos (Supabase Storage) ─────────────────────────────────────────────

  /** Envia um arquivo para a pasta do resumo e devolve o caminho salvo. */
  async uploadAnexo(userId: ID, resumoId: ID, arquivo: File): Promise<string> {
    const nome = arquivo.name.replace(/[^\w.-]+/g, '_').slice(-80) || 'arquivo';
    const caminho = `${userId}/${resumoId}/${crypto.randomUUID().slice(0, 8)}-${nome}`;
    const { error } = await this.db.storage
      .from(BUCKET_ANEXOS)
      .upload(caminho, arquivo, { contentType: arquivo.type || undefined });
    if (error) throw new Error(`Erro ao enviar o anexo: ${error.message}`);
    return caminho;
  }

  /** Link temporário (1 hora) para ver ou baixar um anexo. */
  async anexoUrl(caminho: string): Promise<string> {
    const { data, error } = await this.db.storage
      .from(BUCKET_ANEXOS)
      .createSignedUrl(caminho, 3600);
    if (error) throw new Error(`Erro ao abrir o anexo: ${error.message}`);
    return data.signedUrl;
  }

  async removeAnexos(caminhos: string[]): Promise<void> {
    if (caminhos.length === 0) return;
    const { error } = await this.db.storage.from(BUCKET_ANEXOS).remove(caminhos);
    if (error) throw new Error(`Erro ao remover anexos: ${error.message}`);
  }

  // ──────────────────────────────────────────────────────────────────────────

  private async run<T = unknown>(
    consulta: PromiseLike<{ data: unknown; error: PostgrestError | null }>,
  ): Promise<T> {
    const { data, error } = await consulta;
    if (error) throw new ErroDeDados(error);
    return data as T;
  }
}

export class ErroDeDados extends Error {
  constructor(readonly causa: PostgrestError) {
    super(`Erro ao acessar os dados: ${causa.message}`);
    this.name = 'ErroDeDados';
  }
}
