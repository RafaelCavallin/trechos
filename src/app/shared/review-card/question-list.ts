import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CartaoRevisao } from './cartao-revisao';

@Component({
  selector: 'app-question-list',
  templateUrl: './question-list.html',
  styleUrl: './question-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionList {
  protected readonly cartao = inject(CartaoRevisao);
}
