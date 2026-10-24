import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NOTA_TEXTO } from '../../domain/review';
import { Nota } from '../../domain/types';
import { ResultadoTrecho } from '../../review/session';

export interface ResumoVisivel {
  titulo: string;
  revisados: number;
  acertos: number;
  total: number;
  pct: number;
  voltamAmanha: unknown[];
  linhas: (ResultadoTrecho & { materia: string; proxima: string })[];
  voltam: { key: string; titulo: string; materia: string; erradas: string }[];
}

/** Resumo do fim da sessão (R9.7): números, tabela por trecho e "Volta amanhã". */
@Component({
  selector: 'app-session-summary',
  templateUrl: './session-summary.html',
  styleUrl: './session-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionSummary {
  readonly resumo = input.required<ResumoVisivel>();
  readonly inicio = output<void>();
  readonly estatisticas = output<void>();
  protected readonly textoNota = NOTA_TEXTO;

  protected corNota(nota: Nota): string {
    return nota.toLowerCase();
  }
}
