import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideEye,
  LucideEyeOff,
  LucideBookA,
  LucideImage,
  LucidePaperclip,
  LucidePencil,
  LucideTriangleAlert,
  LucideX,
} from '@lucide/angular';
import { ConfirmService } from '../../core/confirm.service';
import { StudyStore } from '../../core/study-store';
import { ToastService } from '../../core/toast.service';
import { changeRatio, editEffect } from '../../domain/change-ratio';
import { blockText } from '../../domain/text';
import {
  mergeWithPrevious,
  splitBySubtitles,
  trechoKey,
  trechoOfBlock,
  unmerge,
} from '../../domain/trechos';
import { Bloco, BlocoAnexo, ID, Segmento, Trecho } from '../../domain/types';
import {
  TipoNovoBloco,
  addQuestion,
  editQuestion,
  insertAfter,
  moveBlock,
  newAttachment,
  newBlock,
  removeBlock,
  removeQuestion,
  replaceBlock,
} from '../../editor/block-ops';
import { BlockEditor, OndeFocar, OperacaoTabela } from '../../editor/block-editor';
import { BlocoDeTexto } from '../../editor/doc-conversion';
import { mensagemDoResultado } from '../../editor/gap-toggle';
import { AlvoSigla, MENSAGEM_SIGLA, mensagemDaSigla } from '../../editor/sigla-command';
import { aplicarEdicao, herdarEstado } from '../../scheduler/fsrs';
import { Attachment } from '../../shared/attachment/attachment';
import { buildEditorView } from './editor-view';
import { QuestionForm, RascunhoPergunta } from './question-form';
import { SiglaForm } from './sigla-form';

/** Espera depois da última alteração antes de gravar no banco. */
export const ATRASO_SALVAR_MS = 700;

type Salvamento = 'salvo' | 'pendente' | 'salvando' | 'erro';

/** Editor de resumo (design §5.3, R2–R7). */
@Component({
  selector: 'app-summary-editor',
  imports: [
    RouterLink,
    BlockEditor,
    Attachment,
    QuestionForm,
    SiglaForm,
    LucideEye,
    LucideEyeOff,
    LucideBookA,
    LucideImage,
    LucidePaperclip,
    LucidePencil,
    LucideTriangleAlert,
    LucideX,
  ],
  templateUrl: './summary-editor.html',
  styleUrl: './summary-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:beforeunload)': 'avisarSaida($event)' },
})
export class SummaryEditor {
  /** Id do resumo, vindo da rota /resumos/:id. */
  readonly id = input.required<ID>();

  protected readonly store = inject(StudyStore);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly editores = viewChildren(BlockEditor);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly resumo = computed(() => this.store.resumos().find((r) => r.id === this.id()));
  protected readonly caminho = computed(() => {
    const assunto = this.store.assuntos().find((a) => a.id === this.resumo()?.assuntoId);
    const materia = this.store.materias().find((m) => m.id === assunto?.materiaId);
    return { assunto: assunto?.nome ?? '', materia: materia?.nome ?? '' };
  });
  private readonly blocos = computed(() => this.resumo()?.blocos ?? []);
  private readonly estados = computed(() => {
    const id = this.id();
    return new Map(
      this.store
        .trechos()
        .filter((t) => t.resumoId === id)
        .map((t) => [t.trecho.id, t.estado]),
    );
  });
  protected readonly visao = computed(() =>
    buildEditorView(
      this.blocos(),
      (tid) => this.estados().get(tid),
      this.store.config(),
      this.store.agora(),
    ),
  );

  protected readonly selecionado = signal<ID | null>(null);
  protected readonly cursorNaLacuna = signal(false);
  protected readonly perguntaEm = signal<ID | null>(null);
  protected readonly perguntaEditada = signal<ID | null>(null);
  protected readonly salvamento = signal<Salvamento>('salvo');
  protected readonly sigla = signal<AlvoSigla | null>(null);

  /** Último bloco de texto que teve foco: alvo de Ocultar e Negrito. */
  private ultimoEditor: ID | null = null;
  /** Texto de cada bloco quando ganhou foco, para a regra de edição (R7). */
  private readonly textoAoFocar = new Map<ID, string>();
  /** Bloco recém-criado que deve receber o cursor assim que o editor dele existir. */
  protected readonly focoPendente = signal<{ id: ID; onde: OndeFocar } | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private salvando = false;
  private sujo = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.sujo || this.timer) {
        clearTimeout(this.timer);
        void this.salvar();
      }
    });
  }

  // ── Salvamento automático ──────────────────────────────────────────────

  private atualizar(blocos: Bloco[]): void {
    this.store.setBlocos(this.id(), blocos);
    this.sujo = true;
    this.salvamento.set('pendente');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.salvar(), ATRASO_SALVAR_MS);
  }

  protected async salvar(): Promise<void> {
    this.timer = undefined;
    if (this.salvando) return;
    this.salvando = true;
    this.sujo = false;
    this.salvamento.set('salvando');
    const ok = await this.store.saveBlocos(this.id());
    this.salvando = false;
    if (!ok) {
      this.sujo = true;
      this.salvamento.set('erro');
    } else if (this.sujo) {
      void this.salvar();
    } else {
      this.salvamento.set('salvo');
    }
  }

  protected avisarSaida(evento: BeforeUnloadEvent): void {
    if (this.salvamento() !== 'salvo') evento.preventDefault();
  }

  // ── Barra de ferramentas (R2.1–R2.4, R3) ───────────────────────────────

  protected inserir(tipo: TipoNovoBloco): void {
    const novo = newBlock(tipo);
    this.atualizar(insertAfter(this.blocos(), this.selecionado(), novo));
    this.selecionado.set(novo.id);
    this.focoPendente.set({ id: novo.id, onde: 'tudo' });
  }

  private editorAtivo(): BlockEditor | undefined {
    return this.editores().find((e) => e.id === this.ultimoEditor);
  }

  protected ocultar(): void {
    const r = this.editorAtivo()?.ocultar() ?? { status: 'vazia' as const };
    this.toast.show(mensagemDoResultado(r));
  }

  protected aoMoverCursor(blocoId: ID, naLacuna: boolean): void {
    if (blocoId === this.ultimoEditor) this.cursorNaLacuna.set(naLacuna);
  }

  protected abrirSigla(): void {
    const alvo = this.editorAtivo()?.sigla() ?? 'vazia';
    if (typeof alvo === 'string') this.toast.show(MENSAGEM_SIGLA[alvo]);
    else this.sigla.set(alvo);
  }

  protected salvarSigla(nota: string): void {
    this.sigla.set(null);
    const resultado = this.editorAtivo()?.marcarSigla(nota) ?? { status: 'vazia' as const };
    this.toast.show(mensagemDaSigla(resultado));
  }

  protected cancelarSigla(): void {
    this.sigla.set(null);
    this.editorAtivo()?.voltarFoco();
  }

  protected negrito(): void {
    if (!this.editorAtivo()?.negrito()) this.toast.show('Selecione um texto para aplicar negrito.');
  }

  protected async anexar(kind: 'image' | 'file', evento: Event): Promise<void> {
    const campo = evento.target as HTMLInputElement;
    const arquivo = campo.files?.[0];
    campo.value = '';
    if (!arquivo) return;
    this.toast.show(`Enviando ${arquivo.name}…`);
    const caminho = await this.store.uploadAnexo(this.id(), arquivo);
    if (!caminho) return;
    const novo = newAttachment(kind, arquivo.name, caminho);
    this.atualizar(insertAfter(this.blocos(), this.selecionado(), novo));
    this.selecionado.set(novo.id);
    this.toast.show(`Anexo adicionado: ${arquivo.name}`);
  }

  // ── Edição dos blocos ──────────────────────────────────────────────────

  protected aoMudar(bloco: BlocoDeTexto): void {
    this.atualizar(replaceBlock(this.blocos(), bloco));
  }

  protected aoFocar(bloco: Bloco): void {
    if (this.focoPendente()?.id === bloco.id) this.focoPendente.set(null);
    this.ultimoEditor = bloco.id;
    this.selecionado.set(bloco.id);
    this.textoAoFocar.set(bloco.id, blockText(bloco));
  }

  /** Regra de edição de trecho já revisado (R7). */
  protected aoSair(blocoId: ID): void {
    const antes = this.textoAoFocar.get(blocoId);
    this.textoAoFocar.delete(blocoId);
    const bloco = this.blocos().find((b) => b.id === blocoId);
    const depois = bloco ? blockText(bloco) : undefined;
    if (antes === undefined || depois === undefined || antes === depois) return;

    const trecho = trechoOfBlock(this.visao().trechos, blocoId);
    if (!trecho) return;
    const key = trechoKey(this.id(), trecho.id);
    const estado = this.store.estados().find((e) => e.key === key);
    if (!estado || estado.S <= 0) return;

    const pct = changeRatio(antes, depois);
    const efeito = editEffect(estado.S, pct, this.store.config().limiteEdicao);
    if (efeito.reduzir) {
      void this.store.saveEstados([aplicarEdicao(estado, efeito.novoS, new Date())]);
      this.toast.show(
        `Trecho alterado em ${pct}%: estabilidade reduzida, volta para revisão hoje.`,
      );
    } else {
      this.toast.show(`Alteração de ${pct}%: estado de revisão mantido.`);
    }
  }

  protected aoDividir(
    bloco: BlocoDeTexto,
    partes: { antes: Segmento[]; depois: Segmento[] },
  ): void {
    const atual = { ...bloco, segs: partes.antes } as BlocoDeTexto;
    const novo: Bloco = { id: newBlock('p').id, type: 'p', segs: partes.depois };
    this.atualizar(insertAfter(replaceBlock(this.blocos(), atual), bloco.id, novo));
    this.selecionado.set(novo.id);
    this.focoPendente.set({ id: novo.id, onde: 'inicio' });
  }

  protected aoApagarVazio(bloco: Bloco): void {
    const blocos = this.blocos();
    const i = blocos.findIndex((b) => b.id === bloco.id);
    const anterior = blocos
      .slice(0, i)
      .reverse()
      .find((b) => b.type !== 'attach');
    this.atualizar(removeBlock(blocos, bloco.id));
    if (anterior) {
      this.selecionado.set(anterior.id);
      this.editores()
        .find((e) => e.id === anterior.id)
        ?.focar('fim');
    }
  }

  // ── Ações do bloco selecionado (R2.5) ──────────────────────────────────

  protected selecionar(id: ID): void {
    this.selecionado.set(id);
  }

  protected mover(id: ID, direcao: -1 | 1): void {
    const novos = moveBlock(this.blocos(), id, direcao);
    if (novos !== this.blocos()) this.atualizar([...novos]);
  }

  protected async excluirBloco(bloco: Bloco): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Excluir bloco?',
      body: 'O conteúdo deste bloco e as perguntas da margem dele serão excluídos.',
    });
    if (!ok) return;
    this.atualizar(removeBlock(this.blocos(), bloco.id));
    this.selecionado.set(null);
    if (bloco.type === 'attach' && bloco.url) void this.store.removeAnexos([bloco.url]);
    this.toast.show('Bloco excluído.');
  }

  protected tabela(id: ID, op: OperacaoTabela): void {
    this.editores()
      .find((e) => e.id === id)
      ?.tabela(op);
  }

  // ── Perguntas da margem (R4) ───────────────────────────────────────────

  protected abrirPergunta(id: ID): void {
    this.perguntaEditada.set(null);
    this.perguntaEm.set(id);
  }

  protected salvarPergunta(id: ID, { q, a }: RascunhoPergunta): void {
    this.atualizar(addQuestion(this.blocos(), id, q, a));
    this.perguntaEm.set(null);
    this.toast.show('Pergunta adicionada à margem — conta como item verificável.');
  }

  protected editarPergunta(perguntaId: ID): void {
    this.perguntaEm.set(null);
    this.perguntaEditada.set(perguntaId);
  }

  protected salvarEdicao(blocoId: ID, perguntaId: ID, rascunho: RascunhoPergunta): void {
    this.atualizar(editQuestion(this.blocos(), { blocoId, perguntaId, ...rascunho }));
    this.perguntaEditada.set(null);
  }

  protected removerPergunta(blocoId: ID, perguntaId: ID): void {
    this.atualizar(removeQuestion(this.blocos(), blocoId, perguntaId));
  }

  // ── Trechos (R5) ───────────────────────────────────────────────────────

  protected irPara(trechoId: ID): void {
    this.host.nativeElement
      .querySelector(`[data-trecho="${trechoId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected juntar(h2Id: ID): void {
    this.atualizar([...mergeWithPrevious(this.blocos(), h2Id)]);
  }

  protected separar(h2Id: ID): void {
    this.atualizar([...unmerge(this.blocos(), h2Id)]);
  }

  protected dividirPorSubtitulos(trecho: Trecho): void {
    const { blocos, novosTrechos } = splitBySubtitles(this.blocos(), trecho);
    this.atualizar([...blocos]);
    const original = this.store.estados().find((e) => e.key === trechoKey(this.id(), trecho.id));
    if (original) {
      void this.store.saveEstados(
        novosTrechos.map((id) => herdarEstado(original, trechoKey(this.id(), id))),
      );
    }
    this.toast.show(`Trecho dividido em ${novosTrechos.length + 1} pelos subtítulos.`);
  }

  // ── Template ───────────────────────────────────────────────────────────

  protected focoInicial(id: ID): OndeFocar | null {
    const f = this.focoPendente();
    return f?.id === id ? f.onde : null;
  }

  protected texto(bloco: Bloco): BlocoDeTexto | null {
    return bloco.type === 'attach' ? null : bloco;
  }

  protected anexo(bloco: Bloco): BlocoAnexo | null {
    return bloco.type === 'attach' ? bloco : null;
  }
}
