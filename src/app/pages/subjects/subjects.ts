import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Provisória: a tela entra na Fase 3 (design §5). */
@Component({
  selector: 'app-subjects',
  template: `
    <h1>Matérias</h1>
    <p class="text-muted">Esta tela será construída na Fase 3.</p>
  `,
  styles: `
    :host {
      display: block;
      max-width: 980px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Subjects {}
