import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { fakeAuth, provideFakeAuth, provideFakeQueue } from '../../testing/fakes';
import { Sidebar } from './sidebar';

@Component({ template: '' })
class Blank {}

describe('Sidebar', () => {
  const dueCount = signal(0);
  let auth: ReturnType<typeof fakeAuth>;

  beforeEach(() => {
    dueCount.set(0);
    auth = fakeAuth();
    TestBed.configureTestingModule({
      providers: [
        provideFakeAuth(auth),
        provideFakeQueue(dueCount),
        provideRouter([
          { path: 'entrar', component: Blank },
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
    const fixture = TestBed.createComponent(Sidebar);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.badge')).toBeNull();
    dueCount.set(5);
    await fixture.whenStable();
    expect(el.querySelector('.badge')?.textContent).toContain('5');
  });

  it('Sair encerra a sessão e volta para a tela de entrar', async () => {
    const el = await renderAt('/');
    (el.querySelector('.sair') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/entrar'));
    expect(auth.signOut).toHaveBeenCalled();
  });
});
