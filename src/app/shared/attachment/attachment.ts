import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { LucidePaperclip } from '@lucide/angular';
import { StudyStore } from '../../core/study-store';
import { BlocoAnexo } from '../../domain/types';

/** Anexo do resumo: imagem com pré-visualização ou chip de arquivo (R2.4). */
@Component({
  selector: 'app-attachment',
  imports: [LucidePaperclip],
  template: `
    @if (bloco().kind === 'image') {
      <figure class="imagem">
        @if (url(); as src) {
          <img [src]="src" [alt]="bloco().name" />
        } @else {
          <div class="sem-previa">Imagem anexada</div>
        }
        <figcaption>{{ bloco().name }}</figcaption>
      </figure>
    } @else {
      <button type="button" class="chip" (click)="abrir()" [title]="'Abrir ' + bloco().name">
        <svg lucidePaperclip [size]="15" aria-hidden="true"></svg>
        <span>{{ bloco().name }}</span>
      </button>
    }
  `,
  styles: `
    .imagem {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    img,
    .sem-previa {
      border-radius: 28px;
    }
    img {
      max-height: 420px;
      width: auto;
      max-width: 100%;
      object-fit: contain;
      background: var(--color-neutral-100);
    }
    .sem-previa {
      height: 170px;
      display: grid;
      place-items: center;
      font-size: 13px;
      color: var(--color-neutral-700);
      background: repeating-linear-gradient(
        135deg,
        var(--color-neutral-200) 0 12px,
        var(--color-neutral-100) 12px 24px
      );
    }
    figcaption {
      font-size: 12px;
      color: var(--color-neutral-700);
      margin: 0;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border: 0;
      border-radius: 999px;
      background: var(--color-neutral-200);
      font-size: 14px;
      cursor: pointer;
      max-width: 100%;
    }
    .chip span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .chip:hover {
      background: var(--color-neutral-300);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Attachment {
  private readonly store = inject(StudyStore);
  readonly bloco = input.required<BlocoAnexo>();
  protected readonly url = signal<string | null>(null);

  constructor() {
    effect(() => {
      const { kind, url } = this.bloco();
      this.url.set(null);
      if (kind !== 'image' || !url) return;
      this.store.anexoUrl(url).then(
        (link) => this.url.set(link),
        (erro) => console.error(erro),
      );
    });
  }

  protected async abrir(): Promise<void> {
    const { url } = this.bloco();
    if (!url) return;
    // Abre a aba antes do await para não ser bloqueada como pop-up.
    const aba = window.open('', '_blank');
    try {
      const link = await this.store.anexoUrl(url);
      if (aba) aba.location.href = link;
    } catch (erro) {
      aba?.close();
      console.error(erro);
    }
  }
}
