import { Injectable, signal } from '@angular/core';
import { ID } from '../domain/types';
import { FormatoPreview, filaDoPreview, indiceDoTrecho, sessaoNoTrecho } from './fila-preview';
import { SessaoBase } from './sessao-base';

@Injectable()
export class PreviewSessionService extends SessaoBase {
  private readonly _formato = signal<FormatoPreview>('auto');
  readonly formato = this._formato.asReadonly();
  private resumoId: ID | null = null;

  iniciar(resumoId: ID, trechoId?: ID | null): void {
    this.resumoId = resumoId;
    this.montar(trechoId);
  }

  escolherFormato(formato: FormatoPreview): void {
    this._formato.set(formato);
    this.montar(this.atual()?.entrada.trechoId);
  }

  irPara(indice: number): void {
    const s = this._sessao();
    if (!s || indice < 0 || indice >= s.fila.length) return;
    this._sessao.set(sessaoNoTrecho(s.fila, indice));
  }

  recomecar(): void {
    this.irPara(0);
  }

  async calcularNota(agora = new Date()): Promise<void> {
    this.avaliar(agora);
  }

  private montar(trechoId?: ID | null): void {
    const resumo = this.store.resumos().find((r) => r.id === this.resumoId);
    const assunto = this.store.assuntos().find((a) => a.id === resumo?.assuntoId);
    if (!resumo || !assunto) {
      this._sessao.set(null);
      return;
    }
    const fila = filaDoPreview({
      resumo,
      materiaId: assunto.materiaId,
      estados: this.store.estados(),
      formato: this._formato(),
    });
    this._sessao.set(fila.length ? sessaoNoTrecho(fila, indiceDoTrecho(fila, trechoId)) : null);
  }
}
