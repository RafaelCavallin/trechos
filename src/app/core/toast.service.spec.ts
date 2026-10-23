import { TestBed } from '@angular/core/testing';
import { TOAST_DURATION_MS, ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = TestBed.inject(ToastService);
  });

  afterEach(() => vi.useRealTimers());

  it('mostra o aviso e some depois do tempo', () => {
    service.show('Matéria criada');
    expect(service.message()).toBe('Matéria criada');
    vi.advanceTimersByTime(TOAST_DURATION_MS - 1);
    expect(service.message()).toBe('Matéria criada');
    vi.advanceTimersByTime(1);
    expect(service.message()).toBeNull();
  });

  it('um aviso novo substitui o anterior e reinicia o tempo', () => {
    service.show('Primeiro');
    vi.advanceTimersByTime(TOAST_DURATION_MS - 100);
    service.show('Segundo');
    vi.advanceTimersByTime(200);
    expect(service.message()).toBe('Segundo');
  });
});
