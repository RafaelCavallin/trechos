import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Provisória: a tela entra na Fase 4 (design §5). */
@Component({
  selector: 'app-summary-editor',
  template: `
    <h1>Resumo</h1>
    <p class="text-muted">Esta tela será construída na Fase 4.</p>
  `,
  styles: `
    :host {
      display: block;
      max-width: 1260px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryEditor {}
