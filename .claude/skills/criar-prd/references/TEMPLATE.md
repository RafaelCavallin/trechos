# Documento de Requisitos do Produto (PRD)

## Visão geral

[Descreva a funcionalidade em até dois parágrafos: qual problema do estudante ela resolve e qual valor oferece para o estudo com repetição espaçada.]

## Relação com a especificação

[Liste o que a funcionalidade toca na especificação existente (`Sistema de Resumos prototype/spec_sistema_de_resumos/`):

- Requisitos afetados: R[n] — [o que muda ou o que é estendido]
- Telas afetadas (design §5): [Início, Matérias, Editor, Revisão, Estatísticas, Configurações, Entrar]
- Conflitos com a especificação atual e a decisão tomada]

## Objetivos

[Liste objetivos específicos e mensuráveis para esta funcionalidade:

- Critérios de sucesso
- Principais métricas (ex.: tempo de uma sessão de revisão, trechos revisados por dia, retenção)]

## Histórias de usuário

[Descreva narrativas de uso e benefícios da funcionalidade, cobrindo os fluxos principais e os casos de borda:

- US1: Como estudante, quero [realizar uma ação] para [alcançar um benefício].]

## Principais funcionalidades

[Liste e descreva as principais funcionalidades. Para cada uma:

- O que faz e por que é importante
- Como funciona em alto nível
- Requisitos funcionais numerados (RF1, RF2, …)]

## Critérios de aceitação

[Defina critérios objetivos e verificáveis para considerar a funcionalidade aceita. Numere-os como CA-01, CA-02 etc. e associe-os às histórias de usuário, aos requisitos funcionais ou aos requisitos `R*` correspondentes. Descreva comportamentos e resultados observáveis, sem detalhes de implementação:

- CA-01: Dado [contexto], quando [ação], então [resultado observável].]

## Experiência do usuário

[Descreva a jornada e a experiência do usuário:

- Fluxos principais e interações (teclado, arrastar, diálogos, toasts)
- Comportamento no desktop e no celular (abaixo de 760px as colunas laterais descem para baixo do conteúdo)
- Acessibilidade: navegação por teclado, rótulos e contraste de 4,5:1 (R15.3)]

## Textos da interface

[Liste cada texto novo ou alterado, em pt-BR, exatamente como deve aparecer na tela (botões, títulos, mensagens vazias, toasts de erro, diálogos). Indique a tela e o elemento. Estes textos complementam o design §6.]

| Tela | Elemento | Texto |
| ---- | -------- | ----- |
| [tela] | [elemento] | [texto exato] |

## Restrições técnicas de alto nível

[Liste somente restrições de alto nível — os detalhes de implementação ficam na TechSpec. Considere as restrições fixas do projeto:

- Sem servidor próprio: o app fala direto com o Supabase e a segurança fica na RLS
- Os dados de um usuário nunca aparecem para outro
- O trecho não pode perder o histórico FSRS (ids de bloco e de lacuna estáveis)
- Interface só em pt-BR
- Dados sensíveis e privacidade (anexos no Storage, conta por e-mail e senha)]

## Fora do escopo

[Descreva o que esta funcionalidade não incluirá, para controlar o escopo:

- Funcionalidades explicitamente excluídas
- Melhorias futuras fora do escopo
- Itens que já estão em "Fora de escopo" no `requirements.md` §4 e continuam fora]
