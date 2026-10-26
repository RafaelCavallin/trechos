import { DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BlockEditor } from '../../editor/block-editor';
import { provideRouter } from '@angular/router';
import { ConfirmService } from '../../core/confirm.service';
import { StudyStore } from '../../core/study-store';
import { ToastService } from '../../core/toast.service';
import { StudyRepository } from '../../data/study-repository';
import { ATOS_ADMINISTRATIVOS } from '../../domain/examples';
import { CONFIG_PADRAO } from '../../domain/types';
import { fakeAuth, fakeStudyRepo, provideFakeAuth } from '../../testing/fakes';
import { ATRASO_SALVAR_MS, SummaryEditor } from './summary-editor';

describe('SummaryEditor', () => {
  let repo: ReturnType<typeof fakeStudyRepo>;

  async function render(id = 'r1', ajustar?: (r: ReturnType<typeof fakeStudyRepo>) => void) {
    repo = fakeStudyRepo();
    ajustar?.(repo);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: StudyRepository, useValue: repo },
        provideFakeAuth(fakeAuth(true)),
      ],
    });
    const fixture = TestBed.createComponent(SummaryEditor);
    fixture.componentRef.setInput('id', id);
    const store = TestBed.inject(StudyStore);
    await vi.waitFor(() => expect(store.status()).toBe('pronto'));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const estavel = () => fixture.whenStable();
    const clicar = async (alvo: string | Element) => {
      const e = typeof alvo === 'string' ? el.querySelector(alvo) : alvo;
      if (!e) throw new Error(`não achei ${alvo}`);
      (e as HTMLElement).click();
      await estavel();
    };
    const botao = (texto: string, dentro: ParentNode = el) =>
      [...dentro.querySelectorAll('button')].find((b) => b.textContent?.trim() === texto)!;
    const blocos = () => store.resumos().find((r) => r.id === id)!.blocos;
    return { fixture, el, estavel, clicar, botao, blocos, store };
  }

  it('mostra caminho, título, totais, cabeçalhos e lista de trechos', async () => {
    const { el } = await render();
    expect(el.querySelector('.caminho')?.textContent?.replace(/\s+/g, '')).toBe(
      'Matérias›Adm›Atos',
    );
    expect(el.querySelector('h1')?.textContent).toBe('Atos');
    expect([...el.querySelectorAll('.tags .tag')].map((t) => t.textContent?.trim())).toEqual([
      '4 trechos',
      '21 itens verificáveis',
      '1 aviso',
    ]);
    expect(el.querySelectorAll('.cabecalho')).toHaveLength(4);
    expect(el.querySelectorAll('app-block-editor')).toHaveLength(17);
    expect(el.querySelectorAll('app-attachment')).toHaveLength(2);
    expect(el.querySelector('.aviso')?.textContent).toContain('Sem itens verificáveis');
    expect([...el.querySelectorAll('.item-trecho .rotulo')].map((e) => e.textContent)).toEqual([
      '1. Conceito e requisitos',
      '2. Atributos',
      '3. Extinção do ato',
      '4. Convalidação',
    ]);
  });

  describe('botão Preview', () => {
    const preview = (el: HTMLElement) =>
      [...el.querySelectorAll('a')].find((a) => a.textContent?.trim() === 'Preview')!;

    it('sem bloco selecionado, abre o preview do resumo desde o começo', async () => {
      const { el } = await render();
      expect(preview(el).getAttribute('href')).toBe('/resumos/r1/preview');
    });

    it('com um bloco selecionado, abre no trecho desse bloco', async () => {
      const { el, clicar } = await render();
      await clicar(el.querySelectorAll('.area-bloco')[5]);
      expect(preview(el).getAttribute('href')).toBe('/resumos/r1/preview?trecho=b5');
    });
  });

  it('Ocultar e Negrito sem seleção avisam', async () => {
    const { botao, clicar } = await render();
    await clicar(botao('Ocultar'));
    expect(TestBed.inject(ToastService).message()).toBe(
      'Selecione um texto do resumo para ocultar como lacuna.',
    );
    await clicar('[aria-label="Negrito"]');
    expect(TestBed.inject(ToastService).message()).toBe('Selecione um texto para aplicar negrito.');
  });

  describe('desocultar e ajustar lacuna', () => {
    async function comBlocoFocado() {
      const tela = await render();
      const [, bloco, outro] = tela.fixture.debugElement.queryAll(By.directive(BlockEditor));
      bloco.triggerEventHandler('focou');
      await tela.estavel();
      const avisar = async (alvo: DebugElement, naLacuna: boolean) => {
        alvo.triggerEventHandler('lacunaNoCursor', naLacuna);
        await tela.estavel();
      };
      const toolbar = tela.el.querySelector('[role="toolbar"]')!;
      const textoDoBotao = () => (tela.botao('Desocultar', toolbar) ? 'Desocultar' : 'Ocultar');
      return { ...tela, bloco, outro, avisar, textoDoBotao };
    }

    it('com o cursor numa lacuna, o botão Ocultar vira Desocultar', async () => {
      const { bloco, avisar, textoDoBotao } = await comBlocoFocado();
      await avisar(bloco, true);
      expect(textoDoBotao()).toBe('Desocultar');
    });

    it('quando o cursor sai da lacuna, o botão volta a ser Ocultar', async () => {
      const { bloco, avisar, textoDoBotao } = await comBlocoFocado();
      await avisar(bloco, true);
      await avisar(bloco, false);
      expect(textoDoBotao()).toBe('Ocultar');
    });

    it('aviso de um bloco que não está em edição não muda o botão', async () => {
      const { outro, avisar, textoDoBotao } = await comBlocoFocado();
      await avisar(outro, true);
      expect(textoDoBotao()).toBe('Ocultar');
    });

    it.each([
      ['desfeita', 'Lacuna desfeita: “formação”'],
      ['ajustada', 'Lacuna ajustada: “formação”'],
      ['ok', 'Lacuna criada: “formação”'],
    ] as const)('resultado %s mostra o aviso certo', async (status, mensagem) => {
      const { bloco, botao, clicar } = await comBlocoFocado();
      const editor = bloco.componentInstance as BlockEditor;
      vi.spyOn(editor, 'ocultar').mockReturnValue({ status, texto: 'formação', id: 'g1' });
      await clicar(botao('Ocultar'));
      expect(TestBed.inject(ToastService).message()).toBe(mensagem);
    });
  });

  describe('Sigla', () => {
    const ALVO = { from: 1, to: 4, texto: 'Ato', nota: '' };

    async function comBlocoFocado() {
      const tela = await render();
      const [, bloco] = tela.fixture.debugElement.queryAll(By.directive(BlockEditor));
      bloco.triggerEventHandler('focou');
      await tela.estavel();
      const editor = bloco.componentInstance as BlockEditor;
      const formulario = () => tela.el.querySelector('app-sigla-form');
      const mensagem = () => TestBed.inject(ToastService).message();
      return { ...tela, editor, formulario, mensagem };
    }

    it('sem seleção, avisa e não abre o formulário', async () => {
      const { botao, clicar, el } = await render();
      await clicar(botao('Sigla'));
      expect([el.querySelector('app-sigla-form'), TestBed.inject(ToastService).message()]).toEqual([
        null,
        'Selecione um texto, como uma sigla, para explicar o que ele significa.',
      ]);
    });

    it('com texto selecionado, abre o formulário com o texto e o significado atual', async () => {
      const { editor, botao, clicar, formulario } = await comBlocoFocado();
      vi.spyOn(editor, 'sigla').mockReturnValue({ ...ALVO, nota: 'Ato da Administração' });
      await clicar(botao('Sigla'));
      expect(formulario()?.querySelector('label')?.textContent?.trim()).toBe(
        'Significado de “Ato”',
      );
      expect(formulario()?.querySelector('input')?.value).toBe('Ato da Administração');
    });

    it('salvar grava o significado no bloco, fecha o formulário e avisa', async () => {
      const { editor, botao, clicar, el, estavel, formulario, mensagem } = await comBlocoFocado();
      vi.spyOn(editor, 'sigla').mockReturnValue(ALVO);
      const marcar = vi
        .spyOn(editor, 'marcarSigla')
        .mockReturnValue({ status: 'ok', texto: 'Ato' });
      await clicar(botao('Sigla'));
      const campo = el.querySelector<HTMLInputElement>('app-sigla-form input')!;
      campo.value = 'Ato administrativo';
      campo.dispatchEvent(new Event('input'));
      await estavel();
      await clicar(botao('Salvar'));
      expect(marcar).toHaveBeenCalledWith('Ato administrativo');
      expect([formulario(), mensagem()]).toEqual([null, 'Significado salvo: “Ato”']);
    });

    it('cancelar fecha o formulário e devolve o foco ao bloco sem mudar nada', async () => {
      const { editor, botao, clicar, formulario } = await comBlocoFocado();
      vi.spyOn(editor, 'sigla').mockReturnValue(ALVO);
      const marcar = vi.spyOn(editor, 'marcarSigla');
      const foco = vi.spyOn(editor, 'voltarFoco');
      await clicar(botao('Sigla'));
      await clicar(botao('Cancelar'));
      expect([formulario(), marcar.mock.calls.length, foco.mock.calls.length]).toEqual([
        null,
        0,
        1,
      ]);
    });
  });

  it('inserir bloco: entra depois do selecionado e é salvo depois de uma pausa', async () => {
    const { el, botao, clicar, blocos } = await render();
    await clicar(el.querySelectorAll('.area-bloco')[1]);
    await clicar(botao('Citação'));
    expect(blocos()[2]).toMatchObject({ type: 'quote' });
    expect(el.querySelector('.salvamento')?.textContent?.trim()).toBe('Salvando…');
    await vi.waitFor(() => expect(repo.saveBlocos).toHaveBeenCalledWith('r1', blocos()), {
      timeout: ATRASO_SALVAR_MS + 1000,
    });
  });

  it('pergunta na margem: exige o texto da pergunta', async () => {
    const { el, botao, clicar, estavel, blocos } = await render();
    await clicar(el.querySelectorAll('.area-bloco')[1]);
    await clicar(botao('+ Pergunta na margem'));
    const salvar = botao('Salvar');
    expect(salvar.disabled).toBe(true);
    const [q, a] = [...el.querySelectorAll<HTMLInputElement>('app-question-form input')];
    q.value = 'O que é ato?';
    q.dispatchEvent(new Event('input'));
    a.value = 'Manifestação';
    a.dispatchEvent(new Event('input'));
    await estavel();
    await clicar(salvar);
    expect(blocos()[1].qs).toEqual([
      expect.objectContaining({ q: 'O que é ato?', a: 'Manifestação' }),
    ]);
    expect(TestBed.inject(ToastService).message()).toBe(
      'Pergunta adicionada à margem — conta como item verificável.',
    );
    await clicar(el.querySelector('[aria-label="Remover pergunta"]')!);
    expect(blocos()[1].qs).toEqual([]);
  });

  describe('editar pergunta na margem', () => {
    const PERGUNTA = { id: 'q-1', q: 'O que é ato?', a: 'Manifestação' };

    async function renderComPergunta() {
      const blocos = ATOS_ADMINISTRATIVOS.map((b, i) => (i === 1 ? { ...b, qs: [PERGUNTA] } : b));
      const tela = await render('r1', (r) =>
        r.listResumos.mockResolvedValue([
          { id: 'r1', assuntoId: 'a1', titulo: 'Atos', ordem: 0, blocos },
        ]),
      );
      await tela.clicar('[aria-label="Editar pergunta"]');
      const [q, a] = [...tela.el.querySelectorAll<HTMLInputElement>('app-question-form input')];
      return { ...tela, q, a };
    }

    it('abre o formulário no lugar da pergunta, já preenchido', async () => {
      const { el, q, a } = await renderComPergunta();
      expect([q.value, a.value]).toEqual(['O que é ato?', 'Manifestação']);
      const textos = [...el.querySelectorAll('.pergunta .q')].map((e) => e.textContent);
      expect(textos).not.toContain('O que é ato?');
    });

    it('salvar troca o texto e mantém o id da pergunta', async () => {
      const { q, botao, clicar, estavel, blocos } = await renderComPergunta();
      q.value = 'O que é ato administrativo?';
      q.dispatchEvent(new Event('input'));
      await estavel();
      await clicar(botao('Salvar'));
      expect(blocos()[1].qs).toEqual([{ ...PERGUNTA, q: 'O que é ato administrativo?' }]);
    });

    it('cancelar mantém a pergunta como estava', async () => {
      const { el, botao, clicar, blocos } = await renderComPergunta();
      await clicar(botao('Cancelar'));
      expect(blocos()[1].qs).toEqual([PERGUNTA]);
      expect(el.querySelector('.pergunta .q')?.textContent).toBe('O que é ato?');
    });
  });

  it('juntar ao anterior e separar', async () => {
    const { el, botao, clicar } = await render();
    await clicar(botao('Juntar ao anterior'));
    expect(el.querySelector('.tags .tag')?.textContent?.trim()).toBe('3 trechos');
    expect(el.querySelector('.juntado')?.textContent).toContain('Juntado ao trecho anterior');
    await clicar(botao('Separar'));
    expect(el.querySelector('.tags .tag')?.textContent?.trim()).toBe('4 trechos');
  });

  it('subir, descer e excluir bloco (com confirmação)', async () => {
    const { el, botao, clicar, blocos } = await render();
    await clicar(el.querySelectorAll('.area-bloco')[2]);
    await clicar(botao('Subir'));
    expect(
      blocos()
        .map((b) => b.id)
        .slice(0, 3),
    ).toEqual(['b1', 'b3', 'b2']);
    await clicar(botao('Descer'));
    expect(
      blocos()
        .map((b) => b.id)
        .slice(0, 3),
    ).toEqual(['b1', 'b2', 'b3']);
    await clicar(botao('Excluir bloco'));
    TestBed.inject(ConfirmService).answer(true);
    await vi.waitFor(() => expect(blocos().some((b) => b.id === 'b3')).toBe(false));
  });

  it('dividir pelos subtítulos herda o estado salvo do trecho', async () => {
    // Limite baixo para o aviso aparecer; estado salvo no trecho "Extinção do ato".
    const { el, botao, clicar } = await render('r1', (r) => {
      r.getConfiguracoes.mockResolvedValue({ ...CONFIG_PADRAO, limitePalavras: 10 });
      r.listEstados.mockResolvedValue([
        { key: 'r1:b8', S: 20, D: 4, due: new Date(), reps: 2, lapses: 0 },
      ]);
    });
    await clicar(botao('Dividir pelos subtítulos'));
    expect(el.querySelector('.tags .tag')?.textContent?.trim()).toBe('6 trechos');
    expect(repo.saveEstados).toHaveBeenLastCalledWith([
      expect.objectContaining({ key: 'r1:b9', S: 20 }),
      expect.objectContaining({ key: 'r1:b12', S: 20 }),
    ]);
  });

  it('resumo inexistente', async () => {
    const { el } = await render('nao-existe');
    expect(el.textContent).toContain('Resumo não encontrado.');
  });
});
