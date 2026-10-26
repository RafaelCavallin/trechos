import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Editor, Extension } from '@tiptap/core';
import { Segmento } from '../domain/types';
import { ROTULO_ESPECIAL } from '../shared/labels';
import {
  BlocoDeTexto,
  blockToDoc,
  docToBlock,
  formaDoBloco,
  inlineToSegs,
  splitInline,
} from './doc-conversion';
import { ResultadoOcultar } from './gap-mark';
import { lacunaParaDesocultar } from './gap-ranges';
import { alternarLacuna } from './gap-toggle';
import { dicaDoBloco } from './placeholder';
import { extensionsFor } from './schema';
import { AlvoSigla, FalhaSigla, ResultadoSigla, alvoDaSigla, marcarSigla } from './sigla-command';

export type OndeFocar = 'inicio' | 'fim' | 'tudo';
export type OperacaoTabela = 'linha+' | 'coluna+' | 'linha-' | 'coluna-';

const ROTULO_ACESSIVEL: Record<BlocoDeTexto['type'], string> = {
  h2: 'Título',
  h3: 'Subtítulo',
  p: 'Parágrafo',
  quote: 'Citação',
  special: 'Bloco especial',
  list: 'Lista',
  table: 'Tabela',
};

/** Só o conteúdo de texto do bloco (sem id, perguntas etc.), para comparar versões. */
function conteudo(b: BlocoDeTexto): string {
  if (b.type === 'list') return JSON.stringify(b.items);
  if (b.type === 'table') return JSON.stringify(b.rows);
  return JSON.stringify(b.segs);
}

/**
 * Um bloco de texto editável no próprio lugar, com o seu editor TipTap (T4.2).
 * O bloco que vem de fora é a fonte da verdade; o editor só é recarregado
 * quando o conteúdo muda por outro caminho (ex.: dividir um bloco).
 */
@Component({
  selector: 'app-block-editor',
  template: `
    @let b = bloco();
    @switch (b.type) {
      @case ('special') {
        <div class="bloco bloco-especial" [attr.data-kind]="b.kind">
          <div class="rotulo">{{ rotuloEspecial[b.kind] }}</div>
          <div #area></div>
        </div>
      }
      @case ('quote') {
        <div class="bloco bloco-quote"><div #area></div></div>
      }
      @case ('list') {
        <div class="bloco bloco-lista" #area></div>
      }
      @case ('table') {
        <div class="bloco bloco-tabela" #area></div>
      }
      @default {
        <div
          class="bloco"
          [class.bloco-h2]="b.type === 'h2'"
          [class.bloco-h3]="b.type === 'h3'"
          #area
        ></div>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      cursor: text;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockEditor {
  readonly bloco = input.required<BlocoDeTexto>();
  /** Onde pôr o cursor assim que o editor for criado (bloco recém-inserido). */
  readonly focoInicial = input<OndeFocar | null>(null);
  readonly mudou = output<BlocoDeTexto>();
  readonly focou = output<void>();
  readonly saiu = output<void>();
  /** Enter no meio de um bloco de linha: o texto depois do cursor vira um parágrafo novo. */
  readonly dividir = output<{ antes: Segmento[]; depois: Segmento[] }>();
  /** Backspace num bloco vazio. */
  readonly apagarVazio = output<void>();
  readonly lacunaNoCursor = output<boolean>();

  protected readonly rotuloEspecial = ROTULO_ESPECIAL;
  private readonly area = viewChild.required<ElementRef<HTMLElement>>('area');
  private readonly forma = computed(() => formaDoBloco(this.bloco()));
  private editor: Editor | null = null;
  private ultimoConteudo = '';

  get id(): string {
    return this.bloco().id;
  }

  constructor() {
    afterNextRender(() => this.criarEditor());
    inject(DestroyRef).onDestroy(() => this.editor?.destroy());

    // Conteúdo mudou por fora (dividir, desfazer de outra operação): recarrega o editor.
    effect(() => {
      const bloco = this.bloco();
      const novo = conteudo(bloco);
      if (!this.editor || novo === this.ultimoConteudo) return;
      this.ultimoConteudo = novo;
      this.editor.commands.setContent(blockToDoc(bloco), { emitUpdate: false });
    });
  }

  private criarEditor(): void {
    const bloco = this.bloco();
    this.ultimoConteudo = conteudo(bloco);
    this.editor = new Editor({
      element: this.area().nativeElement,
      extensions: [...extensionsFor(this.forma()), ...dicaDoBloco(bloco.type), this.atalhos()],
      content: blockToDoc(bloco),
      editorProps: {
        attributes: { 'aria-label': ROTULO_ACESSIVEL[bloco.type], 'aria-multiline': 'true' },
      },
      onUpdate: ({ editor }) => {
        const novo = docToBlock(this.bloco(), editor.getJSON());
        this.ultimoConteudo = conteudo(novo);
        this.mudou.emit(novo);
      },
      onFocus: ({ editor }) => {
        this.focou.emit();
        this.avisarLacuna(editor);
      },
      onTransaction: ({ editor }) => this.avisarLacuna(editor),
      onBlur: () => this.saiu.emit(),
    });
    const foco = this.focoInicial();
    if (foco) this.focar(foco);
  }

  private avisarLacuna(editor: Editor): void {
    this.lacunaNoCursor.emit(lacunaParaDesocultar(editor.state) !== null);
  }

  private atalhos(): Extension {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const comp = this;
    return Extension.create({
      name: 'atalhosDoBloco',
      addKeyboardShortcuts() {
        return {
          Enter: ({ editor }) => {
            if (comp.forma() === 'tabela') return editor.commands.goToNextCell();
            if (comp.forma() !== 'linha') return false;
            if (!editor.state.selection.empty) editor.commands.deleteSelection();
            const { $from } = editor.state.selection;
            const json = editor.getJSON().content?.[0]?.content;
            const [antes, depois] = splitInline(json, $from.parentOffset);
            const vistas = new Set<string>();
            const partes = {
              antes: inlineToSegs(antes, vistas),
              depois: inlineToSegs(depois, vistas),
            };
            // O texto depois do cursor sai deste bloco já, para nada digitado em seguida se perder.
            editor.commands.deleteRange({ from: $from.pos, to: $from.end() });
            comp.dividir.emit(partes);
            return true;
          },
          'Shift-Enter': () => true,
          Backspace: ({ editor }) => {
            if (comp.forma() !== 'linha' || !editor.isEmpty) return false;
            comp.apagarVazio.emit();
            return true;
          },
          'Mod-Shift-h': ({ editor }) => 'texto' in alternarLacuna(editor),
        };
      },
    });
  }

  // ── Comandos usados pela página (barra de ferramentas) ──────────────────

  focar(onde: OndeFocar): void {
    const ed = this.editor;
    if (!ed) return;
    if (this.forma() === 'tabela') {
      // Numa tabela, "tudo" seleciona o texto da primeira célula.
      const cel = this.celula(onde === 'fim' ? 'ultima' : 'primeira');
      if (cel)
        ed.chain()
          .focus()
          .setTextSelection(onde === 'tudo' ? cel : cel.to)
          .run();
      return;
    }
    if (onde === 'tudo') ed.chain().focus().selectAll().run();
    else ed.commands.focus(onde === 'inicio' ? 'start' : 'end');
  }

  /** Posições do texto da primeira ou da última célula da tabela. */
  private celula(qual: 'primeira' | 'ultima'): { from: number; to: number } | null {
    let achada: { from: number; to: number } | null = null;
    this.editor?.state.doc.descendants((node, pos) => {
      if (achada && qual === 'primeira') return false;
      if (node.type.name === 'paragraph')
        achada = { from: pos + 1, to: pos + 1 + node.content.size };
      return true;
    });
    return achada;
  }

  private cursorNaTabela(): boolean {
    const { $from } = this.editor!.state.selection;
    for (let d = $from.depth; d > 0; d--) {
      const nome = $from.node(d).type.name;
      if (nome === 'tableCell' || nome === 'tableHeader') return true;
    }
    return false;
  }

  temSelecao(): boolean {
    return !!this.editor && !this.editor.state.selection.empty;
  }

  ocultar(): ResultadoOcultar {
    return this.editor ? alternarLacuna(this.editor) : { status: 'vazia' };
  }

  sigla(): AlvoSigla | FalhaSigla {
    return this.editor ? alvoDaSigla(this.editor.state) : 'vazia';
  }

  marcarSigla(nota: string): ResultadoSigla {
    if (!this.editor) return { status: 'vazia' };
    const resultado = marcarSigla(this.editor, nota);
    this.voltarFoco();
    return resultado;
  }

  voltarFoco(): void {
    this.editor?.commands.focus();
  }

  negrito(): boolean {
    if (!this.temSelecao()) return false;
    return this.editor!.chain().focus().toggleBold().run();
  }

  tabela(op: OperacaoTabela): boolean {
    const ed = this.editor;
    if (!ed || this.forma() !== 'tabela') return false;
    // Sem cursor dentro de uma célula, age na última.
    if (!this.cursorNaTabela()) this.focar('fim');
    const cadeia = ed.chain().focus();
    switch (op) {
      case 'linha+':
        return cadeia.addRowAfter().run();
      case 'coluna+':
        return cadeia.addColumnAfter().run();
      case 'linha-':
        return cadeia.deleteRow().run();
      case 'coluna-':
        return cadeia.deleteColumn().run();
    }
  }
}
