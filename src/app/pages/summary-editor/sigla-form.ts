import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import { Autofocus } from '../../shared/autofocus';

@Component({
  selector: 'app-sigla-form',
  imports: [Autofocus],
  templateUrl: './sigla-form.html',
  styleUrl: './sigla-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiglaForm {
  readonly texto = input.required<string>();
  readonly inicial = input('');
  readonly salvar = output<string>();
  readonly cancelar = output<void>();
  protected readonly nota = linkedSignal(() => this.inicial());

  protected enviar(): void {
    if (!this.nota().trim()) return;
    this.salvar.emit(this.nota());
  }

  protected valor(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }
}
