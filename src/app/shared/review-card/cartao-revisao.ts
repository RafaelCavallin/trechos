import { Injectable, computed, inject, signal } from '@angular/core';
import { ID } from '../../domain/types';
import { CONTROLE_REVISAO } from '../../review/controle-revisao';
import { visualDaLacuna } from '../../review/lacuna-visual';
import { podeMarcar } from '../../review/session';

@Injectable()
export class CartaoRevisao {
  readonly controle = inject(CONTROLE_REVISAO);
  readonly sessao = this.controle.sessao;
  readonly atual = this.controle.atual;
  readonly foco = signal(0);

  readonly marcando = computed(() => {
    const s = this.sessao();
    return !!s && podeMarcar(s);
  });

  readonly marcados = computed(() => {
    const marcas = this.sessao()?.marcas ?? {};
    return (this.atual()?.itens ?? []).filter((i) => marcas[i.id] !== undefined).length;
  });

  readonly visual = computed(() =>
    visualDaLacuna({ sessao: this.sessao(), itens: this.atual()?.itens ?? [], foco: this.foco() }),
  );

  revelar(): void {
    this.controle.revelar();
    this.foco.set(0);
  }

  marcar(indice: number, acertou: boolean): void {
    const item = this.atual()?.itens[indice];
    if (!item) return;
    this.controle.marcar(item.id, acertou);
    this.foco.set(indice);
  }

  marcarEAndar(acertou: boolean): void {
    this.marcar(this.foco(), acertou);
    this.mover(1);
  }

  mover(passo: number): void {
    const ultimo = Math.max(0, (this.atual()?.itens.length ?? 0) - 1);
    this.foco.set(Math.min(Math.max(this.foco() + passo, 0), ultimo));
  }

  clicarLacuna(id: ID): void {
    this.controle.alternar(id);
    const indice = this.atual()?.itens.findIndex((x) => x.id === id) ?? -1;
    if (indice >= 0) this.foco.set(indice);
  }

  marca(id: ID): 'acertou' | 'errou' | null {
    const valor = this.sessao()?.marcas[id];
    if (valor === undefined) return null;
    return valor ? 'acertou' : 'errou';
  }

  proximo(): void {
    this.controle.proximo();
    this.foco.set(0);
  }
}
