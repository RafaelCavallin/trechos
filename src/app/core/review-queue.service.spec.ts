import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ATOS_ADMINISTRATIVOS, REMEDIOS_CONSTITUCIONAIS } from '../domain/examples';
import { CONFIG_PADRAO, Resumo } from '../domain/types';
import { scheduledTrechos } from '../scheduler/candidates';
import { Agendador } from '../scheduler/fsrs';
import { ReviewQueueService } from './review-queue.service';
import { StudyStore } from './study-store';

describe('ReviewQueueService', () => {
  const agora = new Date(2026, 9, 23, 10);
  const assuntos = [
    { id: 'a1', materiaId: 'adm', nome: 'Atos', ordem: 0 },
    { id: 'a2', materiaId: 'const', nome: 'DF', ordem: 0 },
  ];
  const resumos: Resumo[] = [
    { id: 'r1', assuntoId: 'a1', titulo: 'Atos', ordem: 0, blocos: ATOS_ADMINISTRATIVOS },
    { id: 'r2', assuntoId: 'a2', titulo: 'Remédios', ordem: 0, blocos: REMEDIOS_CONSTITUCIONAIS },
  ];
  const config = signal({ ...CONFIG_PADRAO, limiteDiario: 3 });
  const trechos = signal(scheduledTrechos(resumos, assuntos, [], new Agendador(0.9), agora));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: StudyStore, useValue: { config, trechos, agora: signal(agora) } }],
    });
  });

  it('fila intercalada e cortada no limite diário', () => {
    const service = TestBed.inject(ReviewQueueService);
    // 3 trechos de Atos com itens + 1 de Remédios, intercalados e cortados em 3.
    expect(service.fila().map((t) => t.key)).toEqual(['r1:b1', 'r2:c1', 'r1:b5']);
    expect(service.dueCount()).toBe(3);
  });

  it('recalcula quando os dados mudam', () => {
    const service = TestBed.inject(ReviewQueueService);
    trechos.set([]);
    expect(service.dueCount()).toBe(0);
  });
});
