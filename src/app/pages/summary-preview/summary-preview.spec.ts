import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StudyStore } from '../../core/study-store';
import { StudyRepository } from '../../data/study-repository';
import { fakeAuth, fakeStudyRepo, provideFakeAuth } from '../../testing/fakes';
import { SummaryPreview } from './summary-preview';

describe('SummaryPreview', () => {
  let repo: ReturnType<typeof fakeStudyRepo>;

  type Ajuste = (r: ReturnType<typeof fakeStudyRepo>) => void;

  async function render(id = 'r1', trecho: string | null = null, ajustar?: Ajuste) {
    repo = fakeStudyRepo();
    repo.listEstados.mockResolvedValue([]);
    ajustar?.(repo);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: StudyRepository, useValue: repo },
        provideFakeAuth(fakeAuth(true)),
      ],
    });
    const fixture = TestBed.createComponent(SummaryPreview);
    fixture.componentRef.setInput('id', id);
    fixture.componentRef.setInput('trecho', trecho);
    await vi.waitFor(() => expect(TestBed.inject(StudyStore).status()).toBe('pronto'));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const estavel = () => fixture.whenStable();
    const botao = (texto: string) =>
      [...el.querySelectorAll('button')].find((b) => b.textContent?.trim().endsWith(texto))!;
    const posicao = () => el.querySelector('.navegacao .forte')?.textContent?.trim();
    return { el, estavel, botao, posicao };
  }

  it('abre no trecho pedido, avisa que é simulação e liga de volta ao editor', async () => {
    const { el, posicao } = await render('r1', 'b5');
    expect(el.querySelector('h1')?.textContent).toBe('Atos');
    expect(el.textContent).toContain('Simulação: nada é gravado.');
    expect(posicao()).toBe('Trecho 2 de 4');
    expect(el.querySelector('.caminho a')?.getAttribute('href')).toBe('/resumos/r1');
    expect(el.querySelector('.titulo-cartao')?.textContent?.trim()).toBe('Atributos');
  });

  it('navega entre os trechos e desabilita nas pontas', async () => {
    const { botao, estavel, posicao } = await render();
    expect(botao('Anterior').disabled).toBe(true);
    botao('Seguinte').click();
    await estavel();
    expect(posicao()).toBe('Trecho 2 de 4');
    botao('Seguinte').click();
    await estavel();
    botao('Seguinte').click();
    await estavel();
    expect(posicao()).toBe('Trecho 4 de 4');
    expect(botao('Seguinte').disabled).toBe(true);
  });

  it('chega a um trecho sem itens e avisa que ele não entra na revisão', async () => {
    const { el, botao, estavel } = await render('r1', 'b8');
    botao('Seguinte').click();
    await estavel();
    expect(el.querySelector('app-review-card h2')?.textContent).toBe('Convalidação');
    expect(el.querySelector('.instrucao')?.textContent).toContain(
      'Este trecho não tem itens verificáveis e não entra na revisão.',
    );
    expect(botao('Revelar')).toBeUndefined();
  });

  it('trocar o formato muda o cartão', async () => {
    const { el, estavel } = await render('r1', 'b5');
    const opcoes = [...el.querySelectorAll<HTMLInputElement>('.seg input')];
    expect(opcoes[0].checked).toBe(true);
    opcoes[2].click();
    await estavel();
    expect(el.querySelector('.etiquetas')?.textContent).toContain('Só perguntas');
    expect(el.querySelector('.perguntas .q')?.textContent).toBe(
      'Qual atributo dispensa ordem judicial?',
    );
  });

  it('revisar até o fim mostra "Fim do preview" sem gravar, e Recomeçar volta ao primeiro', async () => {
    const { el, botao, estavel, posicao } = await render('r1', 'b8');
    botao('Revelar').click();
    await estavel();
    botao('Marcar restantes como acerto').click();
    await estavel();
    botao('Calcular nota').click();
    await vi.waitFor(() => expect(el.querySelector('.resultado')).toBeTruthy());
    botao('Próximo trecho').click();
    await estavel();
    botao('Próximo trecho').click();
    await estavel();
    expect(el.querySelector('h2')?.textContent).toBe('Fim do preview');
    expect(repo.addRegistro).not.toHaveBeenCalled();
    expect(repo.saveEstados).not.toHaveBeenCalled();
    botao('Recomeçar').click();
    await estavel();
    expect(posicao()).toBe('Trecho 1 de 4');
  });

  it('resumo vazio explica o que fazer', async () => {
    const vazio = { id: 'r1', assuntoId: 'a1', titulo: 'Vazio', ordem: 0, blocos: [] };
    const { el } = await render('r1', null, (r) => r.listResumos.mockResolvedValue([vazio]));
    expect(el.querySelector('.vazio p')?.textContent).toContain('Este resumo ainda está vazio.');
    expect(el.querySelector('app-review-card')).toBeNull();
  });

  it('resumo inexistente avisa que não foi encontrado', async () => {
    const { el } = await render('nao-existe');
    expect(el.querySelector('.card-title')?.textContent).toBe('Resumo não encontrado.');
  });
});
