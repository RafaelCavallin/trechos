import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LucideEye } from '@lucide/angular';
import { NOTA_TEXTO } from '../../domain/review';
import { Nota } from '../../domain/types';
import { textoProximaRevisao } from '../../review/textos-cartao';
import { CartaoRevisao } from './cartao-revisao';

@Component({
  selector: 'app-grade-actions',
  imports: [LucideEye],
  templateUrl: './grade-actions.html',
  styleUrl: './grade-actions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradeActions {
  readonly rotuloFim = input.required<string>();
  protected readonly cartao = inject(CartaoRevisao);
  protected readonly controle = this.cartao.controle;
  protected readonly textoNota = NOTA_TEXTO;

  protected readonly proximaRevisao = computed(() => {
    const resultado = this.cartao.sessao()?.resultado;
    return resultado ? textoProximaRevisao(resultado.due, new Date()) : '';
  });

  protected readonly rotuloAvancar = computed(() => {
    const s = this.cartao.sessao();
    return s && s.indice + 1 < s.fila.length ? 'Próximo trecho' : this.rotuloFim();
  });

  protected corNota(nota: Nota): string {
    return nota.toLowerCase();
  }
}
