import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ReviewQueueService } from '../../core/review-queue.service';
import { Sidebar } from './sidebar';

@Component({ template: '' })
class Blank {}

describe('Sidebar', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Blank },
          { path: 'materias', component: Blank },
          { path: 'resumos/:id', component: Blank },
        ]),
      ],
    });
  });

  async function renderAt(url: string) {
    const fixture = TestBed.createComponent(Sidebar);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const activeLabel = (el: HTMLElement) =>
    el.querySelector('[aria-current="page"] .nav-label')?.textContent?.trim();

  it('marca Início na raiz', async () => {
    expect(activeLabel(await renderAt('/'))).toBe('Início');
  });

  it('marca Matérias também dentro do editor de resumo', async () => {
    expect(activeLabel(await renderAt('/resumos/abc'))).toBe('Matérias');
  });

  it('mostra o badge da fila só quando há trechos', async () => {
    const queue = TestBed.inject(ReviewQueueService);
    const fixture = TestBed.createComponent(Sidebar);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.badge')).toBeNull();
    queue.dueCount.set(5);
    await fixture.whenStable();
    expect(el.querySelector('.badge')?.textContent).toContain('5');
  });
});
