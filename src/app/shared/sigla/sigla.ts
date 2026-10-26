import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { newId } from '../../domain/ids';

const DISTANCIA_PX = 4;
const MARGEM_TELA_PX = 16;

const POSICOES: ConnectedPosition[] = [
  {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
    offsetY: DISTANCIA_PX,
  },
  {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
    offsetY: -DISTANCIA_PX,
  },
];

@Component({
  selector: 'app-sigla',
  imports: [CdkOverlayOrigin, CdkConnectedOverlay],
  templateUrl: './sigla.html',
  styleUrl: './sigla.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(mouseenter)': 'aberta.set(true)',
    '(mouseleave)': 'sair($event)',
    '(focusin)': 'aberta.set(true)',
    '(focusout)': 'aberta.set(false)',
    '(keydown.escape)': 'aberta.set(false)',
  },
})
export class Sigla {
  readonly texto = input.required<string>();
  readonly nota = input.required<string>();
  readonly negrito = input(false);
  protected readonly aberta = signal(false);
  protected readonly idNota = newId('nota');
  protected readonly posicoes = POSICOES;
  protected readonly margemTela = MARGEM_TELA_PX;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected sair(evento: MouseEvent): void {
    if (this.continuaDentro(evento.relatedTarget)) return;
    this.aberta.set(false);
  }

  private continuaDentro(destino: EventTarget | null): boolean {
    if (!(destino instanceof Element)) return false;
    return this.host.contains(destino) || !!destino.closest(`[data-sigla="${this.idNota}"]`);
  }
}
