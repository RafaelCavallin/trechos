import { TestBed } from '@angular/core/testing';
import { ATOS_ADMINISTRATIVOS } from '../domain/examples';
import { BlocoTexto, Segmento } from '../domain/types';
import { BlockEditor } from './block-editor';
import { BlocoDeTexto } from './doc-conversion';

const b2 = ATOS_ADMINISTRATIVOS.find((b) => b.id === 'b2') as BlocoTexto;

describe('BlockEditor', () => {
  async function render(bloco: BlocoDeTexto = b2, foco: 'inicio' | 'fim' | 'tudo' | null = null) {
    const fixture = TestBed.createComponent(BlockEditor);
    fixture.componentRef.setInput('bloco', bloco);
    fixture.componentRef.setInput('focoInicial', foco);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const pm = el.querySelector('.ProseMirror') as HTMLElement;
    const mudou: BlocoDeTexto[] = [];
    const dividir: { antes: Segmento[]; depois: Segmento[] }[] = [];
    let apagou = 0;
    fixture.componentInstance.mudou.subscribe((b) => mudou.push(b));
    fixture.componentInstance.dividir.subscribe((d) => dividir.push(d));
    fixture.componentInstance.apagarVazio.subscribe(() => apagou++);
    const tecla = (key: string) =>
      pm.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    return { fixture, el, pm, mudou, dividir, apagou: () => apagou, tecla };
  }

  it('mostra o conteúdo com as lacunas', async () => {
    const { el } = await render();
    expect(el.querySelectorAll('.lacuna')).toHaveLength(2);
    expect(el.querySelector('.ProseMirror')?.getAttribute('aria-label')).toBe('Parágrafo');
  });

  it('bloco especial mostra o rótulo', async () => {
    const { el } = await render(ATOS_ADMINISTRATIVOS.find((b) => b.id === 'b4') as BlocoDeTexto);
    expect(el.querySelector('.rotulo')?.textContent).toBe('Pegadinha da banca');
  });

  it('Enter no fim: o bloco fica igual e o resto vai vazio para um bloco novo', async () => {
    const { fixture, tecla, dividir } = await render(b2, 'fim');
    tecla('Enter');
    expect(dividir).toHaveLength(1);
    expect(dividir[0].antes).toEqual(b2.segs);
    expect(dividir[0].depois).toEqual([]);
    expect(fixture.componentInstance.temSelecao()).toBe(false);
  });

  it('Enter no começo: tudo vai para o bloco novo e sai deste na hora', async () => {
    const { tecla, dividir, mudou } = await render(b2, 'inicio');
    tecla('Enter');
    expect(dividir[0].antes).toEqual([]);
    expect(dividir[0].depois).toEqual(b2.segs);
    expect((mudou.at(-1) as BlocoTexto).segs).toEqual([]);
  });

  it('Backspace num bloco vazio pede para apagá-lo', async () => {
    const { tecla, apagou } = await render({ id: 'v', type: 'p', segs: [] }, 'fim');
    tecla('Backspace');
    expect(apagou()).toBe(1);
  });

  it('título vazio mostra a dica "Título do trecho"', async () => {
    const { pm } = await render({ id: 'v', type: 'h2', segs: [] });
    expect(pm.querySelector('p.is-empty')?.getAttribute('data-placeholder')).toBe(
      'Título do trecho',
    );
  });

  it('parágrafo vazio mostra a dica "Escreva aqui…"', async () => {
    const { pm } = await render({ id: 'v', type: 'p', segs: [] });
    expect(pm.querySelector('p.is-empty')?.getAttribute('data-placeholder')).toBe('Escreva aqui…');
  });

  it('item vazio de lista mostra a dica', async () => {
    const { pm } = await render({ id: 'v', type: 'list', items: [[{ k: 't', t: 'Um' }], []] });
    const dicas = [...pm.querySelectorAll('p.is-empty')].map((p) =>
      p.getAttribute('data-placeholder'),
    );
    expect(dicas).toEqual(['Escreva aqui…']);
  });

  it('bloco com texto não mostra dica', async () => {
    const { pm } = await render();
    expect(pm.querySelector('.is-empty')).toBeNull();
  });

  it('conteúdo trocado por fora recarrega o editor', async () => {
    const { fixture, el } = await render();
    fixture.componentRef.setInput('bloco', { ...b2, segs: [{ k: 't', t: 'Outro texto' }] });
    await fixture.whenStable();
    expect(el.querySelector('.ProseMirror')?.textContent).toBe('Outro texto');
  });

  it('Ocultar e Negrito sem seleção não fazem nada', async () => {
    const { fixture } = await render(b2, 'fim');
    expect(fixture.componentInstance.ocultar()).toEqual({ status: 'vazia' });
    expect(fixture.componentInstance.negrito()).toBe(false);
  });

  describe('lacuna no cursor', () => {
    async function comCursor(alvo: string, deslocamento: number) {
      const tela = await render(b2, 'inicio');
      const avisos: boolean[] = [];
      tela.fixture.componentInstance.lacunaNoCursor.subscribe((v) => avisos.push(v));
      const editor = tela.fixture.componentInstance['editor']!;
      const inicio = editor.state.doc.textContent.indexOf(alvo) + 1;
      editor.commands.setTextSelection(inicio + deslocamento);
      return { ...tela, avisos, editor };
    }

    it('cursor dentro de uma lacuna avisa true', async () => {
      const { avisos } = await comCursor('manifestação', 3);
      expect(avisos.at(-1)).toBe(true);
    });

    it('cursor fora de lacuna avisa false', async () => {
      const { avisos } = await comCursor('administrativo', 3);
      expect(avisos.at(-1)).toBe(false);
    });

    it('ocultar() com o cursor numa lacuna desoculta', async () => {
      const { fixture, mudou } = await comCursor('manifestação', 3);
      expect(fixture.componentInstance.ocultar()).toMatchObject({ status: 'desfeita', id: 'g1' });
      const segs = (mudou.at(-1) as BlocoTexto).segs;
      expect(segs.some((s) => s.k === 'g' && s.id === 'g1')).toBe(false);
    });

    it('Ctrl+Shift+H com o cursor numa lacuna desoculta', async () => {
      const { pm, mudou } = await comCursor('manifestação', 3);
      pm.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'h', ctrlKey: true, shiftKey: true, bubbles: true }),
      );
      const segs = (mudou.at(-1) as BlocoTexto).segs;
      expect(segs.some((s) => s.k === 'g' && s.id === 'g1')).toBe(false);
    });
  });

  describe('sigla', () => {
    it('sem seleção, não há alvo nem mudança', async () => {
      const { fixture, mudou } = await render(b2, 'fim');
      const editor = fixture.componentInstance;
      expect([editor.sigla(), editor.marcarSigla('x'), mudou]).toEqual([
        'vazia',
        { status: 'vazia' },
        [],
      ]);
    });

    it('com o texto selecionado, grava o significado, avisa a mudança e volta o foco', async () => {
      const { fixture, pm, mudou } = await render(
        { id: 'p', type: 'p', segs: [{ k: 't', t: 'STF' }] },
        'tudo',
      );
      const foco = vi.spyOn(fixture.componentInstance, 'voltarFoco');
      const resultado = fixture.componentInstance.marcarSigla('Supremo Tribunal Federal');
      expect([resultado, foco.mock.calls.length]).toEqual([{ status: 'ok', texto: 'STF' }, 1]);
      expect((mudou.at(-1) as BlocoTexto).segs).toEqual([
        { k: 't', t: 'STF', n: 'Supremo Tribunal Federal' },
      ]);
      expect(pm.querySelector('abbr.sigla')?.getAttribute('title')).toBe(
        'Supremo Tribunal Federal',
      );
    });
  });

  it('foco "tudo" seleciona o texto (para digitar por cima)', async () => {
    const { fixture } = await render(
      { id: 'n', type: 'h2', segs: [{ k: 't', t: 'Novo trecho' }] },
      'tudo',
    );
    expect(fixture.componentInstance.temSelecao()).toBe(true);
    expect(fixture.componentInstance.negrito()).toBe(true);
  });
});
