import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { StudyStore } from '../../core/study-store';
import { ID } from '../../domain/types';
import { CONTROLE_REVISAO } from '../../review/controle-revisao';
import { FormatoPreview } from '../../review/fila-preview';
import { PreviewSessionService } from '../../review/preview-session.service';
import { TEXTO_MODO } from '../../review/session';
import { ReviewCard } from '../../shared/review-card/review-card';

const FORMATOS: readonly { valor: FormatoPreview; rotulo: string }[] = [
  { valor: 'auto', rotulo: 'Automático' },
  { valor: 'lacunas', rotulo: TEXTO_MODO.lacunas },
  { valor: 'perguntas', rotulo: TEXTO_MODO.perguntas },
  { valor: 'titulo', rotulo: TEXTO_MODO.titulo },
  { valor: 'densas', rotulo: TEXTO_MODO.densas },
];

@Component({
  selector: 'app-summary-preview',
  imports: [RouterLink, ReviewCard, LucideArrowLeft, LucideChevronLeft, LucideChevronRight],
  templateUrl: './summary-preview.html',
  styleUrl: './summary-preview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    PreviewSessionService,
    { provide: CONTROLE_REVISAO, useExisting: PreviewSessionService },
  ],
})
export class SummaryPreview {
  readonly id = input.required<ID>();
  readonly trecho = input<ID | null>(null);
  protected readonly store = inject(StudyStore);
  protected readonly servico = inject(PreviewSessionService);
  protected readonly formatos = FORMATOS;
  protected readonly s = this.servico.sessao;
  protected readonly resumo = computed(() => this.store.resumos().find((r) => r.id === this.id()));

  constructor() {
    effect(() => {
      if (this.store.status() !== 'pronto') return;
      const id = this.id();
      const trecho = this.trecho();
      untracked(() => this.servico.iniciar(id, trecho));
    });
  }
}
