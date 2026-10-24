# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

Trechos é um sistema de resumos com repetição espaçada (FSRS) em que a unidade de revisão é o **trecho**: uma parte do resumo que começa num título (H2). Interface, código, comentários, nomes de variáveis e commits ficam em **pt-BR**.

A especificação fica fora do git, em `Sistema de Resumos prototype/spec_sistema_de_resumos/`: `requirements.md` (R1–R15), `design.md` (modelo, algoritmos §3, telas §5, textos exatos §6, tokens §7) e `tasks.md` (fases). O código antigo cita requisitos e seções do design nos comentários (ex.: `R7.3`, `design §3.6`), o que ajuda a achar a regra na especificação. Código novo não leva comentários (veja os padrões de código abaixo). Os textos da interface devem seguir o design §6 à risca. `prototype/` é só referência visual: o design §10 lista as simplificações que **não** devem ser copiadas.

## Padrões de código

Os padrões de código ficam em [.claude/rules/code-standards.md](.claude/rules/code-standards.md). Siga-os ao escrever ou revisar código. Resumo das regras: sem comentários, arquivos e classes com até 100 linhas, funções com até 30, no máximo 3 níveis de if/else (use cláusulas de guarda), no máximo 3 parâmetros (acima disso, objeto de parâmetros), sem linhas em branco dentro de funções, constantes no lugar de números e strings mágicos, variáveis declaradas onde são usadas e nenhum dado sensível no código (vai no `.env`).

## Frontend e backend

É um repositório só, com um `package.json` na raiz. **Não há servidor próprio:** o frontend fala direto com o Supabase pelo `@supabase/supabase-js`, e a segurança fica no banco (RLS).

| Parte | Pastas | Papel | Tecnologias |
| --- | --- | --- | --- |
| Frontend | `src/` (app em `src/app/`, estilos globais em `src/styles.css`, config em `src/environments/`), `public/` (arquivos estáticos) | SPA com todas as telas e toda a regra de negócio (trechos, lacunas, FSRS, estatísticas) | Angular 22 (standalone, signals, OnPush), TypeScript 6, TipTap 3 (ProseMirror), `ts-fsrs`, `@angular/cdk`, ícones `@lucide/angular`, fontes `@fontsource` |
| Backend | `supabase/` (`config.toml`, `migrations/`, `tests/`) | Postgres com as tabelas e RLS, login (Supabase Auth, e-mail e senha), anexos (Storage, bucket `anexos`) | Supabase local em Docker, via CLI do Supabase (dependência de dev, roda com `npx supabase`), Postgres 17 |
| Testes E2E | `e2e/`, `playwright.config.ts` | Fluxos completos, acessibilidade e celular contra o app e o Supabase local | Playwright + `@axe-core/playwright` |

Ferramentas: Vitest 5 com jsdom (testes unitários, via `@angular/build:unit-test`), ESLint (`angular-eslint`), Prettier. Rotas em `src/app/app.routes.ts`: `/entrar`, `/` (Início), `/materias`, `/resumos/:id`, `/revisao`, `/estatisticas`, `/configuracoes`.

## Portas (ambiente local)

| Serviço | Endereço |
| --- | --- |
| App Angular (`npm start`) | http://localhost:4200 |
| API do Supabase (REST, Auth, Storage) | http://127.0.0.1:54321 (é o `supabaseUrl` em `src/environments/environment.ts`) |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Supabase Studio (painel do banco) | http://127.0.0.1:54323 |
| Mailpit (e-mails do Auth) | http://127.0.0.1:54324 |

`npx supabase status` mostra os endereços e as chaves do ambiente que está rodando.

## Como rodar

Pré-requisitos: Node 24 e npm 11 (`packageManager` no `package.json`), Docker rodando.

```bash
npm install                 # instala tudo, inclusive a CLI do Supabase e o Playwright
npx supabase start          # sobe o backend em Docker (precisa estar de pé para o app e para os testes E2E/banco)
npm start                   # frontend em http://localhost:4200 (ng serve, recarrega sozinho)
npx supabase stop           # para o backend
npx supabase db reset       # recria o banco local a partir das migrações (apaga os dados)
```

Na primeira vez, crie uma conta na tela `/entrar`. No ambiente local não há confirmação de e-mail. Mudança no banco é sempre uma nova migração em `supabase/migrations/` (`npx supabase migration new <nome>`), seguida de `npx supabase db reset`.

## Testes

As regras de testes ficam em [.claude/rules/tests.md](.claude/rules/tests.md). Siga-as ao escrever ou revisar testes. Resumo: todo código é coberto por testes (regra crítica), cobertura mínima de 80% com foco no que é crítico, princípios FIRST (rápidos, independentes, repetíveis, autovalidáveis), estrutura Given/When/Then ou AAA, ordem do mais barato para o mais caro e pirâmide de testes. Vitest para unidade e integração, Playwright para E2E.

```bash
npm test                    # testes unitários (Vitest), em modo watch
npx ng test --watch=false   # roda uma vez e sai
npx ng test --watch=false --include src/app/domain/trechos.spec.ts   # um arquivo
npx ng test --watch=false --filter '^Settings'                         # por nome de suíte/teste
npm run test:coverage       # cobertura de src/app/domain (mantida em 100%), relatório em coverage/
npm run test:db             # testes SQL do banco (pgTAP em supabase/tests, isolamento entre usuários via RLS)
npm run test:e2e            # Playwright + axe; sobe o `npm start` sozinho se não estiver rodando
npx playwright test e2e/fluxos.spec.ts -g "dividir"                  # um teste E2E
npm run lint                # ESLint (inclui regras de acessibilidade dos templates)
```

- Os testes unitários (`*.spec.ts` ao lado do código) não precisam do Supabase: usam `src/app/testing/fakes.ts`.
- `test:db` e `test:e2e` precisam do `npx supabase start`.
- Na primeira vez, os testes E2E pedem `npx playwright install chromium`. Cada teste E2E cria a própria conta (`e2e/ajuda.ts`). Os testes marcados com `@celular` rodam só no projeto `celular` (Pixel 7). Os demais rodam no projeto `desktop`.

## Build

```bash
npm run build               # build de produção em dist/trechos/browser/ (arquivos estáticos)
npm run watch               # build de desenvolvimento que recompila a cada mudança
```

O build é só o frontend estático. Por enquanto ele aponta para o Supabase local: para publicar, crie um `environment` de produção e troque com `fileReplacements` no `angular.json`.

## Arquitetura

**Camadas (de dentro para fora):**
- `src/app/domain/` só tem funções puras, sem Angular nem banco: tipos, divisão em trechos, lacunas dinâmicas, nota, saúde, validação de configurações. É a parte que precisa de 100% de cobertura.
- `scheduler/` adapta o `ts-fsrs` (`Agendador`) e monta a fila do dia.
- `review/` tem a lógica pura da sessão (`session.ts`) e o serviço que a conduz.
- `stats/` tem os cálculos de Início e Estatísticas.
- `editor/` tem o TipTap.
- `data/` tem o `StudyRepository` (Supabase) e `rows.ts`, que converte snake_case ↔ modelo.
- `core/` tem os serviços compartilhados.
- `pages/` tem uma pasta por tela.

**Estado:** o `core/study-store.ts` (`StudyStore`) é a única fonte de verdade no cliente. Ele carrega tudo do usuário quando o login muda, expõe *signals*, e toda escrita passa por ele: atualiza a tela de forma otimista, grava no repositório e desfaz com toast se o banco recusar. Coisas derivadas são `computed` e se recalculam sozinhas: `agendador` (depende da retenção configurada), `trechos` (todos os trechos com estado FSRS e retrievability) e a fila em `ReviewQueueService`. Por isso mudar uma configuração vale na hora em todas as telas.

**Modelo de conteúdo:**
- Um resumo é uma lista de `Bloco`s guardada como JSON na coluna `resumos.blocos`.
- O texto rico é uma lista de segmentos: `{k:'t'}` para texto (com `b` para negrito), `{k:'g', id}` para lacuna manual com **id estável** e `{k:'d'}` para lacuna dinâmica, que existe só na revisão e é determinística.
- **Trechos não são persistidos:** `splitTrechos` os deriva dos blocos a cada leitura. Um H2 inicia um trecho, a menos que tenha `merge`. Um H3 só inicia um trecho se tiver `split`.
- Só o `EstadoTrecho` (FSRS) é gravado, com a chave `resumoId:idDoBlocoInicial` (`trechoKey`). Por isso **ids de bloco e de lacuna precisam ser estáveis**. Trocar um id faz o trecho perder o histórico. "Dividir pelos subtítulos" copia o estado do trecho pai para as novas chaves.
- `RegistroRevisao.marcas` guarda o acerto de cada lacuna manual. As estatísticas por lacuna (pontos fracos, mapa de calor) saem daí.

**Editor:** há um editor TipTap por bloco (`editor/block-editor.ts`). Os blocos são a fonte da verdade e o TipTap é só a visão: `doc-conversion.ts` converte bloco ↔ documento, e a marca de lacuna (`gap-mark.ts`) carrega o id. A regra de edição de trecho já revisado (R7) roda quando o editor perde o foco: ela compara o texto ao focar com o texto ao sair.

**Banco:** as migrações ficam em `supabase/migrations/`. Toda tabela tem `user_id default auth.uid()` e RLS de dono, então o app **nunca envia `user_id`** e as consultas não filtram por usuário. Os checks do banco (faixas, limites) se repetem em `domain/settings.ts`. Os anexos ficam no Storage, bucket `anexos`, com caminho `userId/resumoId/...`. `src/environments/environment.ts` aponta para o Supabase local (a chave pública local não é segredo).

**Estilo:**
- O design system "Organic" fica em `src/styles.css`: tokens CSS e classes `.btn`, `.tag`, `.card`, `.seg`, `.input`, `.table`, `.dialog`, além dos estilos de blocos e lacunas, que valem no editor e na revisão.
- Use `accent-700` (e não `--color-accent`) para texto, fundo com texto e anel de foco. A terracota clara não passa no contraste de 4,5:1 (R15.3) e fica só para elementos decorativos.
- O ponto de quebra para celular é `max-width: 760px`. Abaixo dele, as colunas laterais descem para baixo do conteúdo.
- Os componentes são standalone, com `OnPush` e signals. Os testes de componente usam `testing/fakes.ts` (`fakeStudyRepo`, `provideFakeAuth`).
