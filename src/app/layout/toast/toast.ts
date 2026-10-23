import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast.service';

/** Pílula fixa no rodapé com o aviso atual (design §5.7). */
@Component({
  selector: 'app-toast',
  template: `
    <div role="status" aria-live="polite">
      @if (toast.message(); as message) {
        <div class="toast">{{ message }}</div>
      }
    </div>
  `,
  styles: `
    .toast {
      position: fixed;
      left: 50%;
      bottom: 28px;
      transform: translateX(-50%);
      z-index: 50;
      max-width: 80vw;
      padding: 12px 24px;
      border-radius: 999px;
      background: var(--color-neutral-900);
      color: var(--color-neutral-100);
      font-size: 14px;
      box-shadow: var(--shadow-lg);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toast {
  protected readonly toast = inject(ToastService);
}
