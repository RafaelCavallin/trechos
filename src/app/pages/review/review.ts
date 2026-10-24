import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideCheck, LucideEye, LucidePlay, LucideX } from '@lucide/angular';
import { ReviewQueueService } from '../../core/review-queue.service';
import { StudyStore } from '../../core/study-store';
import { NOTA_TEXTO, modeForStage } from '../../domain/review';
import { BlocoRevisao, ID, Modo, Nota, SegmentoDinamico, SegmentoLacuna } from '../../domain/types';
import { ReviewSessionService } from '../../review/review-session.service';
import { TEXTO_MODO, progresso, resumoDaSessao } from '../../review/session';
import { dayLabel, daysBetween } from '../../scheduler/dates';
import { MINUTOS_POR_TRECHO } from '../../scheduler/queue';
import { BlockView, VisualLacuna } from '../../shared/block-view/block-view';
import { SessionSummary } from './session-summary';

const INSTRUCAO: Record<Modo, string> = {
  lacunas:
    'Tente lembrar o que falta em cada lacuna — as numeradas em verde são dinâmicas. Depois, revele.',
  perguntas: 'Responda mentalmente cada pergunta da margem, sem ver o texto.',
  titulo: 'Lembre livremente tudo o que puder sobre este trecho. Depois, compare com o gabarito.',
  densas: 'Trecho estável: muito mais texto oculto. Reconstrua de memória.',
};

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Tela Revisão (design §5.4): fila do dia, sessão e resumo da sessão. */
@Component({
  selector: 'app-review',
  imports: [RouterLink, BlockView, SessionSummary, LucideCheck, LucideEye, LucidePlay, LucideX],
  templateUrl: './review.html',
  styleUrl: './review.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'atalho($event)' },
})
export class Review {
  private readonly store = inject(StudyStore);
  private readonly router = inject(Router);
  private readonly filaDoDia = inject(ReviewQueueService);
  protected readonly servico = inject(ReviewSessionService);
  protected readonly config = this.store.config;
  protected readonly textoModo = TEXTO_MODO;
  protected readonly textoNota = NOTA_TEXTO;

  // ── Antes de iniciar (R8.5) ────────────────────────────────────────────

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

  // ── Sessão (R9) ────────────────────────────────────────────────────────

  protected readonly s = this.servico.sessao;
  protected readonly a = this.servico.atual;
  /** Item com o foco do teclado (índice na lista de itens). */
  protected readonly foco = signal(0);

  protected readonly progresso = computed(() => {
    const s = this.s();
    return s ? progresso(s) : 0;
  });

  /** Título do trecho (H2/H3 inicial) e o resto dos blocos. */
  protected readonly partes = computed(() => {
    const blocos = this.a()?.blocos ?? [];
    const primeiro = blocos[0];
    const temTitulo = primeiro?.type === 'h2' || primeiro?.type === 'h3';
    return {
      titulo: temTitulo ? (primeiro as BlocoRevisao) : null,
      corpo: temTitulo ? blocos.slice(1) : blocos,
    };
  });

  protected readonly mostrarBlocos = computed(() => {
    const a = this.a();
    const s = this.s();
    return !!a && a.modo !== 'perguntas' && (a.modo !== 'titulo' || !!s?.revelado);
  });

  protected readonly instrucao = computed(() => {
    const s = this.s();
    const a = this.a();
    if (!s || !a) return '';
    if (s.resultado) return 'Nota calculada pela proporção de itens acertados.';
    if (s.revelado)
      return 'Marque cada item como acertou ou errou — clique na lacuna ou use a lista ao lado.';
    return INSTRUCAO[a.modo];
  });

  protected readonly marcados = computed(() => {
    const s = this.s();
    return (this.a()?.itens ?? []).filter((i) => s?.marcas[i.id] !== undefined).length;
  });

  /** Como desenhar cada lacuna conforme o momento da revisão. */
  protected readonly visual = computed(() => {
    const s = this.s();
    const itens = this.a()?.itens ?? [];
    const num = new Map(itens.map((i) => [i.id, i.num]));
    const focado = s?.revelado && !s.resultado ? itens[this.foco()]?.id : undefined;
    return (seg: SegmentoLacuna | SegmentoDinamico): VisualLacuna => {
      const dinamica = seg.k === 'd';
      if (!s?.revelado) {
        return { estado: dinamica ? 'oculta-dinamica' : 'oculta', numero: num.get(seg.id) };
      }
      const m = s.marcas[seg.id];
      return {
        estado:
          m === true
            ? 'acertou'
            : m === false
              ? 'errou'
              : dinamica
                ? 'revelada-dinamica'
                : 'revelada',
        clicavel: !s.resultado,
        titulo: s.resultado ? undefined : 'Clique para marcar acerto ou erro',
        focado: seg.id === focado,
      };
    };
  });

  protected readonly faixasTexto = computed(() => {
    const f = this.config().faixas;
    return `${f.easy}% Fácil · ≥${f.good}% Lembrei · ≥${f.hard}% Lembrei com esforço · abaixo: Não lembrei`;
  });

  protected readonly proximaRevisao = computed(() => {
    const r = this.s()?.resultado;
    if (!r) return '';
    const agora = new Date();
    const dias = daysBetween(agora, r.due);
    return `Próxima revisão: ${dayLabel(r.due, agora)}${dias > 1 ? ` (em ${dias} dias)` : ''}`;
  });

  // ── Fim da sessão (R9.7) ───────────────────────────────────────────────

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

  // ── Ações ──────────────────────────────────────────────────────────────

  protected iniciar(): void {
    this.servico.iniciar();
    this.foco.set(0);
  }

  protected revelar(): void {
    this.servico.revelar();
    this.foco.set(0);
  }

  protected marcar(indice: number, acertou: boolean): void {
    const item = this.a()?.itens[indice];
    if (!item) return;
    this.servico.marcar(item.id, acertou);
    this.foco.set(indice);
  }

  protected clicarLacuna(id: ID): void {
    this.servico.alternar(id);
    const i = this.a()?.itens.findIndex((x) => x.id === id) ?? -1;
    if (i >= 0) this.foco.set(i);
  }

  protected proximo(): void {
    this.servico.proximo();
    this.foco.set(0);
  }

  protected async voltarAoInicio(): Promise<void> {
    this.servico.encerrar();
    await this.router.navigateByUrl('/');
  }

  protected async verEstatisticas(): Promise<void> {
    this.servico.encerrar();
    await this.router.navigateByUrl('/estatisticas');
  }

  /**
   * Atalhos (T5.6): Espaço revela; 1 ou ← acertou; 2 ou → errou (no item em foco,
   * e o foco anda para o próximo); ↑/↓ mudam o item; Enter calcula a nota ou avança.
   * Espaço sobre um botão continua apertando o botão.
   */
  protected atalho(e: KeyboardEvent): void {
    const s = this.s();
    if (!s || s.concluida || e.ctrlKey || e.metaKey || e.altKey) return;
    const alvo = e.target instanceof Element ? e.target : null;
    if (alvo?.closest('input, textarea, [contenteditable="true"]')) return;
    const emBotao = !!alvo?.closest('button, a');
    const total = this.a()?.itens.length ?? 0;
    const marcarEAndar = (acertou: boolean) => {
      this.marcar(this.foco(), acertou);
      this.foco.set(Math.min(this.foco() + 1, Math.max(0, total - 1)));
    };

    switch (e.key) {
      case ' ':
        if (emBotao || s.revelado) return;
        this.revelar();
        break;
      case '1':
      case 'ArrowLeft':
        if (!s.revelado || s.resultado) return;
        marcarEAndar(true);
        break;
      case '2':
      case 'ArrowRight':
        if (!s.revelado || s.resultado) return;
        marcarEAndar(false);
        break;
      case 'ArrowDown':
        if (!s.revelado || s.resultado) return;
        this.foco.set(Math.min(this.foco() + 1, Math.max(0, total - 1)));
        break;
      case 'ArrowUp':
        if (!s.revelado || s.resultado) return;
        this.foco.set(Math.max(this.foco() - 1, 0));
        break;
      case 'Enter':
        // Durante a sessão, Enter é sempre o atalho (mesmo com o foco num botão).
        if (s.resultado) this.proximo();
        else if (this.servico.todosMarcados()) void this.servico.calcularNota();
        else return;
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  protected corNota(nota: Nota): string {
    return nota.toLowerCase();
  }
}
