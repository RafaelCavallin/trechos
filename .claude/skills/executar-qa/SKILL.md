---
name: executar-qa
description: "QA — valide e estabilize uma funcionalidade implementada contra o PRD, a TechSpec e as tarefas: testes de unidade, de integração, de banco e E2E, navegação real com o playwright-cli, acessibilidade, celular, correção dos bugs encontrados e um relatório final com evidências. Use quando o usuário pedir para executar QA. Não use para implementar novas tarefas nem para revisar o código (executar-review)."
argument-hint: --prd nome-da-funcionalidade
---

O argumento `--prd` identifica o slug da funcionalidade. Sem argumento, localize a pasta em `./tasks/prd-*/`. Leia o `CLAUDE.md` do projeto. Em `tasks/prd-[slug]/`, leia `prd.md`, `techspec.md` e `tasks.md`; gere e mantenha o `qa.md` com os defeitos, as correções, os testes de regressão e as evidências. Salve todas as evidências (capturas de tela) em `tasks/prd-[slug]/evidences/`.

O QA vem depois da implementação e antes da revisão de código (PRD → TechSpec → tasks → task → QA → review). Se ainda houver tarefa não concluída no `tasks.md`, pare e indique `/executar-task`.

O QA só estará **APROVADO** quando todos os critérios de aceitação do PRD tiverem sido verificados e estiverem atendidos. Se encontrar bugs, corrija-os na causa raiz, crie testes de regressão e repita a validação. Para navegar pela interface, use a skill `playwright-cli` (carregue-a antes do primeiro uso).

## Fluxo

1. **Analisar** — leia o `CLAUDE.md`, as rules em `.claude/rules/` (`code-standards.md` e `tests.md`), o PRD, a TechSpec e cada arquivo de tarefa; monte um checklist com um item de verificação por critério de aceitação (`CA-*`) e associe os casos de teste correspondentes (`TU-*`, `TI-*`, `TB-*` e `E2E-*`). Anote os textos da interface do PRD e do design §6 que as telas devem mostrar.
   **Conclua quando:** houver um item de verificação e pelo menos um caso de teste associado a cada critério de aceitação do PRD.

2. **Preparar o ambiente** — o app depende do Supabase local, uma instância única em Docker:
   - Rode `npx supabase status`; se estiver parado, suba com `npx supabase start` e registre que foi esta execução que subiu. Aplique migrações pendentes com `npx supabase migration up`. `npx supabase db reset` apaga os dados locais do usuário: só rode com a confirmação dele.
   - Se a porta 4200 já estiver servindo este checkout, reaproveite. Se estiver livre, suba `npm start` em segundo plano e registre o processo. Se for de outro checkout (outra worktree), pare e avise o usuário: o `playwright.config.ts` tem a `baseURL` fixa em `http://localhost:4200`.
   - Abra `http://localhost:4200/entrar` com o `playwright-cli` e crie uma conta nova só para o QA (e-mail como `qa-[slug]-[data]@exemplo.com`); no ambiente local não há confirmação de e-mail. Nunca use a conta do usuário.
   **Conclua quando:** o app e o Supabase responderem, a tela Início estiver carregada com a conta de QA e as URLs usadas estiverem registradas.

3. **Testar cada fluxo na interface** — para cada critério de aceitação com fluxo de interface, siga o caso E2E correspondente pelo `playwright-cli` e confira o resultado na tela, com os textos exatos. Quando o fluxo grava dados, confira também o banco pelo Supabase Studio (`http://127.0.0.1:54323`) ou pelo `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres`. Quando houver comportamento inesperado, investigue o estado da interface, o console do navegador, as requisições ao Supabase (`127.0.0.1:54321`) e as respostas antes de registrar ou corrigir o bug. Capture uma evidência, salve-a em `tasks/prd-[slug]/evidences/`, marque o resultado como PASSOU ou FALHOU e registre cada falha no `qa.md`.
   **Conclua quando:** todo critério de aceitação com fluxo de interface estiver marcado como PASSOU ou FALHOU, com evidência.

4. **Executar os testes automatizados** — rode os casos da TechSpec com os comandos do `CLAUDE.md`:
   - `npx ng test --watch=false` — unidade e integração (`TU-*`, `TI-*`)
   - `npm run test:coverage` — `domain/` em 100%; `npx ng test --watch=false --coverage` — `src/` em no mínimo 80%
   - `npm run test:db` — banco e isolamento entre usuários pela RLS (`TB-*`)
   - `npm run test:e2e` — fluxos, axe e celular (`E2E-*`)

   Registre o resultado de cada caso no checklist e cada falha no `qa.md`.
   **Conclua quando:** todos os casos associados aos critérios tiverem sido executados ou estiverem explicitamente bloqueados.

5. **Verificar acessibilidade** — em cada tela afetada, use o `playwright-cli` para testar o teclado e conferir rótulos e semântica, além do axe dos E2E (`e2e/acessibilidade.spec.ts`) e das regras de template do `npm run lint`:
   - [ ] Navegação por teclado (Tab, Enter, Esc), com anel de foco visível (`accent-700`)
   - [ ] Elementos interativos com nome acessível descritivo em pt-BR
   - [ ] Imagens e anexos com texto alternativo (`alt`) apropriado
   - [ ] Contraste de 4,5:1 para texto (R15.3): a terracota clara (`--color-accent`) só em elementos decorativos
   - [ ] Formulários com rótulos associados aos campos
   - [ ] Diálogos modais prendem o foco e fecham com Esc; toasts são anunciados
   - [ ] Fontes com tamanho apropriado

   **Conclua quando:** cada item tiver sido verificado em cada tela afetada.

6. **Verificar visual e celular** — capture as telas afetadas, salve-as em `tasks/prd-[slug]/evidences/` e cubra os estados (vazio, com dados e erro do banco) em três larguras: desktop (1280px), área útil de ~650px (o layout precisa refluir) e celular abaixo de 760px (Pixel 7, onde as colunas laterais descem para baixo do conteúdo). Compare com o protótipo em `Sistema de Resumos prototype/spec_sistema_de_resumos/`, sem cobrar as simplificações do design §10, e documente as inconsistências.
   **Conclua quando:** os principais estados e larguras estiverem capturados e as inconsistências, documentadas.

7. **Corrigir os bugs encontrados** — para cada bug registrado no `qa.md`:
   - crie primeiro um teste de regressão que falhe, no nível mais baixo possível (unidade antes de E2E);
   - localize e corrija a causa raiz, sem mascarar o sintoma, seguindo `code-standards.md`;
   - registre no `qa.md` o status, a correção aplicada e o teste criado;
   - se a correção exigir alteração do PRD, da TechSpec ou do escopo, pare e solicite uma decisão ao usuário.

   **Conclua quando:** cada bug registrado no `qa.md` tiver uma correção e um teste de regressão, ou estiver explicitamente bloqueado por uma decisão do usuário.

8. **Revalidar** — repita os fluxos que falharam, execute os testes de regressão e verifique novamente os critérios de aceitação afetados. Se alguma validação falhar, volte ao passo 7.
   **Conclua quando:** todos os critérios de aceitação estiverem marcados como PASSOU, sem bugs não resolvidos.

9. **Reportar** — gere o `qa.md` seguindo `./references/TEMPLATE.md` desta skill, incluindo os bugs corrigidos, os testes de regressão e as evidências finais.
   **Conclua quando:** o `qa.md` estiver gerado conforme o template e atualizado com os resultados finais. Se o status for APROVADO, indique `/executar-review` como próximo passo.

10. **Encerrar o ambiente** — feche o navegador do `playwright-cli` e encerre somente o que esta execução iniciou: o `npm start` (se não foi reaproveitado) e o Supabase (`npx supabase stop`, só se ele estava parado no início). Não encerre processos do usuário nem de outra worktree. Faça essa limpeza também se o QA for interrompido, bloqueado ou reprovado.
