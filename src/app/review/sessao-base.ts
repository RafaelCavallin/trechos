import { Injectable, computed, inject, signal } from '@angular/core';
import { StudyStore } from '../core/study-store';
import { allMarked } from '../domain/review';
import { ID } from '../domain/types';
import { Avaliacao, avaliarTrecho } from './avaliacao';
import { ControleRevisao } from './controle-revisao';
import * as S from './session';
import { trechoEmRevisao } from './trecho-em-revisao';

@Injectable()
export abstract class SessaoBase implements ControleRevisao {
  protected readonly store = inject(StudyStore);
  protected readonly _sessao = signal<S.Sessao | null>(null);
  readonly sessao = this._sessao.asReadonly();

  readonly atual = computed(() => {
    const s = this._sessao();
    if (!s || s.concluida) return null;
    return trechoEmRevisao({
      entrada: s.fila[s.indice],
      resumos: this.store.resumos(),
      assuntos: this.store.assuntos(),
      materias: this.store.materias(),
      densidade: this.store.config().densidade,
    });
  });

  readonly todosMarcados = computed(() => {
    const a = this.atual();
    const s = this._sessao();
    return !!a?.trecho && a.itens.length > 0 && !!s && allMarked(s.marcas, a.itens);
  });

  abstract calcularNota(agora?: Date): Promise<void>;

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

  proximo(): void {
    this.mudar(S.proximo);
  }

  protected avaliar(agora: Date): Avaliacao | null {
    const s = this._sessao();
    const a = this.atual();
    if (!s || !a?.trecho || s.resultado || !this.todosMarcados()) return null;
    const avaliacao = avaliarTrecho({
      sessao: s,
      atual: a,
      faixas: this.store.config().faixas,
      anterior: this.store.estados().find((e) => e.key === a.entrada.key),
      agendador: this.store.agendador(),
      agora,
    });
    this._sessao.set(S.registrarResultado(s, avaliacao.resultado));
    return avaliacao;
  }

  protected mudar(f: (s: S.Sessao) => S.Sessao): void {
    const s = this._sessao();
    if (s) this._sessao.set(f(s));
  }
}
