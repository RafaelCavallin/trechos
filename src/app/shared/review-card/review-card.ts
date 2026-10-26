import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { AcaoAtalho, acaoDoAtalho } from '../../review/atalhos';
import { TEXTO_MODO } from '../../review/session';
import { instrucaoDoCartao, mostraBlocos, partesDoTrecho } from '../../review/textos-cartao';
import { BlockView } from '../block-view/block-view';
import { CartaoRevisao } from './cartao-revisao';
import { GradeActions } from './grade-actions';
import { ItemsPanel } from './items-panel';
import { QuestionList } from './question-list';

const ALVOS_DE_DIGITACAO = 'input, textarea, [contenteditable="true"]';

@Component({
  selector: 'app-review-card',
  imports: [BlockView, GradeActions, ItemsPanel, QuestionList],
  templateUrl: './review-card.html',
  styleUrl: './review-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CartaoRevisao],
  host: { '(document:keydown)': 'atalho($event)' },
})
export class ReviewCard {
  readonly rotuloFim = input('Ver resumo da sessão');
  protected readonly cartao = inject(CartaoRevisao);
  protected readonly controle = this.cartao.controle;
  protected readonly textoModo = TEXTO_MODO;
  protected readonly partes = computed(() => partesDoTrecho(this.cartao.atual()?.blocos ?? []));

  protected readonly semItens = computed(() => {
    const a = this.cartao.atual();
    return !!a?.trecho && a.itens.length === 0;
  });

  protected readonly instrucao = computed(() => {
    const s = this.cartao.sessao();
    const a = this.cartao.atual();
    return s && a ? instrucaoDoCartao(s, a.modo) : '';
  });

  protected readonly mostrarBlocos = computed(() => {
    const s = this.cartao.sessao();
    const a = this.cartao.atual();
    return !!s && !!a?.trecho && mostraBlocos(s, a.modo);
  });

  protected atalho(e: KeyboardEvent): void {
    const sessao = this.cartao.sessao();
    if (!sessao || this.semItens() || e.ctrlKey || e.metaKey || e.altKey) return;
    const alvo = e.target instanceof Element ? e.target : null;
    if (alvo?.closest(ALVOS_DE_DIGITACAO)) return;
    const tecla = { key: e.key, emBotao: !!alvo?.closest('button, a') };
    const acao = acaoDoAtalho(tecla, { sessao, todosMarcados: this.controle.todosMarcados() });
    if (!acao) return;
    this.executar(acao);
    e.preventDefault();
  }

  private executar(acao: AcaoAtalho): void {
    const acoes: Record<AcaoAtalho, () => void> = {
      revelar: () => this.cartao.revelar(),
      acertou: () => this.cartao.marcarEAndar(true),
      errou: () => this.cartao.marcarEAndar(false),
      descer: () => this.cartao.mover(1),
      subir: () => this.cartao.mover(-1),
      calcular: () => void this.controle.calcularNota(),
      proximo: () => this.cartao.proximo(),
    };
    acoes[acao]();
  }
}
