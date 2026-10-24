import { Page, expect, test } from '@playwright/test';
import { contaComExemplos, irPara } from './ajuda';

/** T8.1 / R15.2: em tela estreita nada rola para os lados e as colunas laterais descem. */

async function semRolagemLateral(page: Page, tela: string): Promise<void> {
  const sobra = await page.evaluate(() => {
    const main = document.querySelector('main') ?? document.documentElement;
    const doc = document.documentElement;
    return Math.max(main.scrollWidth - main.clientWidth, doc.scrollWidth - doc.clientWidth);
  });
  expect(sobra, `${tela} rola para os lados`).toBeLessThanOrEqual(1);
}

/** O elemento `b` começa abaixo do fim de `a`. */
async function estaAbaixo(page: Page, a: string, b: string): Promise<void> {
  const ca = await page.locator(a).first().boundingBox();
  const cb = await page.locator(b).first().boundingBox();
  expect(ca && cb && cb.y >= ca.y + ca.height - 1, `${b} deveria ficar abaixo de ${a}`).toBe(true);
}

test('telas no celular @celular', async ({ page }) => {
  await contaComExemplos(page);
  await semRolagemLateral(page, 'Matérias');

  await page.getByRole('link', { name: 'Atos administrativos' }).click();
  await expect(page.getByRole('toolbar')).toBeVisible();
  await semRolagemLateral(page, 'Editor');
  await estaAbaixo(page, '.conteudo', '.lista-trechos');
  await estaAbaixo(page, '.area-bloco', '.margem');

  for (const tela of ['Início', 'Estatísticas', 'Configurações']) {
    await irPara(page, tela);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await semRolagemLateral(page, tela);
  }

  await irPara(page, 'Revisão');
  await semRolagemLateral(page, 'Revisão');
  await page.getByRole('button', { name: 'Iniciar sessão' }).click();
  await page.getByRole('button', { name: 'Revelar' }).click();
  await semRolagemLateral(page, 'Sessão');
  await estaAbaixo(page, '.cartao', '.painel');

  // Rótulos de botões e tags não quebram linha.
  const quebrados = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('main .btn, main .tag'))
      .filter((el) => el.offsetParent && getComputedStyle(el).whiteSpace !== 'nowrap')
      .map((el) => el.textContent?.trim()),
  );
  expect(quebrados).toEqual([]);
});
