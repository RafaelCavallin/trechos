import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Provisória: a tela entra na Fase 7 (design §5). */
@Component({
  selector: 'app-settings',
  template: `
    <h1>Configurações</h1>
    <p class="text-muted">Esta tela será construída na Fase 7.</p>
  `,
  styles: `
    :host {
      display: block;
      max-width: 760px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {}
