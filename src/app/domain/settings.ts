import { Configuracoes } from './types';

/**
 * Confere uma configuração antes de gravar (R14). Devolve a mensagem de erro
 * para o usuário, ou null se estiver tudo certo. Segue as mesmas regras do banco.
 */
export function configError(c: Configuracoes): string | null {
  const inteiroPositivo = (n: number) => Number.isInteger(n) && n > 0;

  if (!inteiroPositivo(c.limitePalavras) || !inteiroPositivo(c.limiteLacunas)) {
    return 'O limite do trecho precisa ser um número inteiro maior que zero.';
  }
  const { easy, good, hard } = c.faixas;
  if (![easy, good, hard].every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) {
    return 'As faixas da nota precisam ser números inteiros de 0 a 100.';
  }
  if (!(easy >= good && good >= hard)) {
    return 'As faixas precisam seguir a ordem: Fácil ≥ Lembrei ≥ Lembrei com esforço.';
  }
  if (!Number.isInteger(c.limiteEdicao) || c.limiteEdicao < 1 || c.limiteEdicao > 100) {
    return 'O limite de edição precisa ser um número inteiro de 1 a 100.';
  }
  if (!inteiroPositivo(c.limiteDiario)) {
    return 'O limite diário precisa ser um número inteiro maior que zero.';
  }
  return null;
}

/** Lê o valor de um campo numérico; vazio ou texto viram NaN (e a validação recusa). */
export function parseNumero(texto: string): number {
  const t = texto.trim();
  return t === '' ? NaN : Number(t.replace(',', '.'));
}
