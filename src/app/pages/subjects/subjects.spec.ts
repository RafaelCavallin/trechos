import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ConfirmService } from '../../core/confirm.service';
import { StudyStore } from '../../core/study-store';
import { ToastService } from '../../core/toast.service';
import { StudyRepository } from '../../data/study-repository';
import { fakeAuth, fakeStudyRepo, provideFakeAuth } from '../../testing/fakes';
import { Subjects } from './subjects';

describe('Subjects', () => {
  let repo: ReturnType<typeof fakeStudyRepo>;

  /** Cria a tela já logado e espera os dados carregarem. */
  async function criar() {
    const fixture = TestBed.createComponent(Subjects);
    const store = TestBed.inject(StudyStore);
    await vi.waitFor(() => expect(store.status()).toBe('pronto'));
    await fixture.whenStable();
    return fixture;
  }

  async function render() {
    repo = fakeStudyRepo();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'resumos/:id', children: [] }]),
        { provide: StudyRepository, useValue: repo },
        provideFakeAuth(fakeAuth(true)),
      ],
    });
    const fixture = await criar();
    const el = fixture.nativeElement as HTMLElement;
    const estavel = () => fixture.whenStable();
    const clicar = async (seletor: string) => {
      (el.querySelector(seletor) as HTMLElement).click();
      await estavel();
    };
    return { fixture, el, estavel, clicar };
  }

  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // sem armazenamento local no ambiente de teste
    }
  });

  it('mostra matérias, assuntos e resumos com contagens', async () => {
    const { el } = await render();
    const materias = [...el.querySelectorAll('.nome-materia')].map((e) => e.textContent?.trim());
    expect(materias).toEqual(['Adm', 'Const']);
    expect(el.querySelector('.nome-assunto')?.textContent?.trim()).toBe('Atos');
    expect(el.querySelector('.linha-resumo .meta')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '4 trechos · 21 itens',
    );
    expect(el.querySelector('.linha-materia .tag')?.textContent?.trim()).toBe('1 assunto');
    expect(el.querySelector('.linha-assunto .meta')?.textContent?.trim()).toBe('Próxima: hoje');
  });

  it('recolhe e expande a matéria', async () => {
    const { el, clicar } = await render();
    await clicar('.expandir');
    expect(el.querySelector('.nome-assunto')).toBeNull();
    expect(el.querySelector('.expandir')?.getAttribute('aria-expanded')).toBe('false');
    await clicar('.expandir');
    expect(el.querySelector('.nome-assunto')).toBeTruthy();
  });

  it('nova matéria abre o campo de renomear; Enter confirma', async () => {
    const { el, clicar, estavel } = await render();
    await clicar('.nova');
    const campo = el.querySelector('input.renomear') as HTMLInputElement;
    expect(campo.value).toBe('Nova matéria');
    expect(document.activeElement).toBe(campo);
    campo.value = 'Português';
    campo.dispatchEvent(new Event('input'));
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await estavel();
    expect(el.querySelector('input.renomear')).toBeNull();
    expect(repo.renameMateria).toHaveBeenCalledWith('nova1', 'Português');
    expect(repo.renameMateria).toHaveBeenCalledTimes(1);
  });

  it('Esc cancela o renomear', async () => {
    const { el, estavel } = await render();
    el.querySelector('.nome-materia')!.dispatchEvent(new MouseEvent('dblclick'));
    await estavel();
    const campo = el.querySelector('input.renomear') as HTMLInputElement;
    campo.value = 'Outro';
    campo.dispatchEvent(new Event('input'));
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await estavel();
    expect(el.querySelector('input.renomear')).toBeNull();
    expect(repo.renameMateria).not.toHaveBeenCalled();
  });

  it('sair do campo confirma', async () => {
    const { el, estavel } = await render();
    (el.querySelector('.linha-assunto .acao[title="Renomear"]') as HTMLElement).click();
    await estavel();
    const campo = el.querySelector('input.renomear') as HTMLInputElement;
    campo.value = 'Atos administrativos';
    campo.dispatchEvent(new Event('input'));
    campo.dispatchEvent(new Event('blur'));
    await estavel();
    expect(repo.renameAssunto).toHaveBeenCalledWith('a1', 'Atos administrativos');
  });

  it('cria assunto e resumo dentro do pai', async () => {
    const { clicar } = await render();
    await clicar('[aria-label="Novo assunto em Adm"]');
    expect(repo.createAssunto).toHaveBeenCalledWith('m1', 'Novo assunto', 1);
    await clicar('[aria-label="Novo resumo em Atos"]');
    expect(repo.createResumo).toHaveBeenCalledWith('a1', 'Novo resumo', 1, expect.any(Array));
  });

  it('excluir pede confirmação; cancelar não exclui', async () => {
    const { el, clicar, estavel } = await render();
    const confirm = TestBed.inject(ConfirmService);
    await clicar('[aria-label="Excluir Adm"]');
    expect(confirm.pending()).toMatchObject({
      title: 'Excluir matéria?',
      body: '“Adm” e tudo o que estiver dentro dela serão excluídos. Os trechos deixam de entrar na revisão.',
    });
    confirm.answer(false);
    await estavel();
    expect(repo.deleteMateria).not.toHaveBeenCalled();

    await clicar('[aria-label="Excluir Adm"]');
    confirm.answer(true);
    await vi.waitFor(() => expect(repo.deleteMateria).toHaveBeenCalledWith('m1'));
    await estavel();
    expect([...el.querySelectorAll('.nome-materia')].map((e) => e.textContent?.trim())).toEqual([
      'Const',
    ]);
    expect(TestBed.inject(ToastService).message()).toBe('Excluído.');
  });

  it('clicar no resumo abre o editor', async () => {
    const { el } = await render();
    const link = el.querySelector('.abrir-resumo') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/resumos/r1');
    link.click();
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/resumos/r1'));
  });

  it('sem matérias: mostra o convite e carrega exemplos', async () => {
    repo = fakeStudyRepo();
    repo.listMaterias.mockResolvedValue([]);
    repo.listAssuntos.mockResolvedValue([]);
    repo.listResumos.mockResolvedValue([]);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: StudyRepository, useValue: repo },
        provideFakeAuth(fakeAuth(true)),
      ],
    });
    const fixture = await criar();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Nenhuma matéria ainda.');
    (el.querySelector('.aviso .btn') as HTMLElement).click();
    await vi.waitFor(() => expect(repo.createMateria).toHaveBeenCalledTimes(3));
  });
});
