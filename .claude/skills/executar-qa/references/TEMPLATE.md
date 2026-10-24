# Relatório de QA — [Nome da funcionalidade]

As evidências (capturas de tela) devem estar salvas em `tasks/prd-[slug]/evidences/`.

## Resumo
- Data: [data]
- Status: APROVADO / REPROVADO / BLOQUEADO
- Conta de QA: [e-mail usado]
- Total de critérios de aceitação: [X]
- Critérios de aceitação atendidos: [Y]
- Bugs encontrados: [Z]

## Critérios de aceitação verificados
| ID | Critério de aceitação | Casos de teste | Status | Evidência |
|----|-----------------------|----------------|--------|-----------|
| CA-01 | [descrição] | [TU-01, TI-01, TB-01, E2E-01] | PASSOU/FALHOU | [captura de tela] |

## Fluxos verificados na interface
| ID | Fluxo | Resultado | Observações |
|----|-------|-----------|-------------|
| E2E-01 | [fluxo] | PASSOU/FALHOU | [obs] |

## Testes automatizados e cobertura
| Camada | Comando | Resultado | Observações |
|--------|---------|-----------|-------------|
| Unidade e integração | `npx ng test --watch=false` | PASSOU/FALHOU | [IDs dos casos] |
| Cobertura de `domain/` (meta 100%) | `npm run test:coverage` | PASSOU/FALHOU | [valor] |
| Cobertura de `src/` (meta 80%) | `npx ng test --watch=false --coverage` | PASSOU/FALHOU | [valor] |
| Banco e RLS | `npm run test:db` | PASSOU/FALHOU/NÃO APLICÁVEL | [IDs dos casos] |
| E2E, axe e celular | `npm run test:e2e` | PASSOU/FALHOU | [IDs dos casos] |

## Acessibilidade
- [checklist de a11y por tela]

## Visual e celular
| Tela | Estado | Desktop | ~650px | Celular (< 760px) | Observações |
|------|--------|---------|--------|-------------------|-------------|
| [tela] | vazio/com dados/erro | [evidência] | [evidência] | [evidência] | [obs] |

## Bugs encontrados e corrigidos
| ID | Descrição | Severidade | Status | Correção | Teste de regressão | Evidência |
|----|-----------|------------|--------|----------|--------------------|-----------|
| BUG-01 | [descrição] | Alta/Média/Baixa | Corrigido/Bloqueado | [correção ou motivo do bloqueio] | [teste] | [link da evidência] |

## Conclusão
[Parecer final do QA]
