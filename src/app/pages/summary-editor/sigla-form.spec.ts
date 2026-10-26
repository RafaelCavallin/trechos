import { TestBed } from '@angular/core/testing';
import { SiglaForm } from './sigla-form';

describe('SiglaForm', () => {
  async function render(inicial = '') {
    const fixture = TestBed.createComponent(SiglaForm);
    fixture.componentRef.setInput('texto', 'STF');
    fixture.componentRef.setInput('inicial', inicial);
    const salvas: string[] = [];
    let cancelou = false;
    fixture.componentInstance.salvar.subscribe((n) => salvas.push(n));
    fixture.componentInstance.cancelar.subscribe(() => (cancelou = true));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const campo = el.querySelector('input')!;
    const botao = (texto: string) =>
      [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === texto);
    const digitar = async (valor: string) => {
      campo.value = valor;
      campo.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    const enviar = async () => {
      el.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };
    return { el, campo, botao, digitar, enviar, salvas, cancelou: () => cancelou };
  }

  it('mostra o texto selecionado no rótulo do campo', async () => {
    const { el } = await render();
    expect(el.querySelector('label')?.textContent?.trim()).toBe('Significado de “STF”');
  });

  it('sigla nova: Salvar começa desabilitado e não há Remover', async () => {
    const { botao } = await render();
    expect([botao('Salvar')?.disabled, botao('Remover')]).toEqual([true, undefined]);
  });

  it('salva o significado digitado', async () => {
    const { digitar, enviar, salvas } = await render();
    await digitar('Supremo Tribunal Federal');
    await enviar();
    expect(salvas).toEqual(['Supremo Tribunal Federal']);
  });

  it('não salva significado só com espaços', async () => {
    const { digitar, enviar, salvas } = await render();
    await digitar('   ');
    await enviar();
    expect(salvas).toEqual([]);
  });

  it('sigla existente: vem preenchida e Remover salva vazio', async () => {
    const { campo, botao, salvas } = await render('Supremo');
    botao('Remover')!.click();
    expect([campo.value, salvas]).toEqual(['Supremo', ['']]);
  });

  it('Esc cancela', async () => {
    const { campo, cancelou } = await render();
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(cancelou()).toBe(true);
  });
});
