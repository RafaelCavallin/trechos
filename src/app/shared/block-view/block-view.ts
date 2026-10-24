import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BlocoRevisao, ID, Segmento, SegmentoDinamico } from '../../domain/types';
import { Attachment } from '../attachment/attachment';
import { ROTULO_ESPECIAL } from '../labels';

/** Estados visuais de uma lacuna (design §5.3). */
export type EstadoLacuna =
  | 'editor'
  | 'oculta'
  | 'oculta-dinamica'
  | 'revelada'
  | 'revelada-dinamica'
  | 'acertou'
  | 'errou'
  | 'calor-0'
  | 'calor-1'
  | 'calor-2'
  | 'calor-3';

export interface VisualLacuna {
  estado: EstadoLacuna;
  /** Número mostrado na pílula quando a lacuna está oculta. */
  numero?: number;
  /** Dica ao passar o mouse (ex.: "Errada em 2 de 5 revisões"). */
  titulo?: string;
  clicavel?: boolean;
  /** Item com o foco do teclado na revisão. */
  focado?: boolean;
}

type SegmentoVisivel = Segmento | SegmentoDinamico;

const PADRAO = (): VisualLacuna => ({ estado: 'editor' });

/** Bloco do resumo só para leitura, com lacunas em qualquer estado (T4.1). */
@Component({
  selector: 'app-block-view',
  imports: [NgTemplateOutlet, Attachment],
  templateUrl: './block-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockView {
  readonly bloco = input.required<BlocoRevisao>();
  /** Como desenhar cada lacuna; por padrão, como no editor. */
  readonly lacuna = input<(seg: Exclude<SegmentoVisivel, { k: 't' }>) => VisualLacuna>(PADRAO);
  readonly lacunaClicada = output<ID>();

  protected readonly rotuloEspecial = ROTULO_ESPECIAL;

  protected visual(seg: Exclude<SegmentoVisivel, { k: 't' }>): VisualLacuna {
    return this.lacuna()(seg);
  }

  protected oculta(v: VisualLacuna): boolean {
    return v.estado === 'oculta' || v.estado === 'oculta-dinamica';
  }
}
