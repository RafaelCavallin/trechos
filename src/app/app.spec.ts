import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { StudyRepository } from './data/study-repository';
import { fakeAuth, fakeStudyRepo, provideFakeAuth, provideFakeQueue } from './testing/fakes';

describe('App', () => {
  async function abrir(logado: boolean) {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideFakeAuth(fakeAuth(logado)),
        provideFakeQueue(),
        { provide: StudyRepository, useValue: fakeStudyRepo() },
      ],
    });
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');
    await fixture.whenStable();
    return { el: fixture.nativeElement as HTMLElement, router };
  }

  it('logado: mostra a barra lateral e a área principal', async () => {
    const { el, router } = await abrir(true);
    expect(router.url).toBe('/');
    expect(el.querySelector('app-sidebar')).toBeTruthy();
    expect(el.querySelector('main#conteudo')).toBeTruthy();
  });

  it('sem login: vai para a tela de entrar, sem barra lateral', async () => {
    const { el, router } = await abrir(false);
    expect(router.url).toBe('/entrar');
    expect(el.querySelector('app-sidebar')).toBeNull();
    expect(el.querySelector('app-login')).toBeTruthy();
  });
});
