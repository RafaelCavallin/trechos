import { Injectable, computed, inject, signal } from '@angular/core';
import { ReviewQueueService } from '../core/review-queue.service';
import { StudyStore } from '../core/study-store';
import { allMarked, gradeFromMarks, prepareReview, withFallback } from '../domain/review';
import { splitTrechos } from '../domain/trechos';
import { ID } from '../domain/types';
import { Agendador } from '../scheduler/fsrs';
import * as S from './session';

/**
 * Sessão de revisão em andamento (R9). Fica viva enquanto o app está aberto:
 * dá para trocar de tela e voltar; "Sair" encerra.
 */
@Injectable({ providedIn: 'root' })
export class ReviewSessionService {
  private readonly store = inject(StudyStore);
  private readonly fila = inject(ReviewQueueService);

  private readonly _sessao = signal<S.Sessao | null>(null);
  readonly sessao = this._sessao.asReadonly();

  /** Trecho atual pronto para revisão (blocos com lacunas dinâmicas e itens numerados). */
  readonly atual = computed(() => {
    const s = this._sessao();
    if (!s || s.concluida) return null;
    const entrada = s.fila[s.indice];
    const resumo = this.store.resumos().find((r) => r.id === entrada.resumoId);
    const trecho = resumo && splitTrechos(resumo.blocos).find((t) => t.id === entrada.trechoId);
    const assunto = this.store.assuntos().find((a) => a.id === entrada.assuntoId);
    const materia = this.store.materias().find((m) => m.id === entrada.materiaId);
    if (!trecho) {
      // O trecho deixou de existir durante a sessão (ex.: o resumo foi editado).
      return {
        entrada,
        trecho: null,
        materia: materia?.nome ?? '',
        assunto: assunto?.nome ?? '',
        modo: entrada.modo,
        blocos: [],
        itens: [],
      };
    }
    const modo = withFallback(entrada.modo, trecho);
    return {
      entrada,
      trecho,
      materia: materia?.nome ?? '',
      assunto: assunto?.nome ?? '',
      ...prepareReview(trecho, modo, this.store.config().densidade),
    };
  });

  readonly todosMarcados = computed(() => {
    const a = this.atual();
    const s = this._sessao();
    return !!a?.trecho && !!s && allMarked(s.marcas, a.itens);
  });

  iniciar(): void {
    const fila = this.fila.fila();
    if (fila.length) this._sessao.set(S.iniciar(fila));
  }

  revelar(): void {
    this.mudar(S.revelar);
  }

  marcar(id: ID, acertou: boolean): void {
    this.mudar((s) => S.marcar(s, id, acertou));
  }

  alternar(id: ID): void {
    this.mudar((s) => S.alternar(s, id));
  }

  marcarRestantes(): void {
    const itens = this.atual()?.itens ?? [];
    this.mudar((s) => S.marcarRestantes(s, itens));
  }

  setRecall(texto: string): void {
    this.mudar((s) => ({ ...s, recall: texto }));
  }

  /** Calcula a nota, atualiza o FSRS e grava a revisão (R9.6, R11, R12). */
  async calcularNota(agora = new Date()): Promise<void> {
    const s = this._sessao();
    const a = this.atual();
    if (!s || !a?.trecho || s.resultado || !this.todosMarcados()) return;

    const marcas = Object.fromEntries(a.itens.map((i) => [i.id, s.marcas[i.id] === true]));
    const nota = gradeFromMarks(marcas, a.itens, this.store.config().faixas);
    const anterior =
      this.store.estados().find((e) => e.key === a.entrada.key) ??
      Agendador.novo(a.entrada.key, agora);
    const estado = this.store.agendador().revisar(anterior, nota.nota, agora);

    this._sessao.set(
      S.registrarResultado(s, {
        key: a.entrada.key,
        titulo: a.trecho.titulo,
        materiaId: a.entrada.materiaId,
        ...nota,
        due: estado.due,
        erradas: a.itens
          .filter((i) => !marcas[i.id])
          .map((i) => (i.tipo === 'pergunta' ? i.pergunta : i.texto)),
      }),
    );
    await this.store.recordReview(estado, {
      trechoKey: a.entrada.key,
      data: agora,
      modo: a.modo,
      ...nota,
      marcas,
    });
  }

  proximo(): void {
    this.mudar(S.proximo);
  }

  /** "Sair" no meio da sessão. */
  sair(): void {
    const s = this._sessao();
    if (s) this._sessao.set(S.sair(s));
  }

  /** Fecha o resumo da sessão. */
  encerrar(): void {
    this._sessao.set(null);
  }

  private mudar(f: (s: S.Sessao) => S.Sessao): void {
    const s = this._sessao();
    if (s) this._sessao.set(f(s));
  }
}
