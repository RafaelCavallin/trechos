# Trechos

Sistema de resumos em que o **trecho** é a unidade de revisão (repetição espaçada com FSRS).
A especificação fica em [`Sistema de Resumos prototype/spec_sistema_de_resumos/`](Sistema%20de%20Resumos%20prototype/spec_sistema_de_resumos/)
(`requirements.md`, `design.md` e `tasks.md`, que lista as fases).

## Stack

- **Frontend:** Angular 22, Vitest, ESLint, Prettier; ícones `@lucide/angular`; fontes via `@fontsource`.
- **Dados e login:** Supabase rodando localmente em Docker (CLI do Supabase como dependência de dev).

## Rodando localmente

```bash
npm install
npx supabase start   # sobe o Supabase local (Docker). Studio: http://127.0.0.1:54323
npm start            # app em http://localhost:4200
```

Para parar o Supabase: `npx supabase stop`.

## Comandos

| Comando          | O que faz                    |
| ---------------- | ---------------------------- |
| `npm start`      | servidor de desenvolvimento  |
| `npm test`       | testes (Vitest)              |
| `npm run lint`   | ESLint                       |
| `npm run build`  | build de produção em `dist/` |

## Organização

- `src/styles.css` — design system Organic (tokens e classes) + ajustes globais.
- `src/app/layout/` — barra lateral, toast e diálogo de confirmação.
- `src/app/core/` — serviços compartilhados (`ToastService`, `ConfirmService`, fila de revisão).
- `src/app/pages/` — uma pasta por tela (rotas em `app.routes.ts`).
- `supabase/` — configuração e migrações do banco.
