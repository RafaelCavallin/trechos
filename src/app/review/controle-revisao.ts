import { InjectionToken, Signal } from '@angular/core';
import { ID } from '../domain/types';
import { Sessao } from './session';
import { TrechoEmRevisao } from './trecho-em-revisao';

export interface ControleRevisao {
  readonly sessao: Signal<Sessao | null>;
  readonly atual: Signal<TrechoEmRevisao | null>;
  readonly todosMarcados: Signal<boolean>;
  revelar(): void;
  marcar(id: ID, acertou: boolean): void;
  alternar(id: ID): void;
  marcarRestantes(): void;
  setRecall(texto: string): void;
  calcularNota(): Promise<void>;
  proximo(): void;
}

export const CONTROLE_REVISAO = new InjectionToken<ControleRevisao>('ControleRevisao');
