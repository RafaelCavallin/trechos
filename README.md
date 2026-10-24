# Trechos

Sistema de resumos em que o **trecho** é a unidade de revisão (repetição espaçada com FSRS).
A especificação fica na pasta local `Sistema de Resumos prototype/spec_sistema_de_resumos/`, fora do git
(`requirements.md`, `design.md` e `tasks.md`, que lista as fases).

## Stack

- **Frontend:** Angular 22, Vitest, ESLint, Prettier; ícones `@lucide/angular`; fontes via `@fontsource`.
- **Editor:** TipTap (ProseMirror), um editor por bloco.
- **Dados e login:** Supabase rodando localmente em Docker (CLI do Supabase como dependência de dev). Anexos no Supabase Storage (bucket `anexos`).

## Rodando localmente

```bash
npm install
npx supabase start   # sobe o Supabase local (Docker). Studio: http://127.0.0.1:54323
npm start            # app em http://localhost:4200
```

Na primeira vez, crie uma conta na tela de entrar (no ambiente local não há confirmação por e-mail).
Para recriar o banco do zero com as migrações: `npx supabase db reset`.

Para parar o Supabase: `npx supabase stop`.

## Comandos

| Comando                 | O que faz                                                   |
| ----------------------- | ----------------------------------------------------------- |
| `npm start`             | servidor de desenvolvimento                                 |
| `npm test`              | testes (Vitest)                                             |
| `npm run test:coverage` | testes com cobertura do domínio                             |
| `npm run test:db`       | testes do banco (isolamento entre usuários)                 |
| `npm run test:e2e`      | testes E2E com Playwright (fluxos, acessibilidade, celular) |
| `npm run lint`          | ESLint                                                      |
| `npm run build`         | build de produção em `dist/`                                |

## Organização

- `src/styles.css` — design system Organic (tokens e classes) + ajustes globais.
- `src/app/layout/` — barra lateral, toast e diálogo de confirmação.
- `src/app/domain/` — regras do sistema em funções puras (trechos, lacunas, nota, saúde), 100% testadas.
- `src/app/editor/` — editor de resumo: um editor TipTap por bloco, marca de lacuna com id estável, conversão bloco ↔ documento e operações de bloco.
- `src/app/shared/` — componentes reutilizáveis (bloco só para leitura com todos os estados de lacuna, anexos).
- `src/app/review/` — sessão de revisão: lógica pura da sessão e o serviço que grava notas e estados.
- `src/app/stats/` — cálculos das telas Início e Estatísticas (saúde, pontos fracos, histórico, mapa de calor).
- `src/app/scheduler/` — agendamento: adaptador do FSRS (`ts-fsrs`) e montagem da fila do dia.
- `src/app/data/` — leitura e gravação no Supabase (`StudyRepository`).
- `src/app/core/` — serviços compartilhados (login, fila de revisão, `ToastService`, `ConfirmService`).
- `src/app/pages/` — uma pasta por tela (rotas em `app.routes.ts`).
- `supabase/` — configuração, migrações e testes do banco.
- `e2e/` — testes E2E (Playwright + axe). Precisam do Supabase local rodando; cada teste cria a própria conta.
  Na primeira vez: `npx playwright install chromium`.
