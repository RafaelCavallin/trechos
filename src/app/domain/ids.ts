import { Bloco } from './types';

/** Id curto e único para blocos, lacunas e perguntas (ex.: "b-1f3a9c2e"). */
export function newId(prefixo: string): string {
  return `${prefixo}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Conteúdo de um resumo recém-criado (o mesmo do protótipo). */
export function blocosIniciais(): Bloco[] {
  return [
    { id: newId('b'), type: 'h2', segs: [{ k: 't', t: 'Primeiro trecho' }] },
    {
      id: newId('b'),
      type: 'p',
      segs: [
        {
          k: 't',
          t: 'Comece a escrever aqui. Selecione uma expressão e clique em Ocultar para transformá-la em lacuna.',
        },
      ],
    },
  ];
}
