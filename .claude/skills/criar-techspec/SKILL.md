---
name: criar-techspec
description: TechSpec — especificação técnica derivada de um PRD existente. Use quando o usuário pedir uma TechSpec ou a arquitetura de uma funcionalidade que já tenha um PRD em `tasks/prd-*/prd.md`. Não use sem PRD (criar-prd) nem para decompor em tarefas (criar-tasks).
argument-hint: --prd nome-da-funcionalidade
---

O argumento `--prd` identifica o slug da funcionalidade. Sem argumento, localize a pasta em `./tasks/prd-*/`. O PRD obrigatório é `tasks/prd-[slug]/prd.md`; se não existir, pare e indique `/criar-prd`.

A TechSpec define a arquitetura, os componentes, os contratos e os testes da solução. O problema, os objetivos e o escopo já estão no PRD; referencie-o em vez de repetir essas informações. Especifique sem implementar: inclua código somente nos exemplos de interface do template. Prefira uma arquitetura simples e evolutiva, com interfaces claras.

A arquitetura do Trechos é fixa e está descrita no `CLAUDE.md`: não há servidor nem API própria. O frontend Angular fala direto com o Supabase pelo `StudyRepository`, toda escrita passa pelo `StudyStore` (otimista, com desfazer e toast), a regra de negócio é função pura em `src/app/domain/` e a segurança fica na RLS. Uma TechSpec que proponha backend próprio, API REST ou acesso ao Supabase fora do repositório precisa justificar o desvio e ter a aprovação do usuário.

## Fluxo

1. **Analisar o PRD** — leia-o por completo; extraia requisitos, critérios de aceitação, restrições, textos da interface e os requisitos `R*` afetados.
   **Conclua quando:** os requisitos, os critérios de aceitação, as restrições e as métricas de sucesso estiverem identificados.

2. **Explorar o projeto** — leia o `CLAUDE.md` e as rules em `.claude/rules/` (`code-standards.md` e `tests.md`); leia as seções do `design.md` da especificação (`Sistema de Resumos prototype/spec_sistema_de_resumos/`) ligadas aos requisitos `R*` afetados, principalmente o modelo de dados (§2) e os algoritmos (§3). Use o agente Explore antes de perguntar qualquer coisa ao usuário. Examine as camadas afetadas (`domain/`, `scheduler/`, `review/`, `stats/`, `editor/`, `data/`, `core/`, `pages/`), os tipos do domínio, os signals e `computed` do `StudyStore`, os métodos do `StudyRepository` e o `rows.ts`, as migrações em `supabase/migrations/`, as políticas RLS, os fakes em `src/app/testing/fakes.ts` e os testes existentes. Avalie se é melhor reutilizar bibliotecas já instaladas (`ts-fsrs`, TipTap, `@angular/cdk`) ou construir uma solução nova. Pesquise na web a documentação dessas bibliotecas quando necessário.
   **Conclua quando:** for possível nomear cada arquivo novo ou modificado e indicar em qual camada ele se encaixa.

3. **Esclarecer** — faça perguntas ao usuário usando `AskUserQuestion` antes de redigir. Concentre-se no que a exploração não esclareceu: limites do domínio, mudanças no esquema e na RLS, migração de dados existentes (`resumos.blocos` é JSON), impacto no histórico FSRS dos trechos (ids estáveis), comportamento quando o banco recusa a escrita e cenários de teste críticos.
   **Conclua quando:** toda pergunta tiver uma resposta ou premissa explícita.

4. **Redigir** — leia `./references/TEMPLATE.md` desta skill na íntegra e siga sua estrutura exatamente. Em "Conformidade com o CLAUDE.md e as rules", registre as regras de `code-standards.md` e `tests.md` que pesam nesta funcionalidade. Em "Conformidade com skills", liste somente as skills aplicáveis de `.claude/skills/` (`angular-developer`, `vitest`, `supabase`, `supabase-postgres-best-practices`, `playwright-cli`) e registre os desvios com justificativa. Em "Abordagem de testes", defina os casos aplicáveis, nomeados e identificados por camada (`TU-*` unidade, `TI-*` integração com `TestBed` e fakes, `TB-*` banco com pgTAP e `E2E-*` Playwright), associando cada caso aos critérios de aceitação que ele verifica. Siga a pirâmide e as metas de cobertura de `.claude/rules/tests.md`: 100% em `domain/` e nas áreas críticas, no mínimo 80% no restante.
   **Conclua quando:** toda seção do template estiver preenchida e cada arquivo do passo 2 estiver especificado.

5. **Salvar e reportar** — grave o documento em `tasks/prd-[slug]/techspec.md` e informe o caminho com um resumo de uma linha.
