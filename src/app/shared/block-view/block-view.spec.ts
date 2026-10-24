import { TestBed } from '@angular/core/testing';
import { StudyStore } from '../../core/study-store';
import { ATOS_ADMINISTRATIVOS } from '../../domain/examples';
import { Bloco, BlocoRevisao } from '../../domain/types';
import { BlockView, VisualLacuna } from './block-view';

const bloco = (id: string) => ATOS_ADMINISTRATIVOS.find((b) => b.id === id) as Bloco;

describe('BlockView', () => {
  async function render(b: BlocoRevisao, lacuna?: (s: { id: string }) => VisualLacuna) {
    TestBed.configureTestingModule({
      providers: [
        { provide: StudyStore, useValue: { anexoUrl: vi.fn().mockResolvedValue('blob:x') } },
      ],
    });
    const fixture = TestBed.createComponent(BlockView);
    fixture.componentRef.setInput('bloco', b);
    if (lacuna) fixture.componentRef.setInput('lacuna', lacuna);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('parágrafo com lacunas no estado do editor', async () => {
    const { el } = await render(bloco('b2'));
    const lacunas = [...el.querySelectorAll('.lacuna')];
    expect(lacunas.map((l) => [l.textContent?.trim(), l.getAttribute('data-estado')])).toEqual([
      ['manifestação unilateral de vontade', 'editor'],
      ['efeitos jurídicos imediatos', 'editor'],
    ]);
    expect(el.querySelector('p.bloco')?.textContent).toContain('Ato administrativo é a');
  });

  it('lacunas ocultas mostram só o número', async () => {
    const { el } = await render(bloco('b2'), (s) => ({
      estado: 'oculta',
      numero: s.id === 'g1' ? 1 : 2,
    }));
    expect([...el.querySelectorAll('.lacuna')].map((l) => l.textContent?.trim())).toEqual([
      '1',
      '2',
    ]);
    expect(el.querySelector('.lacuna')?.getAttribute('aria-label')).toBe('Lacuna 1');
  });

  it('lacuna clicável emite o id', async () => {
    const { fixture, el } = await render(bloco('b2'), () => ({
      estado: 'revelada',
      clicavel: true,
    }));
    const clicadas: string[] = [];
    fixture.componentInstance.lacunaClicada.subscribe((id) => clicadas.push(id));
    (el.querySelector('button.lacuna') as HTMLButtonElement).click();
    expect(clicadas).toEqual(['g1']);
  });

  it('lacuna dinâmica e negrito', async () => {
    const b: BlocoRevisao = {
      id: 'x',
      type: 'p',
      segs: [
        { k: 't', t: 'Forte', b: true },
        { k: 'd', id: 'd:x', t: 'dinâmica' },
      ],
    };
    const { el } = await render(b, (s) => ({
      estado: s.id.startsWith('d:') ? 'oculta-dinamica' : 'oculta',
      numero: 3,
    }));
    expect(el.querySelector('strong')?.textContent).toBe('Forte');
    expect(el.querySelector('.lacuna')?.getAttribute('data-estado')).toBe('oculta-dinamica');
  });

  it('tabela com cabeçalho, lista, citação, especial e anexo', async () => {
    let r = await render(bloco('b6'));
    expect(r.el.querySelectorAll('th')).toHaveLength(2);
    expect(r.el.querySelectorAll('tbody tr')).toHaveLength(4);
    TestBed.resetTestingModule();
    r = await render(bloco('b3'));
    expect(r.el.querySelectorAll('li')).toHaveLength(4);
    TestBed.resetTestingModule();
    r = await render(bloco('b4'));
    expect(r.el.querySelector('.rotulo')?.textContent).toBe('Pegadinha da banca');
    TestBed.resetTestingModule();
    r = await render(bloco('b11'));
    expect(r.el.querySelector('blockquote.bloco-quote')).toBeTruthy();
    TestBed.resetTestingModule();
    r = await render(bloco('b19'));
    expect(r.el.querySelector('.chip')?.textContent).toContain('Lei 9.784-99');
  });
});
