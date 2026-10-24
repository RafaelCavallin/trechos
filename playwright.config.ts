import { defineConfig, devices } from '@playwright/test';

/**
 * Testes E2E (T8.3). Precisam do Supabase local rodando (`npx supabase start`).
 * Cada teste cria a própria conta, então podem rodar em paralelo sem se atrapalhar.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4200',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, grepInvert: /@celular/ },
    { name: 'celular', use: { ...devices['Pixel 7'] }, grep: /@celular/ },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
