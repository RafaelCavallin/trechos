import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { StudyStore } from '../../core/study-store';
import { StudyRepository } from '../../data/study-repository';
import { RegistroRevisao } from '../../domain/types';
import { ReviewSessionService } from '../../review/review-session.service';
import { fakeAuth, fakeStudyRepo, provideFakeAuth } from '../../testing/fakes';
import { Home } from './home';

const registro = (marcas: Record<string, boolean>, i: number): RegistroRevisao => ({
  id: `reg${i}`,
  trechoKey: 'r1:b5',
  data: new Date(2026, 9, 20 - i),
  modo: 'lacunas',
  total: 2,
  acertos: 0,
  pct: 0,
  nota: 'Again',
  marcas,
});

describe('Home', () => {
  async function render(ajustar?: (r: ReturnType<typeof fakeStudyRepo>) => void) {
    const repo = fakeStudyRepo();
    repo.listEstados.mockResolvedValue([]);
    ajustar?.(repo);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: StudyRepository, useValue: repo },
        provideFakeAuth(fakeAuth(true)),
      ],
    });
    const fixture = TestBed.createComponent(Home);
    await vi.waitFor(() => expect(TestBed.inject(StudyStore).status()).toBe('pronto'));
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('mostra a fila do dia por matéria e o botão de iniciar', async () => {
    const { el } = await render();
    expect(el.querySelector('h1')?.textContent).toBe('3 trechos para revisar hoje');
    expect(el.querySelector('.sub')?.textContent).toBe(
      'Cerca de 6 minutos, intercalando 1 matéria.',
    );
    expect(el.querySelector('.revisao .nome')?.textContent).toBe('Adm');
    expect(el.querySelector('.revisao .rotulo')?.textContent).toBe('3 trechos · ~6 min');
    expect(el.querySelector('.grande')?.textContent?.trim()).toBe('Iniciar sessão · ~6 min');
  });

  it('iniciar abre a sessão e vai para a Revisão', async () => {
    const { el, fixture } = await render();
    (el.querySelector('.grande') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(TestBed.inject(ReviewSessionService).sessao()?.fila).toHaveLength(3);
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/revisao'));
  });

  it('sem revisões: mensagens de vazio', async () => {
    const { el } = await render((r) => r.listResumos.mockResolvedValue([]));
    expect(el.querySelector('h1')?.textContent).toBe('Tudo revisado por hoje');
    expect(el.querySelector('.em-dia')).toBeTruthy();
    expect(el.textContent).toContain('Revise alguns trechos para ver a saúde');
    expect(el.textContent).toContain('Nenhum ponto fraco por enquanto');
  });

  it('pontos fracos e saúde com histórico de revisões', async () => {
    const { el } = await render((r) => {
      r.listRegistros.mockResolvedValue(
        [0, 1, 2].map((i) => registro({ g10: false, g8: i > 0 }, i)),
      );
      r.listEstados.mockResolvedValue([
        {
          key: 'r1:b5',
          S: 5,
          D: 5,
          due: new Date(),
          reps: 3,
          lapses: 0,
          lastReview: new Date(Date.now() - 864e5),
        },
      ]);
    });
    // g10 errada nas 3 revisões; g8 errada em 1 de 3.
    const fracos = [...el.querySelectorAll('.fraco')];
    expect(fracos).toHaveLength(2);
    expect(fracos[1].querySelector('.taxa')?.textContent).toBe('Errada em 1 de 3 revisões');
    expect(fracos[0].querySelector('.lacuna-fraca')?.textContent?.trim()).toBe(
      'Autoexecutoriedade',
    );
    expect(fracos[0].querySelector('.onde')?.textContent).toBe('Atributos · Adm');
    expect(fracos[0].querySelector('.taxa')?.textContent).toBe('Errada em 3 de 3 revisões');
    expect(fracos[0].getAttribute('href')).toBe('/resumos/r1');
    expect(el.querySelector('.saude .nome')?.textContent).toBe('Adm');
  });
});
