---
name: criar-tasks
description: Tarefas — decomposição de uma funcionalidade em tarefas de implementação a partir do PRD e da TechSpec existentes em `tasks/prd-*/`. Use quando o usuário pedir para decompor uma funcionalidade em tarefas ou planejar sua execução. Não use para redigir o PRD (criar-prd) nem a TechSpec (criar-techspec).
argument-hint: --prd nome-da-funcionalidade
---

O argumento `--prd` identifica o slug da funcionalidade. Sem argumento, localize a pasta em `./tasks/prd-*/`. Os arquivos obrigatórios são `tasks/prd-[slug]/prd.md` e `tasks/prd-[slug]/techspec.md`; se algum estiver ausente, pare e indique a skill correspondente (`/criar-prd` ou `/criar-techspec`).

Cada tarefa é uma **entrega incremental**, com escopo claro, dependências explícitas e testes próprios: pela regra crítica de `.claude/rules/tests.md`, o código e os testes saem na mesma tarefa, nunca numa tarefa de "testes" separada. Referencie os critérios de aceitação do PRD e use os casos de teste definidos na TechSpec como fonte de verdade para os testes das tarefas. Referencie o `techspec.md` em vez de repetir detalhes de implementação.

## Fluxo

1. **Analisar** — leia o `CLAUDE.md`, as rules em `.claude/rules/` (`code-standards.md` e `tests.md`), o PRD e a TechSpec; inventarie os requisitos, os critérios de aceitação (`CA-*`), as decisões técnicas, os arquivos por camada e todos os casos de teste da TechSpec (`TU-*`, `TI-*`, `TB-*` e `E2E-*`). Identifique as skills de `.claude/skills/` aplicáveis a cada tarefa (`angular-developer`, `vitest`, `supabase`, `supabase-postgres-best-practices`, `playwright-cli`).
   **Conclua quando:** o inventário de critérios e casos de teste estiver completo e as skills aplicáveis a cada tarefa estiverem identificadas.

2. **Propor a estrutura** — monte uma lista de tarefas de alto nível, preferencialmente com no máximo 10 itens. Siga a ordem de construção da TechSpec, de dentro para fora: funções puras em `domain/`, depois migração e RLS, depois `rows.ts` e `StudyRepository`, depois `StudyStore` e serviços, depois editor e telas, e por fim os E2E. Cada tarefa deixa o app compilando e a suíte passando. Mostre a lista ao usuário para aprovação antes de gerar qualquer arquivo.
   **Conclua quando:** o usuário aprovar a lista.

3. **Gerar os arquivos** — em `./tasks/prd-[slug]/`:
   - `tasks.md` seguindo `./references/TEMPLATE_TASKS.md` desta skill
   - um arquivo `task_[num].md` para cada tarefa, seguindo `./references/TEMPLATE_TASK.md` desta skill. Use números sequenciais a partir de 1 (`task_1.md`, `task_2.md`, …) e inclua subtarefas (`[num].1`, `[num].2`, …), referências aos critérios de aceitação (`CA-*`) e os testes correspondentes aos casos mapeados da TechSpec
     **Conclua quando:** cada critério de aceitação e caso de teste do inventário estiver mapeado em uma ou mais tarefas, e os testes de cada tarefa corresponderem aos casos definidos na TechSpec.

4. **Reportar** — apresente os arquivos gerados e aguarde a confirmação do usuário antes de iniciar qualquer implementação.
