import { Injectable, signal } from '@angular/core';

/**
 * Fila de revisão do dia. Por enquanto só expõe o tamanho para o badge da
 * barra lateral; a montagem da fila de verdade entra na Fase 2 (T2.3).
 */
@Injectable({ providedIn: 'root' })
export class ReviewQueueService {
  readonly dueCount = signal(0);
}
