import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import { Pergunta } from '../../domain/types';
import { Autofocus } from '../../shared/autofocus';

export type RascunhoPergunta = Pick<Pergunta, 'q' | 'a'>;

const RASCUNHO_VAZIO: RascunhoPergunta = { q: '', a: '' };

@Component({
  selector: 'app-question-form',
  imports: [Autofocus],
  templateUrl: './question-form.html',
  styleUrl: './question-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionForm {
  readonly inicial = input<RascunhoPergunta>(RASCUNHO_VAZIO);
  readonly salvar = output<RascunhoPergunta>();
  readonly cancelar = output<void>();
  protected readonly q = linkedSignal(() => this.inicial().q);
  protected readonly a = linkedSignal(() => this.inicial().a);

  protected enviar(): void {
    if (!this.q().trim()) return;
    this.salvar.emit({ q: this.q(), a: this.a() });
  }

  protected valor(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }
}
