import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Provisória: a tela entra na Fase 5 (design §5). */
@Component({
  selector: 'app-review',
  template: `
    <h1>Revisão</h1>
    <p class="text-muted">Esta tela será construída na Fase 5.</p>
  `,
  styles: `
    :host {
      display: block;
      max-width: 1180px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Review {}
