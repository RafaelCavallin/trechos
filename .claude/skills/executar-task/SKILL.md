---
name: executar-task
description: Tarefa — identifique e implemente a próxima tarefa de uma funcionalidade a partir do PRD, da TechSpec e do tasks.md, marcando-a como concluída ao final. Use quando o usuário pedir para executar, implementar ou começar uma tarefa/subtarefa, ou dar continuidade à implementação de uma funcionalidade. Não use para revisar (executar-review) nem validar em QA (executar-qa) o que já foi implementado.
argument-hint: --prd nome-da-funcionalidade
---

O argumento `--prd` identifica o slug da funcionalidade. Sem argumento, localize a pasta em `./tasks/prd-*/`. Os arquivos obrigatórios em `tasks/prd-[slug]/` são `prd.md`, `techspec.md` e `tasks.md`; se algum estiver ausente, pare e indique a skill correspondente (`/criar-prd`, `/criar-techspec` ou `/criar-tasks`).

Uma tarefa é uma **entrega incremental**, com dependências explícitas e testes próprios. Implemente todas as subtarefas e passe do plano à implementação assim que a abordagem estiver clara. Referencie o `techspec.md` em vez de repetir detalhes de implementação.

## Fluxo

1. **Selecionar a tarefa** — identifique a próxima tarefa não concluída no `tasks.md`; abra o arquivo `task_[num].md` correspondente e leia sua definição, subtarefas (`[num].1`, `[num].2`…), critérios de aceitação relacionados e testes.
   **Conclua quando:** a próxima tarefa e todas as suas subtarefas estiverem identificadas.

2. **Preparar** — leia o `CLAUDE.md` e as rules em `.claude/rules/` (`code-standards.md` e `tests.md`); revise o contexto do PRD e os requisitos da TechSpec para a tarefa; entenda as dependências de tarefas anteriores; leia os `.spec.ts` existentes ao lado do código que vai mudar e os auxiliares de `src/app/testing/fakes.ts` e `e2e/ajuda.ts`. Carregue somente as skills aplicáveis de `.claude/skills/` (`angular-developer`, `vitest`, `supabase`, `supabase-postgres-best-practices`, `playwright-cli`) e consulte na web a documentação das bibliotecas envolvidas quando necessário.
   Os testes de unidade e de integração não precisam de nada rodando. Só prepare o ambiente se a tarefa tiver migração, teste de banco ou E2E:
   - **Supabase**: é uma instância local única em Docker (portas 54321–54324). Rode `npx supabase status`; se estiver parado, suba com `npx supabase start` e registre que foi esta execução que subiu. Para aplicar uma migração nova, use `npx supabase migration up`, que não apaga dados. `npx supabase db reset` apaga os dados locais do usuário: só rode com a confirmação dele.
   - **Frontend**: o `npm run test:e2e` sobe o `npm start` na porta 4200 sozinho ou reaproveita o que já estiver rodando. Se a porta 4200 estiver ocupada por outro checkout (outra worktree), não rode os E2E: o `playwright.config.ts` tem a `baseURL` fixa em `http://localhost:4200` e testaria o código errado. Avise o usuário.
   **Conclua quando:** a abordagem estiver clara, o `CLAUDE.md` e as rules tiverem sido consultados, as skills aplicáveis estiverem carregadas e os serviços necessários estiverem disponíveis.

3. **Implementar** — implemente cada subtarefa na ordem, com o código e os testes juntos, seguindo `code-standards.md` (sem comentários, arquivos com até 100 linhas, funções com até 30, sem linhas em branco dentro de funções, constantes no lugar de valores mágicos) e as convenções do `CLAUDE.md` (pt-BR, textos do design §6, tokens de `src/styles.css`, toda escrita pelo `StudyStore`). Correção de bug começa por um teste que falha. Rode os testes do mais barato para o mais caro, como manda `tests.md`:
   1. o arquivo alterado: `npx ng test --watch=false --include <arquivo.spec.ts>`
   2. se mudou `domain/`: `npm run test:coverage` (mantém 100%)
   3. se mudou migração ou RLS: `npm run test:db`
   4. se a tarefa tiver E2E: `npx playwright test <arquivo> -g "<nome>"`
   5. no fim: `npx ng test --watch=false`, `npm run lint` e `npm run build`
   **Conclua quando:** toda subtarefa estiver implementada e as validações e os testes aplicáveis da tarefa passarem.

4. **Concluir e limpar** — marque como concluídas (`[x]`) todas as subtarefas e os testes aplicáveis no arquivo `task_[num].md`. Depois, marque a tarefa como concluída (`[x]`) no `tasks.md` e informe, em uma linha, o que foi implementado. Se a tarefa mudou um requisito `R*` ou um texto do design §6, avise o usuário para atualizar a especificação. Encerre somente o que esta execução iniciou: o `npm start` (se não foi reaproveitado) e o Supabase (`npx supabase stop`, só se ele estava parado no início). Não encerre processos do usuário nem de outra worktree. Faça essa limpeza também se a execução for interrompida ou bloqueada.
   **Conclua quando:** todas as subtarefas e os testes aplicáveis estiverem marcados no arquivo da tarefa, e a tarefa estiver marcada como concluída no `tasks.md`.
