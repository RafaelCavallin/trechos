import { TestBed } from '@angular/core/testing';
import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  let service: ConfirmService;

  beforeEach(() => {
    service = TestBed.inject(ConfirmService);
  });

  it('resolve true ao confirmar e fecha o diálogo', async () => {
    const answer = service.ask({ title: 'Excluir matéria?', body: 'Não dá para desfazer.' });
    expect(service.pending()?.confirmLabel).toBe('Excluir');
    service.answer(true);
    expect(await answer).toBe(true);
    expect(service.pending()).toBeNull();
  });

  it('resolve false ao cancelar', async () => {
    const answer = service.ask({ title: 'Excluir?', body: '' });
    service.answer(false);
    expect(await answer).toBe(false);
  });

  it('abrir outro diálogo cancela o anterior', async () => {
    const first = service.ask({ title: 'A', body: '' });
    service.ask({ title: 'B', body: '' });
    expect(await first).toBe(false);
    expect(service.pending()?.title).toBe('B');
  });
});
