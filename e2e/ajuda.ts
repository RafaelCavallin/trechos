import { Locator, Page, expect } from '@playwright/test';

/** Cria uma conta nova pela tela de entrar e espera chegar no Início. */
export async function novaConta(page: Page): Promise<void> {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@teste.local`;
  await page.goto('/entrar');
  await page.getByRole('button', { name: 'Ainda não tenho conta' }).click();
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('senha-de-teste');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL('/');
}

/** Conta nova já com os resumos de exemplo do protótipo. */
export async function contaComExemplos(page: Page): Promise<void> {
  await novaConta(page);
  await irPara(page, 'Matérias');
  await page.getByRole('button', { name: 'Carregar exemplos' }).click();
  await expect(page.getByRole('heading', { name: 'Direito Administrativo' })).toBeVisible();
}

/** Navega pela barra lateral (no celular só o ícone aparece, mas o nome acessível é o mesmo). */
export async function irPara(page: Page, tela: string): Promise<void> {
  await page
    .getByRole('navigation', { name: 'Principal' })
    .getByRole('link', { name: tela })
    .click();
}

/** Dá nome ao item recém-criado na árvore (o campo já vem focado). */
async function nomear(page: Page, nome: string): Promise<void> {
  const campo = page.getByRole('textbox', { name: 'Novo nome' });
  await campo.fill(nome);
  await campo.press('Enter');
  await expect(campo).toBeHidden();
}

/** Matéria → assunto → resumo novos, e abre o resumo no editor. */
export async function criarResumo(page: Page, resumo: string): Promise<void> {
  await irPara(page, 'Matérias');
  await page.getByRole('button', { name: 'Nova matéria' }).click();
  await nomear(page, 'Geografia');
  await page.getByRole('button', { name: 'Novo assunto em Geografia' }).click();
  await nomear(page, 'Capitais');
  await page.getByRole('button', { name: 'Novo resumo em Capitais' }).click();
  await nomear(page, resumo);
  await page.getByRole('link', { name: resumo }).click();
  await expect(page.getByRole('heading', { level: 1, name: resumo })).toBeVisible();
}

/** Editor de texto (TipTap) do bloco que contém o texto dado. */
export function blocoComTexto(page: Page, texto: string | RegExp): Locator {
  return page.locator('.ProseMirror').filter({ hasText: texto });
}

/** Troca todo o texto de um bloco. */
export async function reescrever(page: Page, bloco: Locator, texto: string): Promise<void> {
  await bloco.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type(texto);
}

/** Seleciona as últimas `n` palavras do bloco focado, antes do ponto final, e clica em Ocultar. */
export async function ocultarUltimasPalavras(page: Page, n: number): Promise<void> {
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowLeft');
  for (let i = 0; i < n; i++) await page.keyboard.press('Control+Shift+ArrowLeft');
  await page.getByRole('toolbar').getByRole('button', { name: 'Ocultar' }).click();
}

/** Espera o editor gravar no banco. */
export async function esperarSalvo(page: Page): Promise<void> {
  await expect(page.getByRole('status').filter({ hasText: /^\s*Salvo\s*$/ })).toBeVisible();
}

/** Aviso temporário no rodapé. */
export function toast(page: Page): Locator {
  return page.locator('app-toast .toast');
}

/** Faz uma sessão de revisão inteira marcando tudo como acerto. */
export async function revisarTudoComoAcerto(page: Page): Promise<void> {
  await irPara(page, 'Revisão');
  await page.getByRole('button', { name: 'Iniciar sessão' }).click();
  for (;;) {
    await page.getByRole('button', { name: 'Revelar' }).click();
    await page.getByRole('button', { name: 'Marcar restantes como acerto' }).click();
    await page.getByRole('button', { name: 'Calcular nota' }).click();
    const proximo = page.getByRole('button', { name: /Próximo trecho|Ver resumo da sessão/ });
    const fim = (await proximo.textContent())?.includes('Ver resumo');
    await proximo.click();
    if (fim) break;
  }
}
