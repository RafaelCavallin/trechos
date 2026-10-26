import { TestBed } from '@angular/core/testing';
import { Sigla } from './sigla';

const NOTA = 'Supremo Tribunal Federal';

describe('Sigla', () => {
  async function render(negrito = false) {
    const fixture = TestBed.createComponent(Sigla);
    fixture.componentRef.setInput('texto', 'STF');
    fixture.componentRef.setInput('nota', NOTA);
    fixture.componentRef.setInput('negrito', negrito);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const abbr = host.querySelector('abbr')!;
    const popup = () => document.querySelector<HTMLElement>('.sigla-nota');
    const disparar = async (alvo: Element, evento: Event) => {
      alvo.dispatchEvent(evento);
      await fixture.whenStable();
    };
    return { host, abbr, popup, disparar };
  }

  afterEach(() => document.querySelectorAll('.cdk-overlay-container').forEach((c) => c.remove()));

  it('mostra o texto sublinhado e descreve o significado para leitores de tela', async () => {
    const { abbr, host } = await render();
    const descricao = host.querySelector(`#${abbr.getAttribute('aria-describedby')}`);
    expect([abbr.textContent, abbr.tabIndex, descricao?.textContent]).toEqual(['STF', 0, NOTA]);
  });

  it('fechado, não mostra o popup', async () => {
    const { popup } = await render();
    expect(popup()).toBeNull();
  });

  it('ao passar o mouse, abre o popup com o significado', async () => {
    const { host, popup, disparar } = await render();
    await disparar(host, new MouseEvent('mouseenter'));
    expect(popup()?.textContent?.trim()).toBe(NOTA);
  });

  it('ao focar pelo teclado, abre o popup', async () => {
    const { abbr, popup, disparar } = await render();
    await disparar(abbr, new FocusEvent('focusin', { bubbles: true }));
    expect(popup()?.textContent?.trim()).toBe(NOTA);
  });

  it('Esc fecha o popup sem tirar o foco', async () => {
    const { abbr, host, popup, disparar } = await render();
    await disparar(host, new MouseEvent('mouseenter'));
    await disparar(abbr, new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(popup()).toBeNull();
  });

  it('ao tirar o mouse, fecha o popup', async () => {
    const { host, popup, disparar } = await render();
    await disparar(host, new MouseEvent('mouseenter'));
    await disparar(host, new MouseEvent('mouseleave', { relatedTarget: document.body }));
    expect(popup()).toBeNull();
  });

  it('levar o mouse da sigla até o popup não o fecha', async () => {
    const { host, popup, disparar } = await render();
    await disparar(host, new MouseEvent('mouseenter'));
    await disparar(host, new MouseEvent('mouseleave', { relatedTarget: popup() }));
    expect(popup()?.textContent?.trim()).toBe(NOTA);
  });

  it('ao sair do popup para fora, fecha', async () => {
    const { host, popup, disparar } = await render();
    await disparar(host, new MouseEvent('mouseenter'));
    await disparar(popup()!, new MouseEvent('mouseleave', { relatedTarget: document.body }));
    expect(popup()).toBeNull();
  });

  it('em negrito, a sigla fica em negrito', async () => {
    const { abbr } = await render(true);
    expect(abbr.classList.contains('negrito')).toBe(true);
  });
});
