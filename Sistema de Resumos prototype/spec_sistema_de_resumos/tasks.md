# Plano de implementação

Cada tarefa é incremental, testável e cita os requisitos atendidos. Marque `[x]` ao concluir e verifique os critérios de aceite citados. Funções de domínio exigem testes unitários.

## Fase 0 — Fundação
- [x] **T0.1** Criar projeto (feito em Angular 22 + TS, Vitest, ESLint; Supabase local), lint, testes, roteamento (`design §4`). — R15
- [x] **T0.2** Importar tokens e classes do design system Organic (`prototype/_ds/.../styles.css`), fontes Caprasimo/Figtree, Lucide com stroke 2.75; foco visível. — R15.3, design §7
- [x] **T0.3** Layout base: sidebar 232px com navegação e badge de fila; área principal rolável; toast; diálogo de confirmação. — design §4, §5.7

## Fase 1 — Domínio (funções puras + testes)
- [ ] **T1.1** Tipos do modelo de dados. — design §2
- [ ] **T1.2** `splitTrechos(blocos)` com merge/split, contagem de palavras, lacunas, perguntas, itens, subtítulos. — R5.1–R5.2
- [ ] **T1.3** `isOverLimit(trecho, config)` e detecção de trecho sem itens. — R6.1–R6.2
- [ ] **T1.4** `generateDynamicGaps(trecho, modo, densidade)` determinístico. — R10.3, design §3.3
- [ ] **T1.5** `collectItems(trecho, modo)` e `modeForStage(S, trecho)` com fallbacks. — R10.1–R10.2, design §3.4–3.5
- [ ] **T1.6** `gradeFromMarks(marcas, itens, faixas)`. — R11.1–R11.2
- [ ] **T1.7** `changeRatio(antes, depois)` ignorando marcações. — R7.1
- [ ] **T1.8** Agregação de saúde, pontos fracos e níveis do mapa de calor. — R13.1, design §3.9

## Fase 2 — Persistência e agendamento
- [ ] **T2.1** API/armazenamento para matérias, assuntos, resumos (blocos), estados de trecho, registros de revisão, configurações. — R15.1, R14.7
- [ ] **T2.2** Adaptador FSRS (`ts-fsrs`) com retenção desejada; trecho novo com `due = hoje`; Again → amanhã. — R12, R8.3
- [ ] **T2.3** `buildDailyQueue()`: due ≤ hoje, itens ≥ 1, não revisados hoje, ordenar por menor R, intercalar por matéria, limite diário. — R8.1–R8.3

## Fase 3 — Matérias
- [ ] **T3.1** Árvore com expandir/recolher, contagens, retenção e próxima revisão. — R1.1, R1.6, R1.7
- [ ] **T3.2** Criar com renomeação imediata; renomear (Enter/blur/Esc); excluir com diálogo. — R1.2–R1.4
- [ ] **T3.3** Reordenar por arrastar entre irmãos do mesmo pai. — R1.5
- [ ] **T3.4** Abrir resumo no editor. — R1.8

## Fase 4 — Editor
- [ ] **T4.1** Componente `Bloco` renderizando todos os tipos e estados de lacuna. — R2.3–R2.7, design §5.3
- [ ] **T4.2** Editor rico in-place com marks `gap`/`bold` e ids estáveis (não usar textarea). — R2, design §10.1
- [ ] **T4.3** Toolbar sticky: inserir blocos após o selecionado; especiais; anexos com upload. — R2.1–R2.4
- [ ] **T4.4** **Ocultar** e **Negrito** por seleção, incluindo células de tabela, com mensagens de erro. — R3
- [ ] **T4.5** Seleção de bloco e ações (subir, descer, excluir). — R2.5
- [ ] **T4.6** Perguntas na margem (adicionar com validação, remover). — R4
- [ ] **T4.7** Cabeçalhos de trecho, lista lateral "Trechos" com rolagem, juntar/separar, dividir pelos subtítulos (herdando estado FSRS). — R5.3–R5.6
- [ ] **T4.8** Avisos de limite e de trecho sem itens; totais no cabeçalho. — R6
- [ ] **T4.9** Regra de edição de trecho revisado com toasts. — R7

## Fase 5 — Revisão
- [ ] **T5.1** Tela inicial da revisão (lista da fila, iniciar) e estado vazio. — R8.5
- [ ] **T5.2** Sessão: trecho único, progresso, formatos por estágio (lacunas, perguntas, título com recall, densas). — R9.1–R9.2, R10
- [ ] **T5.3** Revelar; marcar por clique na lacuna (alternância) e pelo painel ✓/✗; "Marcar restantes como acerto"; bloquear "Calcular nota" até completar. — R9.3–R9.5
- [ ] **T5.4** Calcular nota, atualizar FSRS, registrar revisão e resultados por item; exibir resultado e próxima data. — R9.6, R11.3, R12.2
- [ ] **T5.5** Resumo da sessão e "Volta amanhã"; sair a qualquer momento. — R9.7–R9.8
- [ ] **T5.6** Atalhos de teclado (Espaço = revelar, ←/→ ou 1/2 = acertou/errou no item focado, Enter = próximo). — R15.3

## Fase 6 — Início e Estatísticas
- [ ] **T6.1** Início: data, título, revisões por matéria com tempo, CTA, saúde ordenada, pontos fracos clicáveis. — R13.2
- [ ] **T6.2** Estatísticas: retenção por matéria/assunto, histórico, mapa de calor por resumo com legenda e taxa por trecho. — R13.3

## Fase 7 — Configurações
- [ ] **T7.1** Tela com todos os parâmetros, valores padrão e efeito imediato. — R14

## Fase 8 — Qualidade
- [ ] **T8.1** Responsividade: colunas laterais descem abaixo do conteúdo; rótulos sem quebra. — R15.2
- [ ] **T8.2** Acessibilidade: contraste, foco, rótulos ARIA nos botões-ícone. — R15.3
- [ ] **T8.3** Testes E2E dos fluxos: criar resumo → ocultar lacuna → trecho entra na fila → revisar → nota → próxima data; dividir trecho longo; editar trecho revisado acima do limite.
