import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LucideCheck, LucideX } from '@lucide/angular';
import { StudyStore } from '../../core/study-store';
import { textoDasFaixas } from '../../review/textos-cartao';
import { CartaoRevisao } from './cartao-revisao';

@Component({
  selector: 'app-items-panel',
  imports: [LucideCheck, LucideX],
  templateUrl: './items-panel.html',
  styleUrl: './items-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemsPanel {
  protected readonly cartao = inject(CartaoRevisao);
  private readonly store = inject(StudyStore);
  protected readonly faixas = computed(() => textoDasFaixas(this.store.config().faixas));
}
