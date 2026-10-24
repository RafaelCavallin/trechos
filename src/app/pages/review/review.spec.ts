import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StudyStore } from '../../core/study-store';
import { StudyRepository } from '../../data/study-repository';
import { fakeAuth, fakeStudyRepo, provideFakeAuth } from '../../testing/fakes';
import { Review } from './review';

describe('Review', () => {
  let repo: ReturnType<typeof fakeStudyRepo>;

  async function render(semTrechos = false) {
    repo = fakeStudyRepo();
    repo.listEstados.mockResolvedValue([]);
    if (semTrechos) repo.listResumos.mockResolvedValue([]);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: StudyRepository, useValue: repo },
        provideFakeAuth(fakeAuth(true)),
      ],
    });
    const fixture = TestBed.createComponent(Review);
    await vi.waitFor(() => expect(TestBed.inject(StudyStore).status()).toBe('pronto'));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const estavel = () => fixture.whenStable();
    const botao = (texto: string) =>
      [...el.querySelectorAll('button')].find((b) => b.textContent?.trim().endsWith(texto))!;
    const tecla = async (key: string) => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
      await estavel();
    };
    return { el, estavel, botao, tecla };
  }

  it('sem trechos: "Tudo em dia"', async () => {
    const { el } = await render(true);
    expect(el.querySelector('h1')?.textContent).toBe('Tudo em dia');
  });

  it('lista a fila com formato e itens', async () => {
    const { el } = await render();
    expect(el.querySelector('h1')?.textContent).toBe('3 trechos · ~6 min');
    const primeiro = el.querySelector('.fila-item')!.textContent!.replace(/\s+/g, ' ');
    expect(primeiro).toContain('Conceito e requisitos');
    expect(primeiro).toContain('Adm · Atos');
    expect(primeiro).toContain('Com lacunas');
    expect(primeiro).toContain('7 itens');
  });

  it('sessão pelo teclado: Espaço revela, 1/2 marcam, Enter calcula e avança', async () => {
    const { el, botao, estavel, tecla } = await render();
    botao('Iniciar sessão').click();
    await estavel();
    const pilulas = [...el.querySelectorAll('.cartao .lacuna')];
    expect(pilulas.slice(0, 3).map((p) => p.textContent?.trim())).toEqual(['1', '2', '3']);
    expect(botao('Calcular nota')).toBeUndefined();

    await tecla(' ');
    expect(el.querySelector('.cartao .lacuna')?.textContent?.trim()).toBe(
      'manifestação unilateral de vontade',
    );
    expect(botao('Calcular nota').disabled).toBe(true);

    await tecla('2'); // item 1 errou
    await tecla('1'); // item 2 acertou
    expect(el.querySelector('.item')?.getAttribute('data-marca')).toBe('errou');
    expect(el.querySelectorAll('.item')[1].getAttribute('data-marca')).toBe('acertou');

    botao('Marcar restantes como acerto').click();
    await estavel();
    await tecla('Enter');
    await vi.waitFor(() => expect(el.querySelector('.resultado')).toBeTruthy());
    expect(repo.addRegistro).toHaveBeenCalledTimes(1);

    await tecla('Enter');
    expect(el.querySelector('.progresso-texto')?.textContent).toContain('Trecho 2 de 3');
  });

  it('clicar na lacuna revelada alterna acerto e erro', async () => {
    const { el, botao, estavel } = await render();
    botao('Iniciar sessão').click();
    await estavel();
    botao('Revelar').click();
    await estavel();
    const lacuna = () => el.querySelector('.cartao button.lacuna') as HTMLButtonElement;
    lacuna().click();
    await estavel();
    expect(lacuna().getAttribute('data-estado')).toBe('acertou');
    lacuna().click();
    await estavel();
    expect(lacuna().getAttribute('data-estado')).toBe('errou');
  });

  it('sair depois de avaliar mostra o resumo da sessão', async () => {
    const { el, botao, estavel } = await render();
    botao('Iniciar sessão').click();
    await estavel();
    botao('Revelar').click();
    await estavel();
    botao('Marcar restantes como acerto').click();
    await estavel();
    botao('Calcular nota').click();
    await vi.waitFor(() => expect(el.querySelector('.resultado')).toBeTruthy());
    botao('Sair').click();
    await estavel();
    expect(el.querySelector('app-session-summary h1')?.textContent).toBe('1 trecho revisado');
    expect(el.querySelector('app-session-summary tbody tr')?.textContent).toContain(
      'Conceito e requisitos',
    );
  });
});
