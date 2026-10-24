---
name: executar-review
description: Revisão de código — última etapa do fluxo, depois do QA. Revise e estabilize o código de uma funcionalidade quanto à conformidade com as regras do projeto, à aderência à TechSpec e às tarefas e aos testes, com relatório final e veredito. Use quando o usuário pedir para revisar código, executar uma revisão de código, validar a conformidade com as regras ou corrigir problemas encontrados durante a revisão. Não use para validar o comportamento em QA (executar-qa) nem para implementar novas tarefas.
argument-hint: --prd nome-da-funcionalidade
---

O argumento `--prd` identifica o slug da funcionalidade. Sem argumento, localize a pasta em `./tasks/prd-*/`. Leia o `CLAUDE.md` do projeto. Em `tasks/prd-[slug]/`, leia `techspec.md`, `tasks.md` e `qa.md`; consulte `prd.md` somente quando necessário para esclarecer um requisito. Gere o `codereview.md` na mesma pasta.

A revisão é a última etapa do fluxo (PRD → TechSpec → tasks → task → QA → review) e parte de uma funcionalidade já validada. Se o `qa.md` não existir ou o status dele não for **APROVADO**, pare e indique `/executar-qa`.

Confira as regras do projeto e a TechSpec antes de apontar qualquer problema. Execute os testes e as validações do `CLAUDE.md` antes de registrar o veredito; a revisão só poderá ser **APROVADA** quando todos os testes aplicáveis passarem.

## Fluxo

1. **Analisar** — leia o `CLAUDE.md`, as rules em `.claude/rules/` (`code-standards.md` e `tests.md`), a TechSpec (arquitetura esperada), as tarefas (escopo implementado) e o `qa.md` (critérios validados e bugs já corrigidos, com seus testes de regressão). Delimite as mudanças com `git status` e `git diff` (ou `git diff main...HEAD` numa branch). Carregue somente as skills aplicáveis de `.claude/skills/` (`angular-developer`, `vitest`, `supabase`, `supabase-postgres-best-practices`).
   **Conclua quando:** a arquitetura esperada, o escopo, as rules e as skills aplicáveis estiverem claros.

2. **Conformidade com as regras** — confira cada arquivo alterado contra `code-standards.md` e as convenções do `CLAUDE.md`:
   - [ ] Sem comentários nem código comentado (exceto expressão regular complexa)
   - [ ] Arquivos e classes com até 100 linhas, funções e métodos com até 30
   - [ ] No máximo 3 níveis de if/else, no máximo 3 parâmetros, sem linhas em branco dentro de funções
   - [ ] Constantes no lugar de números e strings mágicos, variáveis declaradas onde são usadas
   - [ ] Nenhum dado sensível no código; no frontend só a chave pública do Supabase
   - [ ] Sem `any`, `readonly` em listas, tipo de retorno explícito nas funções exportadas
   - [ ] Angular: standalone, `OnPush`, `inject()`, `input()`/`output()`, `@if`/`@for`, membros do template `protected`, rotas com `loadComponent` e `title`
   - [ ] Regra de negócio pura em `domain/`; componentes não falam com o Supabase, toda escrita passa pelo `StudyStore`; derivados são `computed`
   - [ ] Textos da interface em pt-BR e iguais ao design §6 ou ao PRD; estilos com os tokens de `src/styles.css` (`accent-700` para texto e foco)
   - [ ] Banco: migração nova (nenhuma migração aplicada foi editada), `user_id default auth.uid()`, RLS de dono, app sem enviar `user_id`, checks repetidos em `domain/settings.ts`
   - [ ] Ids de bloco e de lacuna estáveis (o trecho não perde o histórico FSRS)
   - [ ] Testes conforme `tests.md`: ao lado do código, nomes em pt-BR, AAA, sem `new Date()` decidindo o resultado, fakes no lugar do Supabase, `expect` com valores exatos

   Para os limites de linhas, `find src/app -name '*.ts' | xargs wc -l | awk '$1 > 100'` ajuda a achar os arquivos grandes; confira só os que fazem parte da mudança. Registre cada violação e a regra correspondente.
   **Conclua quando:** cada mudança tiver sido conferida contra as regras aplicáveis.

3. **Aderência à TechSpec** — compare a implementação com o especificado:
   - [ ] Arquivos nas camadas previstas
   - [ ] Interfaces do domínio, do `StudyStore` e do `StudyRepository` conforme definidas
   - [ ] Modelos de dados e mapeamento do `rows.ts` conforme documentados
   - [ ] Migração, RLS e Storage conforme especificados
   - [ ] Atualização otimista, desfazer e toasts conforme a seção "Erros e desfazer"

   **Conclua quando:** cada decisão da TechSpec tiver sido confirmada como implementada ou registrada como desvio justificado.

4. **Completude das tarefas** — para cada tarefa marcada como completa, verifique se o código foi implementado, os critérios de aceitação relacionados estão marcados como PASSOU no `qa.md`, as subtarefas foram concluídas e os testes da tarefa estão presentes. Confira também que as correções feitas no QA seguem as regras e têm o teste de regressão registrado.
   **Conclua quando:** cada tarefa marcada como completa atender aos quatro pontos.

5. **Testes** — execute os comandos do `CLAUDE.md`:
   - `npx ng test --watch=false` — suíte de unidade e integração
   - `npm run test:coverage` — `domain/` em 100%
   - `npx ng test --watch=false --coverage` — todo o `src/`, no mínimo 80%
   - `npm run lint` e `npm run build`
   - `npm run test:db` — se a mudança tocou migração ou RLS
   - `npm run test:e2e` — se a mudança tocou um fluxo principal

   Os dois últimos precisam do Supabase local. Rode `npx supabase status`; se estiver parado, suba com `npx supabase start` e registre que foi esta execução que subiu. Para aplicar migrações novas, use `npx supabase migration up`; `npx supabase db reset` apaga os dados locais e só roda com a confirmação do usuário. O `npm run test:e2e` usa ou sobe o app em `http://localhost:4200`; se essa porta for de outro checkout (outra worktree), não rode os E2E e avise o usuário.
   **Conclua quando:** todos os comandos aplicáveis tiverem sido executados, com testes passando e as metas de cobertura respeitadas.

6. **Corrigir e revalidar** — para cada problema encontrado:
   - corrija a causa raiz e ajuste ou crie os testes necessários (bug começa por um teste que falha);
   - se a correção exigir alteração do PRD, da TechSpec ou do escopo, registre o problema como bloqueador e solicite uma decisão ao usuário;
   - como o QA já aprovou a funcionalidade, prefira correções que não mudem o comportamento (refatoração para cumprir as regras). Se uma correção mudar o que o usuário vê ou o que é gravado, rode de novo os E2E dos critérios de aceitação afetados e registre no `codereview.md` quais critérios foram revalidados;
   - execute novamente os testes e repita as verificações relevantes.

   **Conclua quando:** não houver problemas bloqueadores e os testes e as verificações relevantes tiverem sido executados novamente.

7. **Reportar** — gere o `codereview.md` seguindo `./references/TEMPLATE.md` desta skill, com o veredito:
   - **APROVADO** — critérios atendidos, testes passando, código conforme as regras e a TechSpec.
   - **APROVADO COM RESSALVAS** — principais critérios atendidos; melhorias recomendadas, mas não bloqueantes.
   - **REPROVADO** — testes falhando, violação grave de padrão, falta de aderência à TechSpec, risco de perder histórico FSRS ou de expor dados de outro usuário.

   **Conclua quando:** o `codereview.md` estiver salvo conforme o template, com o veredito registrado.

8. **Encerrar o ambiente** — encerre somente o que esta execução iniciou: o `npm start` (se não foi reaproveitado) e o Supabase (`npx supabase stop`, só se ele estava parado no início). Não encerre processos do usuário nem de outra worktree. Faça essa limpeza também se a revisão for interrompida, bloqueada ou reprovada.
