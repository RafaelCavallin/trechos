import { Extensions } from '@tiptap/core';
import { Placeholder } from '@tiptap/extensions';
import type { BlocoDeTexto } from './doc-conversion';

const ESCREVA_AQUI = 'Escreva aqui…';

export const DICA_DO_BLOCO: Record<BlocoDeTexto['type'], string | null> = {
  h2: 'Título do trecho',
  h3: 'Subtítulo',
  p: ESCREVA_AQUI,
  quote: ESCREVA_AQUI,
  special: ESCREVA_AQUI,
  list: ESCREVA_AQUI,
  table: null,
};

export function dicaDoBloco(tipo: BlocoDeTexto['type']): Extensions {
  const dica = DICA_DO_BLOCO[tipo];
  if (!dica) return [];
  return [
    Placeholder.configure({ placeholder: dica, showOnlyCurrent: false, includeChildren: true }),
  ];
}
