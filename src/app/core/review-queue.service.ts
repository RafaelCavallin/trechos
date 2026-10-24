import { Injectable, computed, inject } from '@angular/core';
import { buildDailyQueue } from '../scheduler/queue';
import { StudyStore } from './study-store';

/** Fila de revisão do dia (T2.3), recalculada sempre que os dados mudam. */
@Injectable({ providedIn: 'root' })
export class ReviewQueueService {
  private readonly store = inject(StudyStore);

  readonly config = this.store.config;
  readonly fila = computed(() =>
    buildDailyQueue(this.store.trechos(), this.store.agora(), this.store.config().limiteDiario),
  );
  readonly dueCount = computed(() => this.fila().length);
}
