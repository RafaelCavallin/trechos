# Sistema de Resumos — Trecho como unidade de revisão

Oct 23, 2026 · @Rafael

## Contexto

O sistema usa FSRS para lembrar o estudante de revisar seus resumos, sem flashcards. A questão central é qual unidade o FSRS agenda.

Se a unidade for o resumo inteiro, a nota fica vaga ("lembrei mais ou menos de 4 páginas"). Se for um trecho, a avaliação fica precisa e a revisão fica curta.

## Proposta: o trecho como unidade de revisão

Cada resumo é dividido em trechos, e cada trecho tem seu próprio estado FSRS.

- **Divisão automática** pelos títulos: cada seção H2/H3 vira um trecho. O usuário pode ajustar, juntando ou separando trechos.
- **Estado FSRS por trecho**: estabilidade, dificuldade e data da próxima revisão.
- **Sem cards visíveis**: o usuário só escreve o resumo; os trechos existem nos bastidores.

## Fluxo de uma revisão

O usuário vê um trecho por vez, tenta lembrar, revela e dá um feedback que vira a nota do FSRS.

1. O sistema avisa: *"Direito Administrativo: 4 trechos para revisar hoje (\~8 min)"*.
2. Mostra um trecho de cada vez, já com as lacunas (manuais + dinâmicas).
3. O usuário tenta lembrar e depois revela.
4. Marca cada lacuna como acertou ou errou; o sistema converte a proporção de acertos em uma nota do FSRS:

| Lacunas acertadas | Nota | Nota FSRS |
| --- | --- | --- |
| 100% | Fácil | Easy |
| 90% a 99% | Lembrei | Good |
| 60% a 89% | Lembrei com esforço | Hard |
| Abaixo de 60% | Não lembrei | Again |

**Decidido: nota calculada pelas lacunas.** Não há autoavaliação geral: o usuário marca cada lacuna e o sistema calcula a nota pela proporção de acertos. Também registra quais lacunas foram erradas. As faixas da tabela são um ponto de partida, a calibrar com o uso. Isso reduz a tendência de se dar nota generosa.

## Formas de apresentar um trecho

O formato fica mais exigente conforme a estabilidade do trecho cresce.

| Estágio | Formato | O que o usuário vê |
| --- | --- | --- |
| Inicial | Com lacunas | O texto com lacunas manuais e dinâmicas |
| Intermediário | Só perguntas da margem | As perguntas, sem o texto |
| Intermediário | Só o título | O título; lembra livremente e depois compara |
| Estável | Lacunas densas | Muito mais texto oculto que no início |

## Do trecho para a matéria

A retenção estimada (retrievability) de cada trecho sobe na hierarquia e vira a "saúde" de cada assunto e matéria.

&#91;embedded content: agregação da retenção · trecho → assunto → matéria\]

- **Painel de saúde**: mostra a retenção por matéria (ex.: "Constitucional: 72%") e ordena o que revisar primeiro.
- **Sessão diária intercalada**: mistura trechos de matérias diferentes, com limite de tempo ou de quantidade por dia.

## Decisões para o PRD

- **Feedback da revisão**: nota calculada pelas lacunas; não há autoavaliação geral.
- **Trechos sem lacunas**: lacunas e perguntas da margem são itens verificáveis, e a nota é sempre a proporção de itens acertados. No modo "só o título", o usuário lembra livremente; ao revelar, as lacunas servem de gabarito e ele marca quais lembrou. No modo "só perguntas da margem", cada pergunta é um item. Um trecho precisa de pelo menos um item para entrar na revisão; sem itens, o editor avisa.
- **Edição de trecho já revisado**: regra por percentual de texto alterado. Abaixo do limite, o estado é mantido; acima, a estabilidade é reduzida ou reiniciada (limites a definir).
- **Tamanho do trecho**: o sistema avisa quando um trecho passa do limite e sugere dividi-lo pelos subtítulos. O limite (ex.: 300 palavras ou 10 lacunas) é configurável pelo usuário.
- **Primeira revisão**: no mesmo dia da criação do resumo, antes de o FSRS espaçar.
- **Retenção desejada**: configurável pelo usuário (ex.: 85% ou 90%); define o quanto as revisões se espaçam.
- **Vazamento de contexto**: adiado; por enquanto não será tratado.

## Telas do protótipo

O protótipo tem seis telas, organizadas pela hierarquia **Matéria → Assunto → Resumo → Trecho**. A navegação principal leva a Início, Matérias, Revisão e Estatísticas.

### 1. Início

- Revisões do dia por matéria, com tempo estimado (ex.: "Direito Administrativo: 4 trechos, \~8 min").
- Botão para iniciar a sessão diária intercalada.
- Saúde de cada matéria: retenção estimada (ex.: "Constitucional: 72%").
- Pontos fracos: trechos e lacunas mais errados.

### 2. Matérias e assuntos

- Árvore Matéria → Assunto → Resumo, com reordenação por arrastar.
- Criar, renomear e excluir matérias, assuntos e resumos.
- Por assunto: retenção estimada e próxima revisão.

### 3. Editor de resumo

- Edição em blocos com barra de formatação: títulos, negrito, listas, tabelas, citações.
- Ação de ocultar: selecionar um trecho e marcar como lacuna, incluindo células de tabela.
- Blocos especiais: pegadinha da banca, exceção, exemplo, analogia.
- Perguntas na margem, ao lado de cada bloco.
- Anexos: imagens e arquivos.
- Divisão em trechos visível pelos títulos, com indicação de quantos itens cada trecho tem.
- Avisos: trecho acima do limite (sugere dividir) e trecho sem itens (pede ao menos uma lacuna).

### 4. Sessão de revisão

- Um trecho por vez, só o trecho, com progresso da sessão (ex.: 2 de 4).
- Formato conforme o estágio: com lacunas, só o título ou só perguntas da margem.
- Revelar e marcar cada item como acertou ou errou.
- Nota calculada exibida ao final do trecho, com a próxima data de revisão.
- Resumo da sessão: trechos revisados, acertos e o que volta amanhã.

### 5. Estatísticas

- Retenção por matéria e por assunto.
- Mapa de calor do resumo: trechos e lacunas mais errados destacados no texto.
- Histórico de revisões.

### 6. Configurações

- Retenção desejada (ex.: 85% ou 90%).
- Limite de tamanho do trecho (palavras ou lacunas).
- Faixas da conversão de acertos em nota.
- Densidade das lacunas dinâmicas.

### Direção visual

- [ ] Em aberto: tema (claro ou escuro), tom (sóbrio, acolhedor, minimalista) e prioridade de dispositivo (desktop ou celular).
