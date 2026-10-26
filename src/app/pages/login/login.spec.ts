import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { fakeAuth, provideFakeAuth } from '../../testing/fakes';
import { Login } from './login';

describe('Login', () => {
  let auth: ReturnType<typeof fakeAuth>;

  async function render() {
    auth = fakeAuth(false);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideFakeAuth(auth)],
    });
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const preencher = async (email: string, senha: string, nome?: string) => {
      const campos = [
        ['#email', email],
        ['#senha', senha],
      ];
      if (nome !== undefined) campos.push(['#nome', nome]);
      for (const [sel, v] of campos) {
        const input = el.querySelector(sel) as HTMLInputElement;
        input.value = v;
        input.dispatchEvent(new Event('input'));
      }
      await fixture.whenStable();
    };
    const enviar = async () => {
      el.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };
    return { fixture, el, preencher, enviar };
  }

  it('entra com e-mail e senha e vai para o início', async () => {
    const { preencher, enviar } = await render();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await preencher(' eu@exemplo.com ', 'segredo1');
    await enviar();
    expect(auth.signIn).toHaveBeenCalledWith('eu@exemplo.com', 'segredo1');
    expect(navegar).toHaveBeenCalledWith('/');
  });

  it('alterna para criar conta', async () => {
    const { el, fixture, preencher, enviar } = await render();
    (el.querySelector('.alternar') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(el.querySelector('h1')?.textContent).toContain('Criar conta');
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await preencher(' novo@exemplo.com ', 'segredo1', 'Ana');
    await enviar();
    expect(auth.signUp).toHaveBeenCalledWith({
      nome: 'Ana',
      email: 'novo@exemplo.com',
      senha: 'segredo1',
    });
  });

  it('o campo Nome só aparece ao criar conta', async () => {
    const { el, fixture } = await render();
    const antes = el.querySelector('#nome');
    (el.querySelector('.alternar') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect([antes, el.querySelector('label[for="nome"]')?.textContent]).toEqual([null, 'Nome']);
  });

  it('mostra o erro do login', async () => {
    const { el, fixture, preencher, enviar } = await render();
    auth.signIn.mockRejectedValue(new Error('E-mail ou senha incorretos.'));
    await preencher('eu@exemplo.com', 'errada');
    await enviar();
    await fixture.whenStable();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'E-mail ou senha incorretos.',
    );
  });
});
