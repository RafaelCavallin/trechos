import { TestBed } from '@angular/core/testing';
import { StudyStore } from '../core/study-store';
import { StudyRepository } from '../data/study-repository';
import { fakeAuth, fakeStudyRepo, provideFakeAuth } from '../testing/fakes';
import { ReviewSessionService } from './review-session.service';

describe('ReviewSessionService', () => {
  let repo: ReturnType<typeof fakeStudyRepo>;
  let servico: ReviewSessionService;
  let store: StudyStore;

  beforeEach(async () => {
    repo = fakeStudyRepo();
    repo.listEstados.mockResolvedValue([]); // todos os trechos novos
    TestBed.configureTestingModule({
      providers: [{ provide: StudyRepository, useValue: repo }, provideFakeAuth(fakeAuth(false))],
    });
    store = TestBed.inject(StudyStore);
    await store.load();
    servico = TestBed.inject(ReviewSessionService);
  });

  it('inicia com a fila do dia e monta o trecho atual', () => {
    servico.iniciar();
    const s = servico.sessao()!;
    expect(s.fila.map((e) => e.key)).toEqual(['r1:b1', 'r1:b5', 'r1:b8']);
    const a = servico.atual()!;
    expect(a.trecho?.titulo).toBe('Conceito e requisitos');
    expect(a.modo).toBe('lacunas');
    expect(a.materia).toBe('Adm');
    expect(a.itens.filter((i) => i.tipo === 'lacuna')).toHaveLength(6);
  });

  it('calcular nota exige tudo marcado, grava estado e registro', async () => {
    servico.iniciar();
    servico.revelar();
    await servico.calcularNota();
    expect(repo.addRegistro).not.toHaveBeenCalled();

    const itens = servico.atual()!.itens;
    servico.marcar(itens[0].id, false);
    servico.marcarRestantes();
    expect(servico.todosMarcados()).toBe(true);
    const agora = new Date(2026, 9, 23, 10);
    await servico.calcularNota(agora);

    const r = servico.sessao()!.resultado!;
    expect(r).toMatchObject({ key: 'r1:b1', total: itens.length, acertos: itens.length - 1 });
    expect(r.erradas).toEqual(['manifestação unilateral de vontade']);
    expect(repo.addRegistro).toHaveBeenCalledWith(
      expect.objectContaining({
        trechoKey: 'r1:b1',
        modo: 'lacunas',
        total: itens.length,
        nota: r.nota,
      }),
    );
    const marcas = (repo.addRegistro.mock.calls[0][0] as { marcas: object }).marcas;
    expect(Object.keys(marcas)).toHaveLength(itens.length);
    expect(repo.saveEstados).toHaveBeenCalledWith([
      expect.objectContaining({ key: 'r1:b1', reps: 1 }),
    ]);
    expect(store.estados().find((e) => e.key === 'r1:b1')?.lastReview).toEqual(agora);
    expect(store.registros()).toHaveLength(1);

    // Já avaliado: marcar e calcular de novo não fazem nada.
    servico.marcar(itens[0].id, true);
    await servico.calcularNota();
    expect(repo.addRegistro).toHaveBeenCalledTimes(1);
  });

  it('próximo, sair e encerrar', async () => {
    servico.iniciar();
    servico.sair();
    expect(servico.sessao()).toBeNull();

    servico.iniciar();
    servico.revelar();
    servico.marcarRestantes();
    await servico.calcularNota();
    servico.proximo();
    expect(servico.atual()?.trecho?.titulo).toBe('Atributos');
    servico.sair();
    expect(servico.sessao()?.concluida).toBe(true);
    expect(servico.atual()).toBeNull();
    servico.encerrar();
    expect(servico.sessao()).toBeNull();
  });

  it('trecho apagado durante a sessão aparece sem itens', () => {
    servico.iniciar();
    store.setBlocos('r1', []);
    expect(servico.atual()).toMatchObject({ trecho: null, itens: [] });
  });
});
