import AxeBuilder from '@axe-core/playwright';
import { Page, expect, test } from '@playwright/test';
import { contaComExemplos, irPara } from './ajuda';

/** T8.2 / R15.3: nenhuma violação do axe (contraste, rótulos, estrutura) em cada tela. */

async function semViolacoes(page: Page, tela: string): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const resumo = violations.map(
    (v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );
  expect(resumo, `violações em ${tela}`).toEqual([]);
}

test('todas as telas passam no axe', async ({ page }) => {
  await page.goto('/entrar');
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
  await semViolacoes(page, 'Entrar');

  await contaComExemplos(page);
  await semViolacoes(page, 'Matérias');

  await page.getByRole('link', { name: 'Atos administrativos' }).click();
  await expect(page.getByRole('toolbar')).toBeVisible();
  await semViolacoes(page, 'Editor');

  await irPara(page, 'Início');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('para revisar hoje');
  await semViolacoes(page, 'Início');

  await irPara(page, 'Revisão');
  await page.getByRole('button', { name: 'Iniciar sessão' }).click();
  await semViolacoes(page, 'Sessão');
  await page.getByRole('button', { name: 'Revelar' }).click();
  await semViolacoes(page, 'Sessão revelada');
  await page.getByRole('button', { name: 'Marcar restantes como acerto' }).click();
  await page.getByRole('button', { name: 'Calcular nota' }).click();
  await semViolacoes(page, 'Nota calculada');

  await irPara(page, 'Estatísticas');
  await expect(page.getByRole('heading', { name: 'Estatísticas' })).toBeVisible();
  await semViolacoes(page, 'Estatísticas');

  await irPara(page, 'Configurações');
  await expect(page.getByRole('heading', { name: 'Retenção desejada' })).toBeVisible();
  await semViolacoes(page, 'Configurações');
});

test('sessão de revisão só com o teclado', async ({ page }) => {
  await contaComExemplos(page);
  await irPara(page, 'Revisão');
  await page.getByRole('button', { name: 'Iniciar sessão' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/^Trecho 1 de \d+$/)).toBeVisible();

  await page.keyboard.press('Space');
  const calcular = page.getByRole('button', { name: 'Calcular nota' });
  await expect(calcular).toBeDisabled();

  // "1" marca o item focado como acerto e passa para o próximo.
  const painel = page.getByRole('complementary', { name: 'Itens verificáveis' });
  const total = await painel.locator('.item').count();
  for (let i = 0; i < total; i++) await page.keyboard.press('1');
  await expect(calcular).toBeEnabled();

  await page.keyboard.press('Enter');
  await expect(page.locator('.resultado')).toContainText('100%');
  await page.keyboard.press('Enter');
  await expect(page.getByText(/^Trecho 2 de \d+$/)).toBeVisible();
});
