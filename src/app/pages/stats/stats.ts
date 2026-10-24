import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudyStore } from '../../core/study-store';
import { healthBand, heatLevel, itemStats } from '../../domain/health';
import { NOTA_TEXTO } from '../../domain/review';
import { ID, Nota, SegmentoDinamico, SegmentoLacuna } from '../../domain/types';
import { BlockView, VisualLacuna } from '../../shared/block-view/block-view';
import {
  heatMap,
  heatTitle,
  history,
  rateBand,
  retention,
  reviewedSummaries,
} from '../../stats/insights';

/** Tela Estatísticas (design §5.5, R13.3). */
@Component({
  selector: 'app-stats',
  imports: [RouterLink, BlockView],
  templateUrl: './stats.html',
  styleUrl: './stats.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stats {
  private readonly store = inject(StudyStore);
  protected readonly textoNota = NOTA_TEXTO;

  protected readonly retencao = computed(() =>
    retention(this.store.materias(), this.store.assuntos(), this.store.trechos()),
  );

  protected readonly historico = computed(() =>
    history(this.store.registros(), this.store.trechos(), this.store.materias(), new Date()),
  );

  private readonly stats = computed(() => itemStats(this.store.registros()));

  /** Resumos com alguma lacuna já revisada. */
  protected readonly opcoes = computed(() => reviewedSummaries(this.store.resumos(), this.stats()));
  private readonly escolhido = signal<ID | null>(null);
  protected readonly resumoDoMapa = computed(() => {
    const opcoes = this.opcoes();
    return opcoes.find((r) => r.id === this.escolhido()) ?? opcoes[0] ?? null;
  });

  protected readonly mapa = computed(() => {
    const r = this.resumoDoMapa();
    return r ? heatMap(r.blocos, this.stats()) : [];
  });

  /** Cada lacuna pintada pela taxa de erro, com a dica "Errada em X de Y revisões". */
  protected readonly calor = computed(() => {
    const stats = this.stats();
    return (seg: SegmentoLacuna | SegmentoDinamico): VisualLacuna => {
      const s = stats.get(seg.id);
      return { estado: `calor-${heatLevel(s)}`, titulo: heatTitle(s) };
    };
  });

  protected escolher(id: ID): void {
    this.escolhido.set(id);
  }

  protected pct(v: number | null): string {
    return v === null ? '—' : `${v}%`;
  }

  protected faixa(v: number | null): string {
    return v === null ? 'nenhuma' : healthBand(v);
  }

  protected faixaTaxa(v: number | null): string {
    return rateBand(v);
  }

  protected corNota(nota: Nota): string {
    return nota.toLowerCase();
  }
}
