import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  viewChild,
} from '@angular/core';
import { ConfirmService } from '../../core/confirm.service';

/**
 * Diálogo de confirmação (design §5.7). Clicar no fundo ou apertar Esc cancela.
 * Ao abrir, o foco vai para "Cancelar", para que Enter não exclua por engano.
 */
@Component({
  selector: 'app-confirm-dialog',
  host: { '(document:keydown.escape)': 'onEscape()' },
  template: `
    @if (confirm.pending(); as pending) {
      <div class="dialog-backdrop" (click)="confirm.answer(false)" aria-hidden="true"></div>
      <div class="dialog-layer">
        <div
          class="dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-body"
        >
          <div class="dialog-title" id="confirm-title">{{ pending.title }}</div>
          <div class="dialog-body" id="confirm-body">{{ pending.body }}</div>
          <div class="dialog-actions">
            <button #cancel type="button" class="btn btn-secondary" (click)="confirm.answer(false)">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" (click)="confirm.answer(true)">
              {{ pending.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .dialog-backdrop {
      z-index: 40;
    }
    /* Camada que centraliza o diálogo sem capturar cliques fora dele. */
    .dialog-layer {
      position: fixed;
      inset: 0;
      z-index: 41;
      display: grid;
      place-items: center;
      padding: var(--space-4);
      pointer-events: none;
    }
    .dialog {
      pointer-events: auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);
  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancel');

  constructor() {
    afterRenderEffect(() => this.cancelButton()?.nativeElement.focus());
  }

  protected onEscape(): void {
    if (this.confirm.pending()) this.confirm.answer(false);
  }
}
