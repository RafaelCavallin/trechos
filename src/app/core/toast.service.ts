import { Injectable, signal } from '@angular/core';

/** Quanto tempo o aviso fica na tela (design §5.7). */
export const TOAST_DURATION_MS = 3400;

/** Aviso temporário no rodapé da tela. Um aviso novo substitui o anterior. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _message = signal<string | null>(null);
  readonly message = this._message.asReadonly();
  private timer: ReturnType<typeof setTimeout> | undefined;

  show(message: string): void {
    clearTimeout(this.timer);
    this._message.set(message);
    this.timer = setTimeout(() => this._message.set(null), TOAST_DURATION_MS);
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this._message.set(null);
  }
}
