import { Extensions } from '@tiptap/core';
import { Bold } from '@tiptap/extension-bold';
import { BulletList, ListItem } from '@tiptap/extension-list';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import { Text } from '@tiptap/extension-text';
import { Gapcursor, UndoRedo } from '@tiptap/extensions';
import { GapMark } from './gap-mark';

/**
 * Cada bloco tem o seu próprio editor, com o documento restrito ao formato do bloco:
 * - linha: um único parágrafo (títulos, parágrafos, citações, especiais);
 * - lista: uma lista simples, sem níveis;
 * - tabela: células com um único parágrafo, primeira linha como cabeçalho.
 */
export type FormaDoc = 'linha' | 'lista' | 'tabela';

const comuns: Extensions = [Text, Paragraph, Bold, GapMark, UndoRedo];

export function extensionsFor(forma: FormaDoc): Extensions {
  switch (forma) {
    case 'linha':
      return [Document.extend({ content: 'paragraph' }), ...comuns];
    case 'lista':
      return [
        Document.extend({ content: 'bulletList' }),
        ...comuns,
        BulletList,
        ListItem.extend({ content: 'paragraph' }),
      ];
    case 'tabela':
      return [
        Document.extend({ content: 'table' }),
        ...comuns,
        Gapcursor,
        Table.configure({ resizable: false }),
        TableRow,
        TableHeader.extend({ content: 'paragraph' }),
        TableCell.extend({ content: 'paragraph' }),
      ];
  }
}
