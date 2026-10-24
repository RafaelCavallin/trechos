---
name: criar-prd
description: PRD — Documento de Requisitos de Produto. Use quando o usuário pedir um PRD ou quiser definir os requisitos e o escopo de uma nova funcionalidade ou produto (primeira etapa do fluxo PRD → TechSpec → tasks). Não use para especificações técnicas (criar-techspec) nem para decompor requisitos em tarefas (criar-tasks).
argument-hint: --prompt "descrição da funcionalidade"
---

O PRD define o problema, os objetivos, os resultados esperados, as restrições e o escopo. Objetivos e resultados devem ter critérios mensuráveis. Os detalhes de implementação — como arquitetura e código — pertencem à TechSpec e ficam fora do PRD.

O Trechos já tem uma especificação completa fora do git, em `Sistema de Resumos prototype/spec_sistema_de_resumos/`: `requirements.md` (R1–R15, com critérios EARS), `design.md` (telas §5, textos exatos §6, tokens §7) e o protótipo visual. Um PRD novo **estende ou altera** essa especificação: ele cita os requisitos `R*` afetados em vez de reescrevê-los e não contradiz o que já está definido sem registrar a mudança.

## Fluxo de trabalho

1. **Ler o contexto** — leia o `CLAUDE.md`, o `requirements.md` e as seções do `design.md` ligadas à funcionalidade. Identifique os requisitos `R*` e as telas do design §5 afetados, o que o requisito já decide e o que está em "Fora de escopo" (§4 do `requirements.md`).
   **Conclua quando:** souber quais requisitos e telas existentes a funcionalidade toca e o que eles já definem.

2. **Esclarecer** — faça perguntas ao usuário usando `AskUserQuestion` antes de redigir. Não pergunte o que a especificação já responde:
   - Problema a ser resolvido e metas mensuráveis
   - Histórias de usuário e fluxos principais do estudante
   - Funcionalidades centrais: entradas, saídas e ações
   - Itens fora do escopo e dependências
   - Textos novos da interface (pt-BR) e comportamento no celular (abaixo de 760px)

   Para regras de negócio de repetição espaçada (FSRS, retrievability, estabilidade), consulte a documentação do `ts-fsrs` e do FSRS na web em vez de perguntar ao usuário.
   **Conclua quando:** cada seção do template tiver uma resposta ou premissa registrada.

3. **Redigir** — leia `./references/TEMPLATE.md` desta skill na íntegra e siga sua estrutura exatamente. Escreva tudo em pt-BR e use os termos do glossário do `requirements.md` (matéria, assunto, resumo, bloco, trecho, lacuna, item verificável). Todo texto novo da interface entra na seção "Textos da interface" exatamente como deve aparecer na tela.
   **Conclua quando:** toda seção do template estiver preenchida com informações específicas da funcionalidade.

4. **Salvar e reportar** — grave o documento em `./tasks/prd-[slug]/prd.md`, usando um slug da funcionalidade em kebab-case. Informe o caminho com um resumo de uma linha e liste os requisitos `R*` e os textos do design §6 que precisarão ser atualizados na especificação.
