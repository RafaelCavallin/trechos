# Especificação técnica

## Resumo

[Descreva brevemente a abordagem técnica da solução. Resuma as principais decisões e a estratégia de implementação em um ou dois parágrafos.]

## Arquitetura

### Camadas afetadas

[Liste cada arquivo novo ou modificado, agrupado pela camada do `CLAUDE.md`, com sua responsabilidade. Remova as camadas que não mudam:

| Camada | Arquivo | Novo/alterado | Responsabilidade |
| ------ | ------- | ------------- | ---------------- |
| `domain/` | `src/app/domain/[arquivo].ts` | novo | [função pura] |
| `scheduler/` | | | |
| `review/` | | | |
| `stats/` | | | |
| `editor/` | | | |
| `data/` | `src/app/data/study-repository.ts`, `rows.ts` | | |
| `core/` | `src/app/core/study-store.ts` | | |
| `pages/` | `src/app/pages/[tela]/` | | |
| Banco | `supabase/migrations/[timestamp]_[nome].sql` | novo | |]

### Fluxo de dados

[Descreva o caminho de uma ação do usuário: componente → `StudyStore` (atualização otimista) → `StudyRepository` → Supabase, e de volta pelos signals e `computed`. Indique quais `computed` se recalculam (`agendador`, `trechos`, fila em `ReviewQueueService`).]

## Design de implementação

### Principais interfaces

[Defina as assinaturas novas ou alteradas, em TypeScript, com no máximo 20 linhas por exemplo. Respeite o limite de 3 parâmetros (acima disso, objeto de parâmetros) e o tipo de retorno explícito:

```ts
export function nomeDaFuncao(entrada: Tipo, hoje: Date): Resultado;

class StudyStore {
  acao(params: ParamsDaAcao): Promise<void>;
}

class StudyRepository {
  metodo(id: ID): Promise<Tipo>;
}
```

]

### Modelos de dados

Documente **cada** tipo do domínio ou estrutura persistida usando o modelo abaixo: uma subseção própria, uma tabela de campos e um exemplo representativo.

#### `[NomeDoTipo]` — [descrição curta]

| Campo     | Tipo     | Obrigatório | Descrição   |
| --------- | -------- | ----------- | ----------- |
| `[campo]` | `[tipo]` | sim/não     | [Descrição] |

```ts
const exemplo: NomeDoTipo = {
  campo: 'valor realista',
};
```

[Repita o padrão para cada tipo novo ou alterado. Se a mudança tocar em `Bloco` ou nos segmentos de texto rico (`{k:'t'}`, `{k:'g', id}`, `{k:'d'}`), diga como os ids de bloco e de lacuna continuam estáveis e o que acontece com os resumos já gravados em `resumos.blocos`.]

#### Mapeamento linha do banco ↔ modelo (`rows.ts`)

| Coluna (snake_case) | Campo do modelo |
| ------------------- | --------------- |
| `[coluna]`          | `[campo]`       |

### Banco (Supabase)

[Inclua somente se houver mudança de esquema, RLS, Storage ou Auth. Toda mudança é uma migração nova em `supabase/migrations/`; nunca edite uma migração já aplicada.]

#### Migração `[nome]`

```sql
create table [tabela] (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  [coluna] [tipo] not null check ([regra])
);
alter table [tabela] enable row level security;
```

| Item | Definição |
| ---- | --------- |
| Políticas RLS | [dono: `user_id = auth.uid()` para select, insert, update, delete] |
| Checks repetidos em `domain/settings.ts` | [faixas e limites] |
| Índices | [colunas e motivo] |
| Storage (bucket `anexos`) | [caminho `userId/resumoId/...`, se aplicável] |
| Dados existentes | [como as linhas já gravadas são convertidas, se aplicável] |

> O app nunca envia `user_id` e as consultas não filtram por usuário: a RLS faz isso.

### Erros e desfazer

[Para cada escrita nova, descreva o que a tela mostra antes da resposta do banco, o que é desfeito se o banco recusar e o texto exato do toast (design §6 ou seção "Textos da interface" do PRD).]

| Ação | Atualização otimista | Se o banco recusar | Toast |
| ---- | -------------------- | ------------------ | ----- |
| [ação] | [o que muda na tela] | [o que é restaurado] | [texto exato] |

## Abordagem de testes

Defina a estratégia de testes seguindo `.claude/rules/tests.md` e nomeie cada caso com um identificador estável: `TU-*` para unidade (Vitest, funções puras), `TI-*` para integração (Vitest com `TestBed` e os fakes de `src/app/testing/fakes.ts`), `TB-*` para banco (pgTAP em `supabase/tests/`) e `E2E-*` para os fluxos ponta a ponta (Playwright e axe em `e2e/`). Associe cada caso aos critérios de aceitação (`CA-*`) que ele verifica. Registre como não aplicável qualquer camada que não faça sentido. Teste cada regra no nível mais baixo possível.

### Testes de unidade

| ID | Arquivo | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|---------|-----------------------|------------------------|--------------------|
| TU-01 | `src/app/domain/[arquivo].spec.ts` | [quando <situação>, <resultado>] | [CA-01] | [resultado esperado] |

[Cobertura: `domain/` continua em 100% (`npm run test:coverage`). Datas são fixas ou com `vi.useFakeTimers()`.]

### Testes de integração (se aplicável)

| ID | Arquivo | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|---------|-----------------------|------------------------|--------------------|
| TI-01 | `src/app/core/study-store.spec.ts` | [nome] | [CA-01] | [resultado esperado] |

[Inclua o caso em que o banco recusa a escrita e o `StudyStore` desfaz e mostra o toast.]

### Testes de banco (se aplicável)

| ID | Arquivo | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|---------|-----------------------|------------------------|--------------------|
| TB-01 | `supabase/tests/[arquivo].test.sql` | [um usuário não lê nem altera as linhas de outro] | [CA-01] | [resultado esperado] |

### Testes E2E (se aplicável)

| ID | Arquivo | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|---------|-----------------------|------------------------|--------------------|
| E2E-01 | `e2e/fluxos.spec.ts` | [nome] | [CA-01] | [resultado esperado] |

[Poucos E2E, só para os fluxos principais. Marque com `@celular` os que validam a tela abaixo de 760px. Localize elementos por papel e nome acessível.]

## Sequenciamento do desenvolvimento

### Ordem de construção

[Descreva a sequência de implementação, de dentro para fora:

1. Tipos e funções puras em `domain/` (sem dependências)
2. Migração, RLS e teste de banco
3. `rows.ts` e `StudyRepository`
4. `StudyStore` e serviços
5. Editor e telas
6. E2E]

### Dependências técnicas

[Liste os bloqueadores: bibliotecas novas (`npm install`), mudanças na especificação, dados de exemplo.]

## Considerações técnicas

### Principais decisões

[Registre as principais decisões técnicas:

- Escolha da abordagem e justificativa
- Trade-offs considerados
- Alternativas descartadas e os motivos]

### Riscos conhecidos

[Liste os riscos técnicos, em especial perda de histórico FSRS, dados de um usuário visíveis para outro e gravação corrompida em `resumos.blocos`:

- Desafios potenciais
- Abordagens de mitigação
- Áreas que precisam de pesquisa]

### Conformidade com o CLAUDE.md e as rules

[Confirme a leitura do `CLAUDE.md`, de `.claude/rules/code-standards.md` e de `.claude/rules/tests.md`. Registre as restrições relevantes para esta especificação (ex.: arquivos com até 100 linhas pedem a divisão de um arquivo grande; textos seguem o design §6; estilos usam os tokens de `src/styles.css`).]

### Conformidade com skills

[Liste somente as skills de `.claude/skills/` aplicáveis a esta especificação: `angular-developer`, `vitest`, `supabase`, `supabase-postgres-best-practices`, `playwright-cli`.]

### Arquivos relevantes e dependentes

[Liste os arquivos relevantes e os que dependem deles.]
