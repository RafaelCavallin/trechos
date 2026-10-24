import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideChevronRight,
  LucideFile,
  LucideGripVertical,
  LucidePencil,
  LucidePlus,
  LucideTrash,
} from '@lucide/angular';
import { ConfirmService } from '../../core/confirm.service';
import { Nivel, StudyStore } from '../../core/study-store';
import { ToastService } from '../../core/toast.service';
import { healthBand } from '../../domain/health';
import { ID } from '../../domain/types';
import { dayLabel } from '../../scheduler/dates';
import { Autofocus } from '../../shared/autofocus';
import { NoAssunto, NoMateria, buildSubjectTree } from './subject-tree';

const CHAVE_RECOLHIDAS = 'trechos.materias.recolhidas';

const ROTULO: Record<Nivel, { nome: string; dentro: string }> = {
  materia: { nome: 'matéria', dentro: 'dentro dela' },
  assunto: { nome: 'assunto', dentro: 'dentro dele' },
  resumo: { nome: 'resumo', dentro: 'dentro dele' },
};

/** Tela Matérias (design §5.2): árvore Matéria → Assunto → Resumo. */
@Component({
  selector: 'app-subjects',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    Autofocus,
    LucideChevronRight,
    LucideFile,
    LucideGripVertical,
    LucidePencil,
    LucidePlus,
    LucideTrash,
  ],
  templateUrl: './subjects.html',
  styleUrl: './subjects.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Subjects {
  protected readonly store = inject(StudyStore);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly arvore = computed(() =>
    buildSubjectTree(
      this.store.materias(),
      this.store.assuntos(),
      this.store.resumos(),
      this.store.trechos(),
    ),
  );

  private readonly recolhidas = signal<ReadonlySet<ID>>(lerRecolhidas());
  protected readonly renomeando = signal<{ nivel: Nivel; id: ID } | null>(null);
  protected readonly texto = signal('');

  // ── Expandir / recolher ─────────────────────────────────────────────────

  protected aberta(id: ID): boolean {
    return !this.recolhidas().has(id);
  }

  protected alternar(id: ID): void {
    const novas = new Set(this.recolhidas());
    if (!novas.delete(id)) novas.add(id);
    this.recolhidas.set(novas);
    salvarRecolhidas(novas);
  }

  private abrir(id: ID): void {
    if (!this.aberta(id)) this.alternar(id);
  }

  // ── Criar (já abre o campo de renomear) ─────────────────────────────────

  protected async novaMateria(): Promise<void> {
    const m = await this.store.createMateria();
    if (m) this.comecarRenomear('materia', m.id, m.nome);
  }

  protected async novoAssunto(materiaId: ID): Promise<void> {
    this.abrir(materiaId);
    const a = await this.store.createAssunto(materiaId);
    if (a) this.comecarRenomear('assunto', a.id, a.nome);
  }

  protected async novoResumo(materiaId: ID, assuntoId: ID): Promise<void> {
    this.abrir(materiaId);
    const r = await this.store.createResumo(assuntoId);
    if (r) this.comecarRenomear('resumo', r.id, r.titulo);
  }

  protected async carregarExemplos(): Promise<void> {
    if (await this.store.loadExamples()) this.toast.show('Exemplos carregados.');
  }

  // ── Renomear: Enter ou sair do campo confirma; Esc cancela ──────────────

  protected editando(nivel: Nivel, id: ID): boolean {
    const r = this.renomeando();
    return r?.nivel === nivel && r.id === id;
  }

  protected comecarRenomear(nivel: Nivel, id: ID, nome: string): void {
    this.texto.set(nome);
    this.renomeando.set({ nivel, id });
  }

  protected async confirmarRenomear(): Promise<void> {
    const r = this.renomeando();
    if (!r) return;
    this.renomeando.set(null);
    await this.store.rename(r.nivel, r.id, this.texto());
  }

  protected cancelarRenomear(): void {
    this.renomeando.set(null);
  }

  // ── Excluir ─────────────────────────────────────────────────────────────

  protected async excluir(nivel: Nivel, id: ID, nome: string): Promise<void> {
    const { nome: tipo, dentro } = ROTULO[nivel];
    const ok = await this.confirm.ask({
      title: `Excluir ${tipo}?`,
      body: `“${nome}” e tudo o que estiver ${dentro} serão excluídos. Os trechos deixam de entrar na revisão.`,
    });
    if (ok && (await this.store.remove(nivel, id))) this.toast.show('Excluído.');
  }

  // ── Arrastar para reordenar (só entre irmãos) ───────────────────────────

  protected soltar(nivel: Nivel, ids: ID[], evento: CdkDragDrop<unknown>): void {
    if (evento.previousIndex === evento.currentIndex) return;
    const nova = [...ids];
    moveItemInArray(nova, evento.previousIndex, evento.currentIndex);
    void this.store.reorder(nivel, nova);
  }

  // ── Formatação ──────────────────────────────────────────────────────────

  protected pct(retencao: number | null): string {
    return retencao === null ? '—' : `${retencao}%`;
  }

  protected faixa(retencao: number | null): string {
    return retencao === null ? 'nenhuma' : healthBand(retencao);
  }

  protected proxima(d: Date): string {
    return dayLabel(d, this.store.agora());
  }

  protected plural(n: number, um: string, varios: string): string {
    return `${n} ${n === 1 ? um : varios}`;
  }

  protected idsMaterias(): ID[] {
    return this.arvore().map((m) => m.materia.id);
  }

  protected idsAssuntos(m: NoMateria): ID[] {
    return m.assuntos.map((a) => a.assunto.id);
  }

  protected idsResumos(a: NoAssunto): ID[] {
    return a.resumos.map((r) => r.resumo.id);
  }
}

function lerRecolhidas(): Set<ID> {
  try {
    return new Set(JSON.parse(localStorage.getItem(CHAVE_RECOLHIDAS) ?? '[]') as ID[]);
  } catch {
    return new Set();
  }
}

function salvarRecolhidas(ids: ReadonlySet<ID>): void {
  try {
    localStorage.setItem(CHAVE_RECOLHIDAS, JSON.stringify([...ids]));
  } catch {
    // Sem armazenamento local: o estado só vale nesta visita.
  }
}
