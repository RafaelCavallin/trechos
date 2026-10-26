import { Injectable, inject } from '@angular/core';
import { ReviewQueueService } from '../core/review-queue.service';
import { SessaoBase } from './sessao-base';
import * as S from './session';

@Injectable({ providedIn: 'root' })
export class ReviewSessionService extends SessaoBase {
  private readonly fila = inject(ReviewQueueService);

  iniciar(): void {
    const fila = this.fila.fila();
    if (fila.length) this._sessao.set(S.iniciar(fila));
  }

  async calcularNota(agora = new Date()): Promise<void> {
    const avaliacao = this.avaliar(agora);
    if (!avaliacao) return;
    const { estado, nota, marcas, modo, resultado } = avaliacao;
    await this.store.recordReview(estado, {
      trechoKey: resultado.key,
      data: agora,
      modo,
      ...nota,
      marcas,
    });
  }

  sair(): void {
    const s = this._sessao();
    if (s) this._sessao.set(S.sair(s));
  }

  encerrar(): void {
    this._sessao.set(null);
  }
}
