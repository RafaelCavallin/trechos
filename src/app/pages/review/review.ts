import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucidePlay } from '@lucide/angular';
import { ReviewQueueService } from '../../core/review-queue.service';
import { StudyStore } from '../../core/study-store';
import { modeForStage } from '../../domain/review';
import { CONTROLE_REVISAO } from '../../review/controle-revisao';
import { ReviewSessionService } from '../../review/review-session.service';
import { TEXTO_MODO, progresso, resumoDaSessao } from '../../review/session';
import { dayLabel } from '../../scheduler/dates';
import { MINUTOS_POR_TRECHO } from '../../scheduler/queue';
import { ReviewCard } from '../../shared/review-card/review-card';
import { SessionSummary } from './session-summary';

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

@Component({
  selector: 'app-review',
  imports: [RouterLink, ReviewCard, SessionSummary, LucidePlay],
  templateUrl: './review.html',
  styleUrl: './review.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: CONTROLE_REVISAO, useExisting: ReviewSessionService }],
})
export class Review {
  private readonly store = inject(StudyStore);
  private readonly router = inject(Router);
  private readonly filaDoDia = inject(ReviewQueueService);
  protected readonly servico = inject(ReviewSessionService);
  protected readonly s = this.servico.sessao;
  protected readonly a = this.servico.atual;

  protected readonly lista = computed(() => {
    const materias = new Map(this.store.materias().map((m) => [m.id, m.nome]));
    const assuntos = new Map(this.store.assuntos().map((a) => [a.id, a.nome]));
    return this.filaDoDia.fila().map((t, i) => ({
      key: t.key,
      num: i + 1,
      titulo: t.trecho.titulo,
      onde: `${materias.get(t.materiaId) ?? ''} · ${assuntos.get(t.assuntoId) ?? ''}`,
      modo: TEXTO_MODO[modeForStage(t.estado.S, t.trecho)],
      itens: plural(t.itens, 'item', 'itens'),
    }));
  });

  protected readonly tituloFila = computed(() => {
    const n = this.lista().length;
    return `${plural(n, 'trecho', 'trechos')} · ~${n * MINUTOS_POR_TRECHO} min`;
  });

  protected readonly progresso = computed(() => {
    const s = this.s();
    return s ? progresso(s) : 0;
  });

  protected readonly resumo = computed(() => {
    const s = this.s();
    if (!s?.concluida) return null;
    const hoje = new Date();
    const materias = new Map(this.store.materias().map((m) => [m.id, m.nome]));
    const r = resumoDaSessao(s, hoje);
    return {
      ...r,
      titulo: plural(r.revisados, 'trecho revisado', 'trechos revisados'),
      linhas: s.resultados.map((x) => ({
        ...x,
        materia: materias.get(x.materiaId) ?? '',
        proxima: dayLabel(x.due, hoje),
      })),
      voltam: r.voltamAmanha.map((x) => ({
        key: x.key,
        titulo: x.titulo,
        materia: materias.get(x.materiaId) ?? '',
        erradas: x.erradas.length ? `Erradas: ${x.erradas.join(', ')}` : '',
      })),
    };
  });

  protected iniciar(): void {
    this.servico.iniciar();
  }

  protected async voltarAoInicio(): Promise<void> {
    this.servico.encerrar();
    await this.router.navigateByUrl('/');
  }

  protected async verEstatisticas(): Promise<void> {
    this.servico.encerrar();
    await this.router.navigateByUrl('/estatisticas');
  }
}
