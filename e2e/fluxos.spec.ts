import { expect, test } from '@playwright/test';
import {
  blocoComTexto,
  contaComExemplos,
  criarResumo,
  esperarSalvo,
  irPara,
  NOME_DE_TESTE,
  novaConta,
  ocultarUltimasPalavras,
  reescrever,
  revisarTudoComoAcerto,
  toast,
} from './ajuda';

/** Fluxos principais do T8.3, de ponta a ponta, contra o Supabase local. */

test('criar resumo → ocultar lacuna → trecho entra na fila → revisar → nota → próxima data', async ({
  page,
}) => {
  await novaConta(page);
  await criarResumo(page, 'Capitais do Brasil');

  // Sem lacunas o trecho não tem itens e não entra na revisão.
  await expect(page.getByText(/^Sem itens verificáveis/)).toBeVisible();

  await reescrever(
    page,
    blocoComTexto(page, 'Comece a escrever'),
    'A capital do Brasil é Brasília.',
  );
  await ocultarUltimasPalavras(page, 1);
  await expect(toast(page)).toHaveText('Lacuna criada: “Brasília”');
  await expect(page.getByText(/^Sem itens verificáveis/)).toBeHidden();
  await esperarSalvo(page);

  // O trecho novo entra na fila no mesmo dia.
  const nav = page.getByRole('navigation', { name: 'Principal' });
  await expect(nav.getByRole('link', { name: /Revisão\s*1 trechos na fila/ })).toBeVisible();
  await irPara(page, 'Revisão');
  await expect(page.getByText('Primeiro trecho').first()).toBeVisible();

  await page.getByRole('button', { name: 'Iniciar sessão' }).click();
  await expect(page.getByText('Trecho 1 de 1')).toBeVisible();
  await page.getByRole('button', { name: 'Revelar' }).click();
  await expect(page.getByRole('button', { name: 'Calcular nota' })).toBeDisabled();
  await page.getByRole('button', { name: 'Marcar restantes como acerto' }).click();
  await page.getByRole('button', { name: 'Calcular nota' }).click();

  const resultado = page.locator('.resultado');
  await expect(resultado).toContainText('100%');
  await expect(resultado).toContainText('Fácil');
  await expect(resultado).toContainText(/Próxima revisão: \d+ \S+ \(em \d+ dias\)/);

  await page.getByRole('button', { name: 'Ver resumo da sessão' }).click();
  await expect(page.getByRole('heading', { name: '1 trecho revisado' })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar ao início' }).click();
  await irPara(page, 'Revisão');
  await expect(page.getByRole('heading', { name: 'Tudo em dia' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Revisão', exact: true })).toBeVisible();
});

test('ajustar lacuna, recarregar e depois desocultar', async ({ page }) => {
  const ocultarOuAjustar = page.getByRole('toolbar').getByRole('button', { name: 'Ocultar' });
  const lacunas = page.locator('.ProseMirror .lacuna');
  await novaConta(page);
  await criarResumo(page, 'Segurança cibernética');
  await reescrever(page, blocoComTexto(page, 'Comece a escrever'), 'Ações de formação de cultura.');
  await page.keyboard.press('ArrowLeft');
  for (let i = 0; i < 'ormação de cultura'.length; i++)
    await page.keyboard.press('Shift+ArrowLeft');
  await ocultarOuAjustar.click();
  await expect(toast(page)).toHaveText('Lacuna criada: “ormação de cultura”');
  await page.keyboard.press('Shift+ArrowLeft');
  for (let i = 0; i < 'formação de cultura'.length; i++)
    await page.keyboard.press('Shift+ArrowLeft');
  await ocultarOuAjustar.click();
  await expect(toast(page)).toHaveText('Lacuna ajustada: “formação de cultura”');
  await esperarSalvo(page);
  await page.reload();
  await expect(lacunas).toHaveText(['formação de cultura']);
  await lacunas.click();
  await page.getByRole('toolbar').getByRole('button', { name: 'Desocultar' }).click();
  await expect(toast(page)).toHaveText('Lacuna desfeita: “formação de cultura”');
  await expect(lacunas).toHaveCount(0);
  await expect(blocoComTexto(page, 'Ações de formação de cultura.')).toBeVisible();
  await expect(page.getByText(/^Sem itens verificáveis/)).toBeVisible();
});

test('dividir trecho longo pelos subtítulos', async ({ page }) => {
  await contaComExemplos(page);

  // Limite menor nas Configurações: vale na hora no editor.
  await irPara(page, 'Configurações');
  const limite = page.getByRole('spinbutton', { name: 'Palavras por trecho' });
  await limite.fill('100');
  await limite.blur();

  await irPara(page, 'Matérias');
  await page.getByRole('link', { name: 'Atos administrativos' }).click();
  const aviso = page.getByText('Trecho acima do limite: 150 de 100 palavras.');
  await expect(aviso).toBeVisible();
  await expect(page.getByText('4 trechos', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Dividir pelos subtítulos' }).click();
  await expect(toast(page)).toHaveText(/^Trecho dividido em \d+ pelos subtítulos\.$/);
  const partes = Number(/em (\d+)/.exec((await toast(page).textContent()) ?? '')?.[1]);
  expect(partes).toBeGreaterThan(1);
  await expect(aviso).toBeHidden();
  await expect(page.getByText(`${3 + partes} trechos`, { exact: true })).toBeVisible();
  await esperarSalvo(page);

  // A divisão foi gravada: continua dividido depois de recarregar.
  await page.reload();
  await expect(page.getByText(`${3 + partes} trechos`, { exact: true })).toBeVisible();
});

test('editar trecho já revisado: pouco mantém o estado, muito volta para hoje', async ({
  page,
}) => {
  await novaConta(page);
  await criarResumo(page, 'Capitais');
  await reescrever(
    page,
    blocoComTexto(page, 'Comece a escrever'),
    'A capital do Brasil é Brasília.',
  );
  await ocultarUltimasPalavras(page, 1);
  await esperarSalvo(page);
  await revisarTudoComoAcerto(page);

  await irPara(page, 'Matérias');
  await page.getByRole('link', { name: 'Capitais', exact: true }).click();
  const titulo = page.getByRole('heading', { level: 1 });
  const cabecalho = page.locator('.cabecalho .meta').first();
  await expect(cabecalho).toContainText(/próxima (?!hoje)/);
  const bloco = blocoComTexto(page, 'A capital do Brasil');

  // Edição pequena (troca o ponto final): estado mantido.
  await bloco.click();
  await page.keyboard.press('End');
  await page.keyboard.press('Backspace');
  await page.keyboard.type('!');
  await titulo.click();
  await expect(toast(page)).toHaveText(/^Alteração de \d+%: estado de revisão mantido\.$/);
  await expect(cabecalho).toContainText(/próxima (?!hoje)/);

  // Edição grande (texto novo no começo): estabilidade reduzida, revisão hoje.
  await bloco.click();
  await page.keyboard.press('Home');
  await page.keyboard.type('Desde 1960, quando deixou de ser o Rio de Janeiro, ');
  await titulo.click();
  await expect(toast(page)).toHaveText(
    /^Trecho alterado em \d+%: estabilidade reduzida, volta para revisão hoje\.$/,
  );
  await expect(cabecalho).toContainText('próxima hoje');
});

test('criar conta com nome mostra a saudação no Início', async ({ page }) => {
  await novaConta(page);
  await expect(page.getByText(`Olá, ${NOME_DE_TESTE}`)).toBeVisible();
});
