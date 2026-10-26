import { Provider, signal } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { ReviewQueueService } from '../core/review-queue.service';
import { ATOS_ADMINISTRATIVOS } from '../domain/examples';
import { CONFIG_PADRAO } from '../domain/types';

/** Login falso para testes de componentes. */
export function fakeAuth(logado = true) {
  const user = signal(logado ? { id: 'u1' } : null);
  return {
    user,
    nome: signal<string | null>(logado ? 'Ana' : null),
    session: signal(logado ? { user: { id: 'u1' } } : null),
    ready: Promise.resolve(),
    signIn: vi.fn().mockResolvedValue(undefined),
    signUp: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
  };
}

export function provideFakeAuth(auth = fakeAuth()): Provider {
  return { provide: AuthService, useValue: auth };
}

export function provideFakeQueue(dueCount = signal(0)): Provider {
  return { provide: ReviewQueueService, useValue: { dueCount, fila: signal([]) } };
}

/** Repositório falso: 2 matérias, 1 assunto e o resumo "Atos administrativos". */
export function fakeStudyRepo() {
  let n = 0;
  return {
    getConfiguracoes: vi.fn().mockResolvedValue(CONFIG_PADRAO),
    saveConfiguracoes: vi.fn().mockResolvedValue(undefined),
    listMaterias: vi.fn().mockResolvedValue([
      { id: 'm1', nome: 'Adm', ordem: 0 },
      { id: 'm2', nome: 'Const', ordem: 1 },
    ]),
    listAssuntos: vi
      .fn()
      .mockResolvedValue([{ id: 'a1', materiaId: 'm1', nome: 'Atos', ordem: 0 }]),
    listResumos: vi
      .fn()
      .mockResolvedValue([
        { id: 'r1', assuntoId: 'a1', titulo: 'Atos', ordem: 0, blocos: ATOS_ADMINISTRATIVOS },
      ]),
    listEstados: vi
      .fn()
      .mockResolvedValue([{ key: 'r1:b1', S: 1, D: 5, due: new Date(), reps: 1, lapses: 0 }]),
    createMateria: vi.fn(async (nome: string, ordem: number) => ({
      id: `nova${++n}`,
      nome,
      ordem,
    })),
    createAssunto: vi.fn(async (materiaId: string, nome: string, ordem: number) => ({
      id: `a-novo${++n}`,
      materiaId,
      nome,
      ordem,
    })),
    createResumo: vi.fn(
      async (assuntoId: string, titulo: string, ordem: number, blocos: unknown) => ({
        id: `r-novo${++n}`,
        assuntoId,
        titulo,
        ordem,
        blocos,
      }),
    ),
    renameMateria: vi.fn().mockResolvedValue(undefined),
    renameAssunto: vi.fn().mockResolvedValue(undefined),
    renameResumo: vi.fn().mockResolvedValue(undefined),
    deleteMateria: vi.fn().mockResolvedValue(undefined),
    deleteAssunto: vi.fn().mockResolvedValue(undefined),
    deleteResumo: vi.fn().mockResolvedValue(undefined),
    reorder: vi.fn().mockResolvedValue(undefined),
    saveBlocos: vi.fn().mockResolvedValue(undefined),
    listRegistros: vi.fn().mockResolvedValue([]),
    addRegistro: vi.fn(async (r: object) => ({ id: `reg${++n}`, ...r })),
    saveEstados: vi.fn().mockResolvedValue(undefined),
    uploadAnexo: vi.fn().mockResolvedValue('u1/r1/arquivo.pdf'),
    anexoUrl: vi.fn().mockResolvedValue('blob:anexo'),
    removeAnexos: vi.fn().mockResolvedValue(undefined),
  };
}
