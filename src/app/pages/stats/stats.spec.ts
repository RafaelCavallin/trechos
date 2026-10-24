import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StudyStore } from '../../core/study-store';
import { StudyRepository } from '../../data/study-repository';
import { REMEDIOS_CONSTITUCIONAIS } from '../../domain/examples';
import { RegistroRevisao } from '../../domain/types';
import { fakeAuth, fakeStudyRepo, provideFakeAuth } from '../../testing/fakes';
import { Stats } from './stats';

const reg = (key: string, marcas: Record<string, boolean>, pct: number): RegistroRevisao => ({
  id: `${key}-${pct}`,
  trechoKey: key,
  data: new Date(),
  modo: 'lacunas',
  total: 2,
  acertos: 1,
  pct,
  nota: 'Hard',
  marcas,
});

describe('Stats', () => {
  async function render(comRevisoes: boolean) {
    const repo = fakeStudyRepo();
    repo.listResumos.mockResolvedValue([
      ...(await repo.listResumos()),
      { id: 'r2', assuntoId: 'a1', titulo: 'Remédios', ordem: 1, blocos: REMEDIOS_CONSTITUCIONAIS },
    ]);
    if (comRevisoes) {
      repo.listRegistros.mockResolvedValue([
        reg('r1:b1', { g1: false, g2: true }, 50),
        reg('r2:c1', { 'c-g1': false }, 0),
      ]);
    }
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: StudyRepository, useValue: repo },
        provideFakeAuth(fakeAuth(true)),
      ],
    });
    const fixture = TestBed.createComponent(Stats);
    await vi.waitFor(() => expect(TestBed.inject(StudyStore).status()).toBe('pronto'));
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('sem revisões: retenção vazia e convites', async () => {
    const { el } = await render(false);
    expect([...el.querySelectorAll('.nome-materia')].map((e) => e.textContent)).toEqual([
      'Adm',
      'Const',
    ]);
    expect([...el.querySelectorAll('.materia-topo .pct')].map((e) => e.textContent)).toEqual([
      '—',
      '—',
    ]);
    expect(el.textContent).toContain('Nenhuma revisão ainda.');
    expect(el.textContent).toContain('O mapa aparece depois');
  });

  it('histórico e mapa de calor do resumo escolhido', async () => {
    const { el, fixture } = await render(true);
    expect(el.querySelectorAll('.rolagem tbody tr')).toHaveLength(2);
    expect(el.querySelector('.rolagem tbody tr')?.textContent).toContain('Conceito e requisitos');

    const opcoes = [...el.querySelectorAll('.seg-opt')].map((o) => o.textContent?.trim());
    expect(opcoes).toEqual(['Atos', 'Remédios']);
    expect(el.querySelector('.tag-taxa')?.textContent).toBe('50% de erro nas lacunas');
    const g1 = el.querySelector('.mapa .lacuna[data-lacuna="g1"]')!;
    expect(g1.getAttribute('data-estado')).toBe('calor-3');
    expect(g1.getAttribute('title')).toBe('Errada em 1 de 1 revisões');
    expect(el.querySelector('.mapa .lacuna[data-lacuna="g2"]')?.getAttribute('data-estado')).toBe(
      'calor-0',
    );

    const remedios = el.querySelectorAll<HTMLInputElement>('.seg-opt input')[1];
    remedios.click();
    await fixture.whenStable();
    expect([...el.querySelectorAll('.tag-taxa')].map((t) => t.textContent)).toEqual([
      '100% de erro nas lacunas',
    ]);
  });
});
