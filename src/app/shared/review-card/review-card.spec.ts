import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StudyStore } from '../../core/study-store';
import { StudyRepository } from '../../data/study-repository';
import { ATOS_ADMINISTRATIVOS } from '../../domain/examples';
import { ID } from '../../domain/types';
import { CONTROLE_REVISAO, ControleRevisao } from '../../review/controle-revisao';
import { sessaoNoTrecho } from '../../review/fila-preview';
import * as S from '../../review/session';
import { trechoEmRevisao } from '../../review/trecho-em-revisao';
import { fakeAuth, fakeStudyRepo, provideFakeAuth } from '../../testing/fakes';
import { ReviewCard } from './review-card';

const entrada = (trechoId: string, modo: S.EntradaFila['modo']): S.EntradaFila => ({
  key: `r1:${trechoId}`,
  resumoId: 'r1',
  trechoId,
  materiaId: 'm1',
  assuntoId: 'a1',
  modo,
});

function controleFalso(fila: S.EntradaFila[]) {
  const sessao = signal<S.Sessao | null>(sessaoNoTrecho(fila, 0));
  const mudar = (f: (s: S.Sessao) => S.Sessao) => sessao.update((s) => (s ? f(s) : s));
  const atual = computed(() => {
    const s = sessao();
    if (!s || s.concluida) return null;
    const resumos = [
      { id: 'r1', assuntoId: 'a1', titulo: 'Atos', ordem: 0, blocos: ATOS_ADMINISTRATIVOS },
    ];
    const materias = [{ id: 'm1', nome: 'Adm', ordem: 0 }];
    return trechoEmRevisao({
      entrada: s.fila[s.indice],
      resumos,
      assuntos: [],
      materias,
      densidade: 'média',
    });
  });
  const controle = {
    sessao,
    atual,
    todosMarcados: signal(false),
    revelar: vi.fn(() => mudar(S.revelar)),
    marcar: vi.fn((id: ID, acertou: boolean) => mudar((s) => S.marcar(s, id, acertou))),
    alternar: vi.fn((id: ID) => mudar((s) => S.alternar(s, id))),
    marcarRestantes: vi.fn(),
    setRecall: vi.fn((texto: string) => mudar((s) => ({ ...s, recall: texto }))),
    calcularNota: vi.fn().mockResolvedValue(undefined),
    proximo: vi.fn(() => mudar(S.proximo)),
  } satisfies ControleRevisao;
  return controle;
}

describe('ReviewCard', () => {
  async function render(fila: S.EntradaFila[], rotuloFim?: string) {
    const controle = controleFalso(fila);
    TestBed.configureTestingModule({
      providers: [
        { provide: StudyRepository, useValue: fakeStudyRepo() },
        provideFakeAuth(fakeAuth(false)),
        { provide: CONTROLE_REVISAO, useValue: controle },
      ],
    });
    TestBed.inject(StudyStore);
    const fixture = TestBed.createComponent(ReviewCard);
    if (rotuloFim) fixture.componentRef.setInput('rotuloFim', rotuloFim);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const estavel = () => fixture.whenStable();
    const botao = (texto: string) =>
      [...el.querySelectorAll('button')].find((b) => b.textContent?.trim().endsWith(texto));
    const tecla = async (key: string) => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
      await estavel();
    };
    return { controle, el, estavel, botao, tecla };
  }

  it('mostra o trecho com as lacunas ocultas e numeradas e o formato', async () => {
    const { el } = await render([entrada('b1', 'lacunas')]);
    const etiquetas = [...el.querySelectorAll('.etiquetas .tag')].map((t) => t.textContent?.trim());
    expect(etiquetas).toEqual(['Adm', 'Com lacunas']);
    const pilulas = [...el.querySelectorAll('.cartao .lacuna')].slice(0, 2);
    expect(pilulas.map((p) => p.textContent?.trim())).toEqual(['1', '2']);
  });

  it('Espaço revela e 2 marca o item em foco como erro, andando o foco', async () => {
    const { el, controle, tecla } = await render([entrada('b1', 'lacunas')]);
    await tecla(' ');
    await tecla('2');
    const primeiro = controle.atual()!.itens[0].id;
    expect(controle.marcar).toHaveBeenCalledWith(primeiro, false);
    expect(el.querySelectorAll('.item')[1].classList).toContain('focado');
  });

  it('↓ e ↑ mudam o item em foco sem passar das pontas', async () => {
    const { el, tecla } = await render([entrada('b1', 'lacunas')]);
    const focado = () =>
      [...el.querySelectorAll('.item')].findIndex((i) => i.classList.contains('focado'));
    await tecla(' ');
    await tecla('ArrowUp');
    expect(focado()).toBe(0);
    await tecla('ArrowDown');
    await tecla('ArrowDown');
    expect(focado()).toBe(2);
  });

  it('os botões do painel marcam acerto e erro do item', async () => {
    const { el, controle, botao, estavel } = await render([entrada('b1', 'lacunas')]);
    botao('Revelar')!.click();
    await estavel();
    const primeiro = controle.atual()!.itens[0].id;
    (el.querySelector('[aria-label="Errei o item 2"]') as HTMLButtonElement).click();
    (el.querySelector('[aria-label="Acertei o item 1"]') as HTMLButtonElement).click();
    await estavel();
    expect(controle.marcar).toHaveBeenCalledWith(primeiro, true);
    expect(el.querySelector('.item')?.getAttribute('data-marca')).toBe('acertou');
    expect(el.querySelectorAll('.item')[1].getAttribute('data-marca')).toBe('errou');
  });

  it('não reage às teclas quando o foco está num campo de texto', async () => {
    const { el, controle } = await render([entrada('b1', 'titulo')]);
    const campo = el.querySelector('textarea')!;
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(controle.revelar).not.toHaveBeenCalled();
  });

  it('no formato "Só o título", guarda o que foi escrito e mostra depois de revelar', async () => {
    const { el, botao, estavel } = await render([entrada('b1', 'titulo')]);
    const campo = el.querySelector('textarea')!;
    campo.value = 'manifestação de vontade';
    campo.dispatchEvent(new Event('input'));
    botao('Revelar')!.click();
    await estavel();
    expect(el.querySelector('.escrito .texto')?.textContent).toBe('manifestação de vontade');
  });

  it('no formato "Só perguntas", mostra a pergunta e, revelada, a resposta clicável', async () => {
    const { el, botao, estavel, controle } = await render([entrada('b5', 'perguntas')]);
    expect(el.querySelector('.perguntas .q')?.textContent).toBe(
      'Qual atributo dispensa ordem judicial?',
    );
    botao('Revelar')!.click();
    await estavel();
    (el.querySelector('.resposta') as HTMLButtonElement).click();
    await estavel();
    expect(controle.alternar).toHaveBeenCalledWith('q2');
    expect(el.querySelector('.resposta')?.getAttribute('data-marca')).toBe('acertou');
  });

  it('com a nota, o botão do último trecho usa o rótulo de fim informado', async () => {
    const { controle, botao, estavel } = await render(
      [entrada('b5', 'perguntas')],
      'Concluir preview',
    );
    controle.sessao.update((s) =>
      S.registrarResultado(S.revelar(s!), {
        key: 'r1:b5',
        titulo: 'Atributos',
        materiaId: 'm1',
        total: 1,
        acertos: 1,
        pct: 100,
        nota: 'Easy',
        due: new Date(2026, 9, 23),
        erradas: [],
      }),
    );
    await estavel();
    botao('Concluir preview')!.click();
    expect(controle.proximo).toHaveBeenCalled();
  });

  it('trecho sem itens mostra o conteúdo e o aviso, sem revelar nem atalhos', async () => {
    const { el, botao, controle, tecla } = await render([entrada('b16', 'perguntas')]);
    expect(el.querySelector('h2')?.textContent).toBe('Convalidação');
    expect(el.querySelectorAll('.etiquetas .tag')[1].textContent?.trim()).toBe('Sem itens');
    expect(el.querySelector('.blocos')?.textContent).toContain('suprimento do vício');
    expect(botao('Revelar')).toBeUndefined();
    await tecla(' ');
    expect(controle.revelar).not.toHaveBeenCalled();
    botao('Próximo trecho')!.click();
    expect(controle.proximo).toHaveBeenCalled();
  });

  it('trecho que sumiu mostra o aviso e deixa seguir', async () => {
    const { el, botao, controle } = await render([entrada('sumiu', 'lacunas')]);
    expect(el.querySelector('h2')?.textContent).toBe('Trecho não encontrado');
    botao('Próximo trecho')!.click();
    expect(controle.proximo).toHaveBeenCalled();
  });
});
