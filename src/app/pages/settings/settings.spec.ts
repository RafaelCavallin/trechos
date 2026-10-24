import { TestBed } from '@angular/core/testing';
import { ReviewQueueService } from '../../core/review-queue.service';
import { StudyStore } from '../../core/study-store';
import { ToastService } from '../../core/toast.service';
import { StudyRepository } from '../../data/study-repository';
import { CONFIG_PADRAO } from '../../domain/types';
import { fakeAuth, fakeStudyRepo, provideFakeAuth } from '../../testing/fakes';
import { Settings } from './settings';

describe('Settings', () => {
  async function render() {
    const repo = fakeStudyRepo();
    TestBed.configureTestingModule({
      providers: [{ provide: StudyRepository, useValue: repo }, provideFakeAuth(fakeAuth(true))],
    });
    const fixture = TestBed.createComponent(Settings);
    const store = TestBed.inject(StudyStore);
    await vi.waitFor(() => expect(store.status()).toBe('pronto'));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const input = (seletor: string) => el.querySelector(seletor) as HTMLInputElement;
    /** Digita um valor e confirma (como Enter ou sair do campo). */
    const digitar = async (seletor: string, valor: string) => {
      const i = input(seletor);
      i.value = valor;
      i.dispatchEvent(new Event('change'));
      await new Promise((r) => setTimeout(r));
      await fixture.whenStable();
    };
    const escolher = async (nome: string, rotulo: string) => {
      const opcao = [...el.querySelectorAll(`input[name="${nome}"]`)].find(
        (i) => i.parentElement?.textContent?.trim() === rotulo,
      ) as HTMLInputElement;
      opcao.click();
      await fixture.whenStable();
    };
    return { fixture, el, repo, store, input, digitar, escolher };
  }

  it('mostra os valores padrão', async () => {
    const { el, input } = await render();
    const marcado = (nome: string) =>
      (
        el.querySelector(`input[name="${nome}"]:checked`) as HTMLInputElement
      ).parentElement?.textContent?.trim();
    expect(marcado('retencao')).toBe('90%');
    expect(marcado('limite-tipo')).toBe('Palavras');
    expect(marcado('densidade')).toBe('Média');
    expect(input('input[name="limite"]').value).toBe('150');
    expect(input('#faixa-easy').value).toBe('100');
    expect(input('#faixa-good').value).toBe('90');
    expect(input('#faixa-hard').value).toBe('60');
    expect(input('input[name="limite-edicao"]').value).toBe('30');
    expect(input('input[name="limite-diario"]').value).toBe('20');
    expect(el.textContent).toMatch(
      /Com 90%, um trecho com estabilidade de 10 dias volta em \d+ dias?\./,
    );
    expect((el.querySelector('button.btn-secondary') as HTMLButtonElement).disabled).toBe(true);
  });

  it('retenção: grava e atualiza o exemplo na hora', async () => {
    const { el, repo, escolher } = await render();
    const exemplo = () => el.querySelector('.exemplo-retencao')?.textContent ?? '';
    const dias = (texto: string) => Number(/volta em (\d+)/.exec(texto)?.[1]);
    const com90 = dias(exemplo());
    await escolher('retencao', '80%');
    expect(repo.saveConfiguracoes).toHaveBeenCalledWith({ ...CONFIG_PADRAO, retencao: 0.8 });
    expect(exemplo()).toContain('Com 80%');
    expect(dias(exemplo())).toBeGreaterThan(com90);
  });

  it('limite do trecho: o campo segue o tipo escolhido', async () => {
    const { el, store, input, digitar, escolher } = await render();
    await escolher('limite-tipo', 'Lacunas');
    expect(input('input[name="limite"]').value).toBe('10');
    expect(el.textContent).toContain('lacunas por trecho');
    await digitar('input[name="limite"]', '12');
    expect(store.config()).toMatchObject({
      limiteTipo: 'lacunas',
      limiteLacunas: 12,
      limitePalavras: 150,
    });
  });

  it('faixas fora de ordem: avisa e volta ao valor anterior', async () => {
    const { repo, store, input, digitar } = await render();
    await digitar('#faixa-hard', '95');
    expect(TestBed.inject(ToastService).message()).toContain('Fácil ≥ Lembrei');
    expect(repo.saveConfiguracoes).not.toHaveBeenCalled();
    expect(store.config().faixas.hard).toBe(60);
    expect(input('#faixa-hard').value).toBe('60');
  });

  it('limite diário vale na hora para a fila', async () => {
    const { store, digitar } = await render();
    const fila = TestBed.inject(ReviewQueueService);
    expect(fila.fila().length).toBeGreaterThan(1);
    await digitar('input[name="limite-diario"]', '1');
    expect(store.config().limiteDiario).toBe(1);
    expect(fila.fila()).toHaveLength(1);
  });

  it('restaurar padrões', async () => {
    const { el, store, escolher } = await render();
    await escolher('densidade', 'Alta');
    const botao = el.querySelector('button.btn-secondary') as HTMLButtonElement;
    expect(botao.disabled).toBe(false);
    botao.click();
    await vi.waitFor(() =>
      expect(TestBed.inject(ToastService).message()).toBe('Configurações padrão restauradas.'),
    );
    expect(store.config()).toEqual(CONFIG_PADRAO);
  });
});
