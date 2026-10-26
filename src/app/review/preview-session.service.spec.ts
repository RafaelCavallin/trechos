import { TestBed } from '@angular/core/testing';
import { StudyStore } from '../core/study-store';
import { StudyRepository } from '../data/study-repository';
import { fakeAuth, fakeStudyRepo, provideFakeAuth } from '../testing/fakes';
import { PreviewSessionService } from './preview-session.service';

describe('PreviewSessionService', () => {
  let repo: ReturnType<typeof fakeStudyRepo>;
  let servico: PreviewSessionService;

  beforeEach(async () => {
    repo = fakeStudyRepo();
    repo.listEstados.mockResolvedValue([]);
    TestBed.configureTestingModule({
      providers: [
        PreviewSessionService,
        { provide: StudyRepository, useValue: repo },
        provideFakeAuth(fakeAuth(false)),
      ],
    });
    await TestBed.inject(StudyStore).load();
    servico = TestBed.inject(PreviewSessionService);
  });

  const avaliarTudoCerto = async () => {
    servico.revelar();
    servico.marcarRestantes();
    await servico.calcularNota(new Date(2026, 9, 23, 10));
  };

  it('monta a fila com todos os trechos do resumo', () => {
    servico.iniciar('r1');
    expect(servico.sessao()?.fila.map((e) => e.key)).toEqual(['r1:b1', 'r1:b5', 'r1:b8', 'r1:b16']);
    expect(servico.atual()?.trecho?.titulo).toBe('Conceito e requisitos');
  });

  it('começa no trecho pedido', () => {
    servico.iniciar('r1', 'b5');
    expect(servico.atual()?.trecho?.titulo).toBe('Atributos');
  });

  it('abre também num trecho sem itens, que não deixa calcular nota', async () => {
    servico.iniciar('r1', 'b16');
    servico.revelar();
    await servico.calcularNota();
    expect(servico.sessao()).toMatchObject({ indice: 3, resultado: null });
    expect(servico.todosMarcados()).toBe(false);
  });

  it('quando o trecho pedido não existe, começa no primeiro', () => {
    servico.iniciar('r1', 'nao-existe');
    expect(servico.sessao()?.indice).toBe(0);
  });

  it('resumo inexistente não abre sessão', () => {
    servico.iniciar('nao-existe');
    expect(servico.sessao()).toBeNull();
  });

  it('calcular a nota mostra o resultado sem gravar nada', async () => {
    servico.iniciar('r1');
    await avaliarTudoCerto();
    expect(servico.sessao()?.resultado).toMatchObject({ key: 'r1:b1', pct: 100, nota: 'Easy' });
    expect(repo.addRegistro).not.toHaveBeenCalled();
    expect(repo.saveEstados).not.toHaveBeenCalled();
    expect(TestBed.inject(StudyStore).estados()).toEqual([]);
  });

  it('não calcula a nota sem todos os itens marcados', async () => {
    servico.iniciar('r1');
    servico.revelar();
    await servico.calcularNota();
    expect(servico.sessao()?.resultado).toBeNull();
  });

  it('trocar o formato mantém o trecho e zera o que foi marcado', () => {
    servico.iniciar('r1', 'b5');
    servico.revelar();
    servico.marcarRestantes();
    servico.escolherFormato('perguntas');
    expect(servico.formato()).toBe('perguntas');
    expect(servico.atual()).toMatchObject({ modo: 'perguntas', trecho: { titulo: 'Atributos' } });
    expect(servico.sessao()).toMatchObject({ revelado: false, marcas: {} });
  });

  it('ir para outro trecho zera revelado, marcas e nota', async () => {
    servico.iniciar('r1');
    await avaliarTudoCerto();
    servico.irPara(2);
    expect(servico.sessao()).toMatchObject({
      indice: 2,
      revelado: false,
      marcas: {},
      resultado: null,
    });
  });

  it('ignora ir para um trecho fora da fila', () => {
    servico.iniciar('r1', 'b5');
    servico.irPara(4);
    servico.irPara(-1);
    expect(servico.sessao()?.indice).toBe(1);
  });

  it('depois do último trecho conclui, e recomeçar volta ao primeiro', () => {
    servico.iniciar('r1', 'b16');
    servico.proximo();
    expect(servico.sessao()?.concluida).toBe(true);
    servico.recomecar();
    expect(servico.sessao()).toMatchObject({ indice: 0, concluida: false });
  });

  it('guarda o texto livre e alterna a marca ao clicar no item', () => {
    servico.iniciar('r1');
    servico.setRecall('o que lembro');
    servico.revelar();
    const id = servico.atual()!.itens[0].id;
    servico.alternar(id);
    servico.alternar(id);
    expect(servico.sessao()).toMatchObject({ recall: 'o que lembro', marcas: { [id]: false } });
  });

  it('sem sessão aberta, as ações não fazem nada', async () => {
    servico.revelar();
    servico.marcar('x', true);
    await servico.calcularNota();
    servico.irPara(0);
    expect(servico.sessao()).toBeNull();
  });
});
