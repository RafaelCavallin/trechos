import { TestBed } from '@angular/core/testing';
import { QuestionForm, RascunhoPergunta } from './question-form';

describe('QuestionForm', () => {
  async function render(inicial?: RascunhoPergunta) {
    const fixture = TestBed.createComponent(QuestionForm);
    if (inicial) fixture.componentRef.setInput('inicial', inicial);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const [q, a] = [...el.querySelectorAll<HTMLInputElement>('input')];
    const botao = (texto: string) =>
      [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === texto)!;
    const salvos: RascunhoPergunta[] = [];
    let cancelou = 0;
    fixture.componentInstance.salvar.subscribe((r) => salvos.push(r));
    fixture.componentInstance.cancelar.subscribe(() => cancelou++);
    const digitar = async (campo: HTMLInputElement, texto: string) => {
      campo.value = texto;
      campo.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    return { el, q, a, botao, salvos, cancelou: () => cancelou, digitar };
  }

  it('sem rascunho, começa vazio e com Salvar desabilitado', async () => {
    const { q, a, botao } = await render();
    expect([q.value, a.value, botao('Salvar').disabled]).toEqual(['', '', true]);
  });

  it('com rascunho, começa preenchido com a pergunta e a resposta', async () => {
    const { q, a } = await render({ q: 'Qual o prazo?', a: '5 anos' });
    expect([q.value, a.value]).toEqual(['Qual o prazo?', '5 anos']);
  });

  it('pergunta só com espaços mantém Salvar desabilitado', async () => {
    const { q, botao, digitar } = await render();
    await digitar(q, '   ');
    expect(botao('Salvar').disabled).toBe(true);
  });

  it('Salvar envia a pergunta e a resposta digitadas', async () => {
    const { q, a, botao, salvos, digitar } = await render({ q: 'Qual o prazo?', a: '' });
    await digitar(q, 'Qual o prazo decadencial?');
    await digitar(a, '5 anos');
    botao('Salvar').click();
    expect(salvos).toEqual([{ q: 'Qual o prazo decadencial?', a: '5 anos' }]);
  });

  it('Cancelar avisa sem salvar', async () => {
    const { botao, salvos, cancelou } = await render({ q: 'Qual o prazo?', a: '' });
    botao('Cancelar').click();
    expect([cancelou(), salvos.length]).toEqual([1, 0]);
  });

  it('Esc cancela', async () => {
    const { el, cancelou } = await render();
    el.querySelector('form')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(cancelou()).toBe(1);
  });
});
