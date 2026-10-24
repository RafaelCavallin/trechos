# Regras de testes

Ferramentas do projeto:

- **Vitest** para testes de unidade e de integração no frontend (`npm test`, que roda o Vitest pelo `@angular/build:unit-test`). `describe`, `it`, `expect` e `vi` são globais, sem import. Não use Jasmine, Karma nem Jest.
- **Playwright** (com `@axe-core/playwright` para acessibilidade) para os testes E2E, em `e2e/`.
- **pgTAP** (`npm run test:db`) para os testes do banco, em `supabase/tests/`.

Os exemplos seguem os [padrões de código](code-standards.md): sem comentários e sem linhas em branco dentro das funções. Eles usam termos e auxiliares do projeto, mas são ilustrativos: alguns nomes de funções e textos não existem no código.

## 1. Todo código é coberto por testes automatizados

**Regra crítica: não pode ser ignorada.** Toda função, serviço, componente ou migração nova ou alterada sai com teste. Correção de bug começa por um teste que reproduz o bug e falha. Depois vem a correção, que faz o teste passar. Uma tarefa só está pronta quando os testes passam.

Exemplo: criou `diasAteVencer` em `src/app/scheduler/dates.ts`, então o `dates.spec.ts` ao lado ganha os casos dela no mesmo trabalho.

```ts
describe('diasAteVencer', () => {
  it('quando vence amanhã, retorna 1', () => {
    expect(diasAteVencer(dia(1), hoje)).toBe(1);
  });
  it('quando já venceu, retorna 0 e não um número negativo', () => {
    expect(diasAteVencer(dia(-3), hoje)).toBe(0);
  });
});
```

## 2. Cobertura mínima de 80%, com foco no que é crítico

A cobertura de todo o código fica em **no mínimo 80%**. Mais importante que o número é *onde* está a cobertura: teste primeiro e com mais cuidado o que causa mais estrago se quebrar. Assim como um checkout é mais crítico que um cadastro de produto, aqui:

| Prioridade | O quê | Por quê |
| --- | --- | --- |
| Crítico (100%) | `domain/` (trechos, lacunas, nota, saúde), `scheduler/` (FSRS e fila do dia), `review/session.ts`, gravação otimista e desfazer do `StudyStore`, RLS do banco | Erro aqui faz o trecho perder o histórico, dá nota ou data de revisão errada, ou mostra dados de um usuário para outro |
| Alto | `data/rows.ts`, `editor/` (ids estáveis de bloco e lacuna), telas Revisão e Editor | Erro aqui corrompe o que é gravado ou quebra o fluxo principal |
| Normal | Demais telas, `layout/`, `shared/` | Erro aqui é visual ou fácil de perceber e corrigir |

```bash
npm run test:coverage                    # cobertura de src/app/domain, mantida em 100%
npx ng test --watch=false --coverage     # cobertura de todo o src/, relatório em coverage/
```

Errado (cobre linhas, mas protege pouco):

```ts
it('renderiza a barra lateral', () => {
  expect(fixture.nativeElement.querySelector('nav')).toBeTruthy();
});
```

Certo (protege uma regra crítica: dividir não pode perder o histórico):

```ts
it('ao dividir pelos subtítulos, os trechos novos herdam o estado do trecho pai', async () => {
  await store.dividirPorSubtitulos('r1', 'b1');
  expect(store.estado('r1:b5')).toEqual(store.estado('r1:b1'));
});
```

## 3. Princípios FIRST

### Fast: rápidos

Testes de unidade e de integração não acessam rede, banco nem Storage. Troque essas dependências por *stubs* e *fakes*: `fakeStudyRepo()`, `provideFakeAuth()` e `provideFakeQueue()` em `src/app/testing/fakes.ts`. Só os testes de banco (`test:db`) e os E2E falam com o Supabase de verdade.

Errado:

```ts
const repo = new StudyRepository();
TestBed.configureTestingModule({ providers: [{ provide: StudyRepository, useValue: repo }] });
```

Certo:

```ts
const repo = fakeStudyRepo();
repo.listRegistros.mockResolvedValue([registro({ nota: 4 })]);
TestBed.configureTestingModule({
  providers: [{ provide: StudyRepository, useValue: repo }, provideFakeAuth(fakeAuth(true))],
});
```

### Independent: independentes

Um teste não pode depender de outro ter rodado antes. Cada teste monta os próprios dados: um `fakeStudyRepo()` novo no `beforeEach` e, nos E2E, uma conta nova com `novaConta(page)` (`e2e/ajuda.ts`). Não guarde estado entre testes em variáveis no nível do arquivo, e desfaça no `afterEach` o que mudou no ambiente (`vi.useRealTimers()`, `vi.restoreAllMocks()`).

Errado (o segundo teste quebra se o primeiro falhar ou rodar sozinho):

```ts
let criada: Materia;

it('cria matéria', async () => {
  criada = await store.createMateria();
  expect(criada.nome).toBe('Nova matéria');
});

it('renomeia a matéria criada', async () => {
  await store.rename('materia', criada.id, 'Direito');
  expect(store.materias().at(-1)?.nome).toBe('Direito');
});
```

Certo:

```ts
it('renomeia a matéria', async () => {
  const criada = await store.createMateria();
  await store.rename('materia', criada.id, 'Direito');
  expect(store.materias().at(-1)?.nome).toBe('Direito');
});
```

### Repeatable: repetíveis

O teste dá o mesmo resultado em qualquer máquina, dia e horário, quantas vezes rodar. Nada de `new Date()`, `Date.now()` ou `Math.random()` decidindo o resultado. As funções do domínio recebem a data como parâmetro (`buildDailyQueue(candidatos, hoje, limite)`), e os testes passam datas fixas. Quando o código lê o relógio por dentro, use *mock* do tempo com `vi.useFakeTimers()` e `vi.setSystemTime()`. Respostas de APIs externas também viram *mocks* com valor fixo. Os E2E já rodam com `locale: 'pt-BR'` e `timezoneId: 'America/Sao_Paulo'` fixos (`playwright.config.ts`).

Errado (o resultado muda conforme a hora em que o teste roda):

```ts
it('inclui o que vence hoje', () => {
  const fila = buildDailyQueue([c('t1', 'm', { due: new Date() })], new Date(), LIMITE);
  expect(fila).toHaveLength(1);
});
```

Certo:

```ts
const hoje = new Date(2026, 9, 23, 10, 0);
const dia = (n: number, hora = 12) => new Date(2026, 9, 23 + n, hora, 0);

it('inclui o que vence hoje, mesmo mais tarde no dia', () => {
  const fila = buildDailyQueue([c('hoje-tarde', 'm', { due: dia(0, 23) })], hoje, LIMITE);
  expect(fila.map((x) => x.key)).toEqual(['hoje-tarde']);
});
```

Com relógio controlado:

```ts
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 23, 10, 0));
});

afterEach(() => vi.useRealTimers());
```

### Self-validating: autovalidáveis

O teste decide sozinho se passou ou falhou, e precisa falhar quando o comportamento quebra. Cobertura não basta: uma linha executada sem `expect` não está testada. Verifique os valores exatos de retorno, o estado depois da ação, as chamadas às dependências (`toHaveBeenCalledWith`) e os caminhos de erro. Prefira `toBe`/`toEqual` com o valor esperado a `toBeTruthy`/`toBeDefined`. Ao escrever um teste novo, confira que ele falha quando a regra é quebrada de propósito.

Errado (passa mesmo com a nota errada):

```ts
it('calcula a nota', () => {
  const resultado = calcularNota(marcas, CONFIG_PADRAO.faixas);
  expect(resultado).toBeDefined();
});
```

Certo:

```ts
it('3 de 4 lacunas certas dá 75% e nota Good', () => {
  const resultado = calcularNota([true, true, true, false], CONFIG_PADRAO.faixas);
  expect(resultado).toEqual({ pct: 75, nota: 'good' });
});

it('desfaz o renomear se o banco recusar e avisa', async () => {
  repo.renameMateria.mockRejectedValue(new Error('falhou'));
  await store.rename('materia', 'm1', 'Outro nome');
  expect(store.materias()[0].nome).toBe('Adm');
  expect(TestBed.inject(ToastService).message()).toBe('Não foi possível salvar. Tente de novo.');
});
```

## 4. Estrutura: Given/When/Then ou AAA

Todo teste tem três partes, nesta ordem: preparar (Arrange / *Given*), executar **uma** ação (Act / *When*) e verificar (Assert / *Then*).

- O nome do teste diz o cenário e o resultado esperado: `'quando <situação>, <resultado>'` ou `'<ação> <resultado>'`. O `describe` agrupa pelo contexto (*Given*), quando ajudar.
- O corpo segue a ordem Arrange → Act → Assert sem linhas em branco e sem comentários `// Arrange` (regras 1 e 5 dos padrões de código). Preparação longa vai para uma função auxiliar (`render()`, `c()`, `registro()`), para o teste mostrar só o que importa.
- Um comportamento por teste. Se precisar de dois "When", são dois testes.

```ts
describe('buildDailyQueue com limite diário', () => {
  it('quando há mais trechos que o limite, fica com os de menor retrievability', () => {
    const candidatos = [c('forte', 'm', { r: 0.9 }), c('fraco', 'm', { r: 0.3 })];
    const fila = buildDailyQueue(candidatos, hoje, 1);
    expect(fila.map((x) => x.key)).toEqual(['fraco']);
  });
});
```

## 5. Ordem de criação dos testes

Escreva e rode os testes do mais barato para o mais caro, para ter retorno rápido e gastar menos tempo e contexto:

1. Leia o `.spec.ts` que já existe ao lado do código e reaproveite os auxiliares (`testing/fakes.ts`, `e2e/ajuda.ts`, funções como `c()` e `dia()`).
2. Testes de unidade das funções puras (`domain/`, `scheduler/`, `review/session.ts`, `stats/`, `data/rows.ts`). Rode só o arquivo: `npx ng test --watch=false --include src/app/domain/trechos.spec.ts`.
3. Testes de integração de serviços e do `StudyStore` com o repositório falso.
4. Testes de componente com `TestBed` e os fakes.
5. Teste de banco (`npm run test:db`) se mudou migração, tabela ou política RLS.
6. E2E (`npx playwright test e2e/fluxos.spec.ts -g "<nome>"`) só se o fluxo principal mudou.
7. No fim, a suíte inteira (`npx ng test --watch=false`), a cobertura e o `npm run lint`.

## 6. Pirâmide de testes

A base é larga: a maioria dos testes é de unidade. Acima vêm menos testes de integração e, no topo, poucos E2E. Teste cada regra no nível mais baixo possível: todas as faixas de nota são testadas na unidade, e o E2E só confere que uma revisão completa grava a nota e a próxima data.

| Nível | Ferramenta | O que cobre | Quantidade |
| --- | --- | --- | --- |
| Unidade | Vitest | Funções puras: divisão em trechos, lacunas, nota, saúde, fila, FSRS, conversão de linhas | A maioria |
| Integração | Vitest + `TestBed` e fakes; pgTAP | Componentes, `StudyStore`, serviços; esquema e RLS do banco | Menos |
| E2E | Playwright + axe | Fluxos principais de ponta a ponta, acessibilidade, celular (`@celular`) | Poucos |

Nos E2E, ache os elementos como o usuário os vê, por papel e nome acessível (`getByRole`, `getByLabel`), e não por classe CSS:

```ts
test('revisar um trecho grava a nota e mostra a próxima data', async ({ page }) => {
  await contaComExemplos(page);
  await revisarTudoComoAcerto(page);
  await expect(page.getByRole('heading', { name: 'Resumo da sessão' })).toBeVisible();
});
```
