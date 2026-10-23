import { TestBed } from '@angular/core/testing';
import { ConfirmService } from '../../core/confirm.service';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  async function open() {
    const fixture = TestBed.createComponent(ConfirmDialog);
    const service = TestBed.inject(ConfirmService);
    const answer = service.ask({ title: 'Excluir resumo?', body: 'Some de vez.' });
    await fixture.whenStable();
    return { el: fixture.nativeElement as HTMLElement, answer };
  }

  it('mostra título e texto e foca em Cancelar', async () => {
    const { el } = await open();
    expect(el.querySelector('.dialog-title')?.textContent).toContain('Excluir resumo?');
    expect(el.querySelector('.dialog-body')?.textContent).toContain('Some de vez.');
    expect(document.activeElement?.textContent?.trim()).toBe('Cancelar');
  });

  it('clicar no fundo cancela', async () => {
    const { el, answer } = await open();
    (el.querySelector('.dialog-backdrop') as HTMLElement).click();
    expect(await answer).toBe(false);
  });

  it('Esc cancela', async () => {
    const { answer } = await open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(await answer).toBe(false);
  });

  it('o botão principal confirma', async () => {
    const { el, answer } = await open();
    (el.querySelector('.btn-primary') as HTMLElement).click();
    expect(await answer).toBe(true);
  });
});
