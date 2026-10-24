import { Card, FSRS, Grade, Rating, State, fsrs, generatorParameters } from 'ts-fsrs';
import { Configuracoes, EstadoTrecho, Nota } from '../domain/types';
import { daysBetween } from './dates';

const RATING: Record<Nota, Grade> = {
  Again: Rating.Again,
  Hard: Rating.Hard,
  Good: Rating.Good,
  Easy: Rating.Easy,
};

/**
 * Adaptador entre o estado do trecho e a biblioteca `ts-fsrs` (R12, design §3.6).
 * Agenda por dias: sem passos de minutos, então "Não lembrei" volta amanhã.
 */
export class Agendador {
  private readonly fsrs: FSRS;

  constructor(retencao: Configuracoes['retencao']) {
    this.fsrs = fsrs(
      generatorParameters({
        request_retention: retencao,
        enable_short_term: false,
        enable_fuzz: false,
      }),
    );
  }

  /** Estado de um trecho que acabou de surgir: entra na revisão hoje (R8.3). */
  static novo(key: string, agora: Date): EstadoTrecho {
    return { key, S: 0, D: 0, due: agora, reps: 0, lapses: 0 };
  }

  /** Novo estado depois de uma revisão com a nota dada. */
  revisar(estado: EstadoTrecho, nota: Nota, agora: Date): EstadoTrecho {
    const { card } = this.fsrs.next(toCard(estado), agora, RATING[nota]);
    return fromCard(estado.key, card);
  }

  /** Probabilidade (0–1) de lembrar agora; null se o trecho nunca foi revisado. */
  retrievability(estado: EstadoTrecho, agora: Date): number | null {
    if (estado.reps === 0 || !estado.lastReview) return null;
    return this.fsrs.get_retrievability(toCard(estado), agora, false);
  }

  /** Em quantos dias um trecho com essa estabilidade volta (exemplo de R14.1). */
  intervaloPara(S: number): number {
    return this.fsrs.next_interval(S, 0);
  }
}

/** Edição grande num trecho revisado (R7.3): estabilidade reduzida e revisão hoje. */
export function aplicarEdicao(estado: EstadoTrecho, novoS: number, agora: Date): EstadoTrecho {
  return { ...estado, S: novoS, due: agora };
}

/** "Dividir pelos subtítulos": os novos trechos herdam o estado do original (R5.5). */
export function herdarEstado(original: EstadoTrecho, novaKey: string): EstadoTrecho {
  return { ...original, key: novaKey };
}

function toCard(e: EstadoTrecho): Card {
  const nunca = e.reps === 0;
  return {
    due: e.due,
    stability: e.S,
    difficulty: e.D,
    elapsed_days: 0,
    scheduled_days: e.lastReview ? Math.max(0, daysBetween(e.lastReview, e.due)) : 0,
    learning_steps: 0,
    reps: e.reps,
    lapses: e.lapses,
    state: nunca ? State.New : State.Review,
    last_review: e.lastReview,
  };
}

function fromCard(key: string, c: Card): EstadoTrecho {
  return {
    key,
    S: c.stability,
    D: c.difficulty,
    due: c.due,
    lastReview: c.last_review,
    reps: c.reps,
    lapses: c.lapses,
  };
}
