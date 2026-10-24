import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/** Foca o campo assim que ele aparece e seleciona o texto (para renomear direto). */
@Directive({ selector: 'input[appAutofocus]' })
export class Autofocus {
  constructor() {
    const el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
    afterNextRender(() => {
      el.focus();
      el.select();
    });
  }
}
