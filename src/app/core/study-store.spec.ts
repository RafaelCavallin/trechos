import { TestBed } from '@angular/core/testing';
import { StudyRepository } from '../data/study-repository';
import { fakeAuth, fakeStudyRepo, provideFakeAuth } from '../testing/fakes';
import { StudyStore } from './study-store';
import { ToastService } from './toast.service';

describe('StudyStore', () => {
  let repo: ReturnType<typeof fakeStudyRepo>;
  let store: StudyStore;

  beforeEach(async () => {
    repo = fakeStudyRepo();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [{ provide: StudyRepository, useValue: repo }, provideFakeAuth(fakeAuth(false))],
    });
    store = TestBed.inject(StudyStore);
    await store.load();
  });

  it('carrega os dados e calcula os trechos', () => {
    expect(store.status()).toBe('pronto');
    expect(store.materias().map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(store.trechos().map((t) => t.key)).toEqual(['r1:b1', 'r1:b5', 'r1:b8', 'r1:b16']);
  });

  it('carrega ao entrar e limpa ao sair', async () => {
    const auth = fakeAuth(false);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: StudyRepository, useValue: repo }, provideFakeAuth(auth)],
    });
    const s = TestBed.inject(StudyStore);
    TestBed.tick();
    expect(s.status()).toBe('vazio');
    auth.user.set({ id: 'u1' });
    TestBed.tick();
    await vi.waitFor(() => expect(s.status()).toBe('pronto'));
    auth.user.set(null);
    TestBed.tick();
    expect(s.status()).toBe('vazio');
    expect(s.materias()).toEqual([]);
  });

  it('cria com nome padrão no fim da lista', async () => {
    const m = await store.createMateria();
    expect(repo.createMateria).toHaveBeenCalledWith('Nova matéria', 2);
    expect(store.materias().at(-1)).toEqual(m);
    await store.createAssunto('m1');
    expect(repo.createAssunto).toHaveBeenCalledWith('m1', 'Novo assunto', 1);
    const r = await store.createResumo('a1');
    expect(repo.createResumo).toHaveBeenCalledWith('a1', 'Novo resumo', 1, expect.any(Array));
    expect(r?.blocos).toHaveLength(2);
  });

  it('renomeia; nome vazio mantém o anterior', async () => {
    await store.rename('materia', 'm1', '  Direito Administrativo  ');
    expect(repo.renameMateria).toHaveBeenCalledWith('m1', 'Direito Administrativo');
    expect(store.materias()[0].nome).toBe('Direito Administrativo');
    await store.rename('assunto', 'a1', '   ');
    expect(repo.renameAssunto).not.toHaveBeenCalled();
    await store.rename('resumo', 'r1', 'Atos (revisado)');
    expect(store.resumos()[0].titulo).toBe('Atos (revisado)');
  });

  it('desfaz o renomear se o banco recusar e avisa', async () => {
    repo.renameMateria.mockRejectedValue(new Error('falhou'));
    await store.rename('materia', 'm1', 'Outro nome');
    expect(store.materias()[0].nome).toBe('Adm');
    expect(TestBed.inject(ToastService).message()).toBe('Não foi possível salvar. Tente de novo.');
  });

  it('grava a configuração e já recalcula o agendador', async () => {
    const nova = { ...store.config(), retencao: 0.8 as const };
    const antes = store.agendador();
    expect(await store.saveConfig(nova)).toBe(true);
    expect(repo.saveConfiguracoes).toHaveBeenCalledWith(nova);
    expect(store.config()).toEqual(nova);
    expect(store.agendador()).not.toBe(antes);
  });

  it('desfaz a configuração se o banco recusar', async () => {
    repo.saveConfiguracoes.mockRejectedValue(new Error('falhou'));
    const antes = store.config();
    expect(await store.saveConfig({ ...antes, limiteDiario: 5 })).toBe(false);
    expect(store.config()).toBe(antes);
    expect(TestBed.inject(ToastService).message()).toBe('Não foi possível salvar. Tente de novo.');
  });

  it('excluir matéria leva junto assuntos, resumos e estados', async () => {
    expect(await store.remove('materia', 'm1')).toBe(true);
    expect(store.materias().map((m) => m.id)).toEqual(['m2']);
    expect(store.assuntos()).toEqual([]);
    expect(store.resumos()).toEqual([]);
    expect(store.estados()).toEqual([]);
    expect(store.trechos()).toEqual([]);
  });

  it('se a exclusão falhar, nada some', async () => {
    repo.deleteResumo.mockRejectedValue(new Error('falhou'));
    expect(await store.remove('resumo', 'r1')).toBe(false);
    expect(store.resumos()).toHaveLength(1);
  });

  it('reordena na hora e grava a nova ordem', async () => {
    await store.reorder('materia', ['m2', 'm1']);
    expect(store.materias().map((m) => m.id)).toEqual(['m2', 'm1']);
    expect(repo.reorder).toHaveBeenCalledWith('materias', ['m2', 'm1']);
  });

  it('desfaz a reordenação se o banco recusar', async () => {
    repo.reorder.mockRejectedValue(new Error('falhou'));
    await store.reorder('materia', ['m2', 'm1']);
    expect(store.materias().map((m) => m.id)).toEqual(['m1', 'm2']);
  });

  it('carrega os exemplos e recarrega tudo', async () => {
    expect(await store.loadExamples()).toBe(true);
    expect(repo.createMateria.mock.calls.map((c) => c[0])).toEqual([
      'Direito Administrativo',
      'Direito Constitucional',
      'Direito Penal',
    ]);
    expect(repo.createResumo).toHaveBeenCalledTimes(3);
    expect(repo.listMaterias).toHaveBeenCalledTimes(2);
  });

  it('erro ao carregar: status de erro e aviso', async () => {
    repo.listResumos.mockRejectedValue(new Error('fora do ar'));
    await store.load();
    expect(store.status()).toBe('erro');
    expect(TestBed.inject(ToastService).message()).toBe('Não foi possível carregar seus dados.');
  });
});
