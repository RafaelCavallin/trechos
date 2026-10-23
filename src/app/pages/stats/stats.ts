import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Provisória: a tela entra na Fase 6 (design §5). */
@Component({
  selector: 'app-stats',
  template: `
    <h1>Estatísticas</h1>
    <p class="text-muted">Esta tela será construída na Fase 6.</p>
  `,
  styles: `
    :host {
      display: block;
      max-width: 1180px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stats {}
