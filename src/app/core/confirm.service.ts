import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  body: string;
  /** Texto do botão principal. Padrão: "Excluir". */
  confirmLabel?: string;
}

interface PendingConfirm extends Required<ConfirmOptions> {
  resolve: (confirmed: boolean) => void;
}

/**
 * Diálogo de confirmação (design §5.7).
 * Uso: `if (await confirm.ask({ title: 'Excluir matéria?', body: '…' })) { … }`
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly _pending = signal<PendingConfirm | null>(null);
  readonly pending = this._pending.asReadonly();

  ask(options: ConfirmOptions): Promise<boolean> {
    // Se já havia um diálogo aberto, ele conta como cancelado.
    this._pending()?.resolve(false);
    return new Promise((resolve) => {
      this._pending.set({ confirmLabel: 'Excluir', ...options, resolve });
    });
  }

  answer(confirmed: boolean): void {
    const pending = this._pending();
    if (!pending) return;
    this._pending.set(null);
    pending.resolve(confirmed);
  }
}
