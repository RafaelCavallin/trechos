# Requisitos — Sistema de Resumos

## 1. Contexto

Estudantes escrevem resumos e o sistema os lembra de revisar usando **FSRS** (Free Spaced Repetition Scheduler), **sem flashcards**. A unidade agendada pelo FSRS é o **trecho** (uma seção do resumo), não o resumo inteiro: a avaliação fica precisa e a revisão, curta.

Público: estudantes de concursos/vestibulares (exemplos usam Direito). Plataforma prioritária: **desktop web** (layout deve reflowar até ~650px de área útil).

## 2. Glossário

| Termo | Definição |
| --- | --- |
| Matéria | Nível 1 da hierarquia (ex.: Direito Administrativo). |
| Assunto | Nível 2, dentro de uma matéria (ex.: Atos administrativos). |
| Resumo | Documento do usuário, dentro de um assunto, composto por blocos. |
| Bloco | Unidade de edição: título (H2), subtítulo (H3), parágrafo, lista, tabela, citação, bloco especial, anexo. |
| Trecho | Sequência de blocos iniciada por um H2 (ou H3 dividido). Possui estado FSRS próprio. Invisível como "card". |
| Lacuna manual | Expressão que o usuário marcou como oculta. |
| Lacuna dinâmica | Palavra ocultada automaticamente pelo sistema na revisão, conforme a densidade. |
| Pergunta da margem | Par pergunta/resposta anexado a um bloco. |
| Item verificável | Lacuna (manual ou dinâmica, conforme o modo) ou pergunta da margem. É o que o usuário marca como acertou/errou. |
| Estágio | Faixa de estabilidade do trecho que determina o formato de apresentação. |
| Retrievability (R) | Probabilidade estimada de lembrar, calculada pelo FSRS. Agregada vira "saúde". |

## 3. Requisitos

Formato: história de usuário + critérios de aceite EARS (`QUANDO … O SISTEMA DEVE …`).

### R1 — Hierarquia Matéria → Assunto → Resumo

**Como** estudante, **quero** organizar meus resumos em matérias e assuntos **para** navegar e acompanhar cada área.

1. O SISTEMA DEVE exibir uma árvore Matéria → Assunto → Resumo, com matérias expansíveis/recolhíveis.
2. QUANDO o usuário criar uma matéria, assunto ou resumo, O SISTEMA DEVE inseri-lo com nome padrão ("Nova matéria", "Novo assunto", "Novo resumo") e abrir imediatamente o campo de renomear.
3. QUANDO o usuário renomear (ícone de lápis ou duplo clique), O SISTEMA DEVE confirmar com Enter ou ao perder o foco, e cancelar com Esc. Nome vazio mantém o anterior.
4. QUANDO o usuário excluir um nó, O SISTEMA DEVE pedir confirmação em diálogo modal informando que o conteúdo interno será excluído e que os trechos deixam de entrar na revisão.
5. QUANDO o usuário arrastar um nó sobre um irmão do mesmo nível e mesmo pai, O SISTEMA DEVE reordená-lo; arrastes entre pais/níveis diferentes DEVEM ser ignorados.
6. Para cada assunto, O SISTEMA DEVE exibir a retenção estimada (%) e a data da próxima revisão. Para cada matéria, a quantidade de assuntos e a retenção média.
7. Para cada resumo, O SISTEMA DEVE exibir a contagem de trechos e de itens verificáveis.
8. QUANDO o usuário clicar num resumo, O SISTEMA DEVE abrir o Editor desse resumo.

### R2 — Editor de resumo

**Como** estudante, **quero** escrever o resumo em blocos com formatação **para** organizar o conteúdo sem pensar em cards.

1. O SISTEMA DEVE oferecer barra de ferramentas fixa (sticky) com: Título, Subtítulo, Parágrafo, Negrito, Lista, Tabela, Citação, **Ocultar**, Pegadinha, Exceção, Exemplo, Analogia, Imagem, Arquivo.
2. QUANDO o usuário inserir um bloco, O SISTEMA DEVE criá-lo logo após o bloco selecionado (ou no fim, se nenhum) e abri-lo em modo de edição.
3. O SISTEMA DEVE suportar os blocos especiais **Pegadinha da banca, Exceção, Exemplo, Analogia**, cada um com rótulo e cor próprios.
4. O SISTEMA DEVE suportar anexos de **imagem** (com pré-visualização) e **arquivo** (chip com nome).
5. QUANDO o usuário clicar num bloco, O SISTEMA DEVE selecioná-lo e mostrar ações: Editar texto, + Pergunta na margem, Subir, Descer, Excluir bloco.
6. O SISTEMA DEVE permitir negrito e lacunas dentro de parágrafos, títulos, itens de lista, **células de tabela**, citações e blocos especiais.
7. A primeira linha de uma tabela DEVE ser tratada como cabeçalho.

### R3 — Ocultar (lacunas manuais)

1. QUANDO o usuário selecionar um texto contínuo e acionar **Ocultar**, O SISTEMA DEVE converter a seleção em lacuna manual, preservando o texto antes/depois e removendo espaços nas bordas da seleção.
2. SE não houver seleção, O SISTEMA DEVE avisar: "Selecione um texto do resumo para ocultar como lacuna."
3. SE a seleção atravessar lacunas, negritos ou blocos diferentes, O SISTEMA DEVE recusar e avisar: "Selecione dentro de um mesmo trecho de texto, sem atravessar lacunas ou negritos." *(Produção pode suportar seleções compostas; ver design §10.)*
4. A ação Ocultar DEVE funcionar em células de tabela.
5. Lacunas DEVEM ser visualmente distintas no editor (pílula tracejada terracota) e ter identificador estável que sobrevive a edições do texto ao redor.

### R4 — Perguntas na margem

1. O SISTEMA DEVE exibir as perguntas de cada bloco numa coluna à direita do bloco (abaixo dele em telas estreitas).
2. QUANDO o usuário adicionar uma pergunta, O SISTEMA DEVE exigir texto da pergunta (resposta opcional) e confirmar: "Pergunta adicionada à margem — conta como item verificável."
3. O usuário DEVE poder remover perguntas.

### R5 — Divisão em trechos

1. O SISTEMA DEVE dividir o resumo automaticamente: cada **H2** inicia um trecho; o primeiro bloco do resumo sempre inicia um trecho.
2. H3 NÃO inicia trecho, exceto se o trecho tiver sido **dividido pelos subtítulos**.
3. O SISTEMA DEVE exibir, no início de cada trecho, um cabeçalho com: "Trecho N", quantidade de itens, quantidade de palavras, estágio e próxima revisão.
4. QUANDO o usuário acionar **Juntar ao anterior** num trecho iniciado por H2 (exceto o primeiro), O SISTEMA DEVE mesclá-lo ao trecho anterior e exibir no lugar o selo "Juntado ao trecho anterior" com ação **Separar**.
5. QUANDO o usuário acionar **Dividir pelos subtítulos**, O SISTEMA DEVE transformar cada H3 do trecho em início de trecho; os novos trechos herdam o estado FSRS do trecho original.
6. O SISTEMA DEVE exibir uma lista lateral "Trechos" (número, título, itens, estágio ou aviso) que rola o editor até o trecho ao ser clicada.

### R6 — Avisos do editor

1. QUANDO um trecho exceder o limite configurado (palavras **ou** lacunas, R14.2), O SISTEMA DEVE avisar "Trecho acima do limite: X de Y palavras|lacunas." e oferecer **Dividir pelos subtítulos** se houver H3; senão, "Adicione subtítulos para poder dividir."
2. QUANDO um trecho tiver zero itens verificáveis, O SISTEMA DEVE avisar: "Sem itens verificáveis: oculte ao menos uma lacuna ou adicione uma pergunta na margem para este trecho entrar na revisão."
3. O cabeçalho do editor DEVE mostrar totais: trechos, itens verificáveis e número de avisos.

### R7 — Edição de trecho já revisado

1. QUANDO o usuário alterar o texto de um bloco pertencente a um trecho com estabilidade > 0, O SISTEMA DEVE calcular o percentual de texto alterado (ignorando marcações de lacuna/negrito).
2. SE o percentual for ≤ limite (padrão 30%), O SISTEMA DEVE manter o estado FSRS e informar "Alteração de X%: estado de revisão mantido."
3. SE for > limite, O SISTEMA DEVE reduzir a estabilidade (padrão: ×0,4, mínimo 0,5 dia), agendar o trecho para hoje e informar "Trecho alterado em X%: estabilidade reduzida, volta para revisão hoje." **[A DEFINIR: reduzir vs. reiniciar; limites]**
4. Criar lacunas/negrito via seleção NÃO conta como alteração de texto.

### R8 — Fila diária e sessão intercalada

1. O SISTEMA DEVE montar a fila do dia com todos os trechos com `due ≤ hoje`, com ≥ 1 item verificável, ainda não revisados hoje, limitada pelo **limite diário** (R14.6).
2. A fila DEVE **intercalar matérias** (não agrupar todos os trechos de uma matéria em sequência) e priorizar trechos de menor retrievability.
3. Trechos novos DEVEM entrar na fila **no mesmo dia da criação** (primeira revisão antes do espaçamento FSRS).
4. O SISTEMA DEVE estimar ~2 min por trecho e exibir por matéria: "Direito Administrativo: 3 trechos · ~6 min".
5. A tela Revisão sem sessão ativa DEVE listar a fila (número, título, matéria · assunto, formato, itens) e o botão **Iniciar sessão**. Fila vazia: "Tudo em dia".

### R9 — Sessão de revisão

**Como** estudante, **quero** revisar um trecho por vez, tentar lembrar, revelar e marcar **para** receber uma nota objetiva.

1. O SISTEMA DEVE mostrar **somente o trecho atual**, com progresso "Trecho N de M" e barra de progresso, matéria · assunto.
2. Antes de revelar, lacunas DEVEM aparecer como pílulas numeradas sem texto; lacunas dinâmicas em cor sage, manuais em neutro.
3. QUANDO o usuário clicar em **Revelar**, O SISTEMA DEVE mostrar o conteúdo de todas as lacunas/respostas e habilitar a marcação.
4. O usuário DEVE poder marcar cada item como **acertou/errou** de duas formas: clicando na lacuna no texto (alterna acerto → erro → acerto) ou pelos botões ✓/✗ no painel lateral "Itens verificáveis".
5. O botão **Calcular nota** DEVE ficar desabilitado até todos os itens estarem marcados; DEVE existir o atalho "Marcar restantes como acerto".
6. QUANDO a nota for calculada, O SISTEMA DEVE exibir: % de acertos, nota (texto), nota FSRS, "X de Y itens", e "Próxima revisão: <data> (em N dias)". Após isso, as marcações ficam bloqueadas.
7. Ao final da sessão, O SISTEMA DEVE exibir o resumo: trechos revisados, acertos (x/y e %), quantos voltam amanhã, tabela por trecho (acertos, nota, próxima) e lista "Volta amanhã" com as lacunas erradas.
8. O usuário DEVE poder sair da sessão a qualquer momento; trechos já avaliados permanecem avaliados.

### R10 — Formatos por estágio

| Estágio | Estabilidade (S) | Formato | Itens |
| --- | --- | --- | --- |
| Inicial / Nova | S < 4 dias | **Com lacunas** — texto com lacunas manuais + dinâmicas (densidade configurada) | lacunas |
| Intermediário | 4 ≤ S < 16 | **Só perguntas da margem** (se o trecho tiver perguntas) — só as perguntas, sem texto | perguntas |
| Intermediário | 4 ≤ S < 16 | **Só o título** (se não tiver perguntas) — o usuário escreve livremente; ao revelar, vê o texto com as lacunas como gabarito e o que escreveu | lacunas manuais |
| Estável | S ≥ 16 | **Lacunas densas** — muito mais texto oculto | lacunas manuais + dinâmicas densas |

1. O SISTEMA DEVE escolher o formato pelo estágio. Limiares **[A DEFINIR]**; usar os da tabela.
2. SE o formato exigir perguntas e o trecho não tiver, O SISTEMA DEVE usar "Só o título"; SE exigir lacunas e não houver, usar "Só perguntas".
3. Lacunas dinâmicas NÃO DEVEM ser geradas em títulos, negritos nem anexos, e DEVEM ser determinísticas para a mesma versão do texto durante a sessão.

### R11 — Nota calculada pelas lacunas

1. NÃO DEVE existir autoavaliação geral. A nota é a proporção de itens acertados.
2. Conversão padrão (configurável, R14.3):

| Acertos | Nota | FSRS |
| --- | --- | --- |
| ≥ 100% | Fácil | Easy |
| ≥ 90% | Lembrei | Good |
| ≥ 60% | Lembrei com esforço | Hard |
| < 60% | Não lembrei | Again |

3. O SISTEMA DEVE registrar, por item, cada resultado (acerto/erro) para estatísticas e pontos fracos. Lacunas dinâmicas entram na nota mas **não** no histórico por lacuna (não têm identidade persistente).

### R12 — Agendamento FSRS

1. Cada trecho DEVE ter estado FSRS próprio: estabilidade, dificuldade, data da próxima revisão (+ histórico de revisões).
2. QUANDO a nota for calculada, O SISTEMA DEVE atualizar o estado via FSRS com a nota (Again/Hard/Good/Easy) e a **retenção desejada** configurada.
3. Again DEVE reagendar para o dia seguinte.

### R13 — Saúde, Início e Estatísticas

1. A retrievability de cada trecho DEVE ser agregada para assunto e matéria (média ponderada por itens **[A DEFINIR]**; padrão: média simples).
2. **Início** DEVE mostrar: data do dia; título "N trechos para revisar hoje"; revisões do dia por matéria com tempo; botão "Iniciar sessão · ~N min"; saúde por matéria ordenada da menor para a maior; **Pontos fracos**: as 4 lacunas com maior taxa de erro (mín. 3 revisões), com trecho, matéria e "Errada em X de Y revisões", clicáveis para abrir o resumo.
3. **Estatísticas** DEVE mostrar: retenção por matéria e por assunto (barras); histórico de revisões (data, trecho, matéria, % acertos, nota); **mapa de calor** de um resumo escolhido, com cada lacuna colorida pela taxa de erro (0%, até 25%, 25–50%, > 50%) e cada trecho com sua taxa de erro agregada.

### R14 — Configurações

1. **Retenção desejada**: 80%, 85%, **90% (padrão)**, 95%. Exibir exemplo: "Com 90%, um trecho com estabilidade de 10 dias volta em N dias."
2. **Limite de tamanho do trecho**: por Palavras (**padrão 150**) ou Lacunas (**padrão 10**).
3. **Faixas da conversão** de acertos em nota: Fácil (100), Lembrei (90), Lembrei com esforço (60) — % mínimo.
4. **Densidade das lacunas dinâmicas**: Baixa, **Média (padrão)**, Alta.
5. **Edição de trecho revisado**: limite de alteração em % (**padrão 30**).
6. **Limite diário da sessão**: trechos por dia (**padrão 20**).
7. Alterações DEVEM ter efeito imediato nas demais telas e ser persistidas por usuário.

### R15 — Não funcionais

1. Persistência de todos os dados do usuário (servidor ou local-first com sync **[A DEFINIR]**).
2. Layout responsivo: em larguras estreitas, colunas laterais (lista de trechos, margem, painel de itens) passam para baixo do conteúdo; rótulos de botões/tags não quebram linha.
3. Acessibilidade: foco visível (anel 2px accent), navegação por teclado nas ações de revisão, contraste de texto ≥ 4.5:1.
4. Interface em pt-BR; datas no formato "29 out".

## 4. Fora de escopo (nesta versão)

- **Vazamento de contexto** (lacunas inferíveis pelo texto ao redor) — adiado.
- Flashcards visíveis / edição de cards.
- Colaboração/compartilhamento de resumos.
- Aplicativo móvel nativo.
- Tema escuro (direção visual decidida: tema claro, acolhedor, desktop primeiro).
