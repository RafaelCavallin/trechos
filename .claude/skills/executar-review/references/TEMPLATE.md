# Relatório de revisão de código — [Nome da funcionalidade]

## Resumo
- Data: [data]
- Branch: [branch]
- QA: `qa.md` APROVADO em [data]
- Critérios revalidados após correções da revisão: [CA-xx ou nenhum]
- Status: APROVADO / APROVADO COM RESSALVAS / REPROVADO

## Conformidade com regras
| Regra (`code-standards.md`, `tests.md` ou `CLAUDE.md`) | Status | Observações |
|------|--------|-------------|
| [regra] | OK/NOK | [observações] |

## Aderência à TechSpec
| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| [decisão] | SIM/NÃO | [obs] |

## Tarefas verificadas
| Tarefa | Status | Observações |
|------|--------|-------------|
| [tarefa] | COMPLETA/INCOMPLETA | [observações] |

## Testes
| Comando | Resultado | Observações |
|---------|-----------|-------------|
| `npx ng test --watch=false` | PASSOU/FALHOU | [X testes, Y passando, Z falhando] |
| `npm run test:coverage` | PASSOU/FALHOU | [cobertura de `domain/`, meta 100%] |
| `npx ng test --watch=false --coverage` | PASSOU/FALHOU | [cobertura de `src/`, meta 80%] |
| `npm run lint` | PASSOU/FALHOU | |
| `npm run build` | PASSOU/FALHOU | |
| `npm run test:db` | PASSOU/FALHOU/NÃO APLICÁVEL | |
| `npm run test:e2e` | PASSOU/FALHOU/NÃO APLICÁVEL | |

## Problemas encontrados
| Severidade | Arquivo | Linha | Descrição | Sugestão |
|------------|---------|-------|-----------|----------|
| Alta/Média/Baixa | [arquivo] | [linha] | [descrição] | [correção] |

## Pontos positivos
- [Pontos positivos identificados]

## Recomendações
- [Recomendações de melhoria]

## Conclusão
[Parecer final da revisão]
