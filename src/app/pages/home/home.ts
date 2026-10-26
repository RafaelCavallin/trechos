import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucidePlay } from '@lucide/angular';
import { AuthService } from '../../core/auth.service';
import { ReviewQueueService } from '../../core/review-queue.service';
import { StudyStore } from '../../core/study-store';
import { healthBand } from '../../domain/health';
import { saudacao } from '../../domain/usuario';
import { ReviewSessionService } from '../../review/review-session.service';
import { MINUTOS_POR_TRECHO, queueByMateria } from '../../scheduler/queue';
import { healthRanking, indexGaps, longDate, retention, weakGaps } from '../../stats/insights';

const PONTOS = ['accent', 'accent-2-500', 'accent-700', 'accent-2-700'];
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Tela inicial (design §5.1, R13.2). */
@Component({
  selector: 'app-home',
  imports: [RouterLink, LucidePlay],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly store = inject(StudyStore);
  private readonly fila = inject(ReviewQueueService);
  private readonly sessao = inject(ReviewSessionService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly data = computed(() => longDate(this.store.agora()));
  protected readonly saudacao = computed(() => saudacao(this.auth.nome()));

  protected readonly total = computed(() => this.fila.fila().length);
  protected readonly titulo = computed(() =>
    this.total()
      ? `${plural(this.total(), 'trecho', 'trechos')} para revisar hoje`
      : 'Tudo revisado por hoje',
  );
  protected readonly subtitulo = computed(() => {
    const n = this.total();
    if (!n) return 'Volte amanhã — as próximas revisões já estão agendadas.';
    return `Cerca de ${n * MINUTOS_POR_TRECHO} minutos, intercalando ${plural(this.revisoes().length, 'matéria', 'matérias')}.`;
  });

  /** Revisões do dia por matéria: "3 trechos · ~6 min". */
  protected readonly revisoes = computed(() => {
    const nomes = new Map(this.store.materias().map((m) => [m.id, m.nome]));
    return queueByMateria(this.fila.fila()).map((g, i) => ({
      id: g.materiaId,
      nome: nomes.get(g.materiaId) ?? '',
      rotulo: `${plural(g.trechos, 'trecho', 'trechos')} · ~${g.minutos} min`,
      ponto: `var(--color-${PONTOS[i % PONTOS.length]})`,
    }));
  });

  protected readonly sessaoEmAndamento = computed(() => {
    const s = this.sessao.sessao();
    return !!s && !s.concluida;
  });

  protected readonly saude = computed(() =>
    healthRanking(
      retention(this.store.materias(), this.store.assuntos(), this.store.trechos()),
    ).map((m) => ({ ...m, faixa: healthBand(m.pct) })),
  );

  protected readonly pontosFracos = computed(() =>
    weakGaps(
      this.store.registros(),
      indexGaps(this.store.resumos(), this.store.assuntos(), this.store.materias()),
    ),
  );

  protected readonly minutos = computed(() => this.total() * MINUTOS_POR_TRECHO);

  protected async iniciar(): Promise<void> {
    if (!this.sessaoEmAndamento()) this.sessao.iniciar();
    await this.router.navigateByUrl('/revisao');
  }
}
