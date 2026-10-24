# Padrões de código

Regras para todo código novo ou alterado. Os exemplos usam TypeScript e termos do projeto, mas são ilustrativos: alguns nomes de campos e funções não existem no código.

## Regras de codificação

### 1. Não escreva comentários

O código se explica pelos nomes de variáveis, funções e tipos. Só comente quando for absolutamente necessário, como para explicar uma expressão regular complexa. Também não deixe código comentado: o histórico fica no git.

Errado:

```ts
// Calcula a média dos valores
export function mean(values: readonly number[]): number | null {
  // lista vazia não tem média
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length; // soma e divide pelo total
}
```

Certo:

```ts
export function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}
```

Exceção aceita, porque a expressão sozinha não diz o que captura:

```ts
// "## Título" ou "### Título": grupo 1 = os #, grupo 2 = o texto sem espaços nas pontas
const TITULO_MARKDOWN = /^(#{2,3})\s+(.+?)\s*$/;
```

### 2. Arquivos e classes com no máximo 100 linhas, funções e métodos com no máximo 30

Se um método passar de 30 linhas, divida-o em métodos menores com nomes que digam o que cada um faz. Se um arquivo ou classe passar de 100 linhas, divida-o em mais arquivos, cada um com uma responsabilidade.

Errado (um método que valida, atualiza a tela, grava e desfaz):

```ts
async salvarResumo(resumo: Resumo): Promise<void> {
  if (!resumo.titulo.trim()) {
    this.toast.erro('Dê um título ao resumo.');
    return;
  }
  const anterior = this.resumos().find((r) => r.id === resumo.id);
  this.resumos.update((lista) => lista.map((r) => (r.id === resumo.id ? resumo : r)));
  try {
    await this.repo.salvarResumo(resumo);
  } catch {
    this.resumos.update((lista) => lista.map((r) => (r.id === resumo.id ? anterior! : r)));
    this.toast.erro('Não foi possível salvar.');
  }
  // ... mais 30 linhas
}
```

Certo:

```ts
async salvarResumo(resumo: Resumo): Promise<void> {
  if (!this.tituloValido(resumo)) return;
  const anterior = this.trocarNaTela(resumo);
  await this.gravarOuDesfazer(resumo, anterior);
}
```

Para arquivos: um `health.ts` que calcula saúde, pontos fracos e mapa de calor vira `health.ts`, `weak-points.ts` e `heatmap.ts`.

### 3. No máximo 3 níveis de if/else aninhados

Prefira cláusulas de guarda (*early return*): trate os casos que encerram a função logo no começo e deixe o caminho principal sem aninhamento.

Errado:

```ts
function proximaRevisao(estado: EstadoTrecho | undefined, hoje: Date): Date | null {
  if (estado) {
    if (!estado.suspenso) {
      if (estado.vencimento) {
        if (estado.vencimento < hoje) {
          return hoje;
        } else {
          return estado.vencimento;
        }
      }
    }
  }
  return null;
}
```

Certo:

```ts
function proximaRevisao(estado: EstadoTrecho | undefined, hoje: Date): Date | null {
  if (!estado || estado.suspenso || !estado.vencimento) return null;
  if (estado.vencimento < hoje) return hoje;
  return estado.vencimento;
}
```

### 4. No máximo 3 parâmetros por função ou método

Se precisar de mais, crie um objeto de parâmetros com um tipo próprio.

Errado:

```ts
function criarLacuna(resumoId: ID, blocoId: ID, inicio: number, fim: number, dica?: string): Lacuna {
  // ...
}

criarLacuna(resumo.id, bloco.id, inicio, fim);
```

Certo:

```ts
interface NovaLacuna {
  resumoId: ID;
  blocoId: ID;
  inicio: number;
  fim: number;
  dica?: string;
}

function criarLacuna({ resumoId, blocoId, inicio, fim, dica }: NovaLacuna): Lacuna {
  // ...
}

criarLacuna({ resumoId: resumo.id, blocoId: bloco.id, inicio, fim });
```

### 5. Sem linhas em branco dentro de funções e métodos

Linhas em branco entre métodos, entre funções e entre os imports e o resto do arquivo estão certas. Dentro de uma função, não. Se a função parece pedir um "respiro" entre partes, é sinal de que cada parte deveria ser outra função (regra 2).

Errado:

```ts
protected escolherRetencao(retencao: Configuracoes['retencao']): void {
  const atual = this.config().retencao;

  if (retencao === atual) return;

  void this.salvar({ retencao });
}
```

Certo:

```ts
protected escolherRetencao(retencao: Configuracoes['retencao']): void {
  if (retencao === this.config().retencao) return;
  void this.salvar({ retencao });
}

protected restaurarPadrao(): void {
  void this.salvar(CONFIG_PADRAO);
}
```

### 6. Números e strings mágicos viram constantes

Um valor solto no código não diz o que significa. Dê a ele um nome em `UPPER_SNAKE_CASE`, no topo do arquivo ou num arquivo de constantes se for usado em mais de um lugar. Valores óbvios pelo contexto, como o `0` em `lista.length === 0`, e os valores de um tipo união (`'baixa' | 'media' | 'alta'`) não precisam de constante.

Errado:

```ts
export function healthBand(pct: number): FaixaSaude {
  if (pct < 70) return 'baixa';
  if (pct < 85) return 'media';
  return 'alta';
}

await supabase.storage.from('anexos').upload(caminho, arquivo);
```

Certo:

```ts
const LIMITE_SAUDE_BAIXA = 70;
const LIMITE_SAUDE_ALTA = 85;
const BUCKET_ANEXOS = 'anexos';

export function healthBand(pct: number): FaixaSaude {
  if (pct < LIMITE_SAUDE_BAIXA) return 'baixa';
  if (pct < LIMITE_SAUDE_ALTA) return 'media';
  return 'alta';
}

await supabase.storage.from(BUCKET_ANEXOS).upload(caminho, arquivo);
```

### 7. Declare cada variável onde ela é usada

Declare a variável logo antes do primeiro uso e no menor escopo possível (dentro do `if` ou do laço, se só for usada ali). Não declare tudo no começo da função e não calcule valores que um *early return* pode descartar.

Errado:

```ts
function resumirSessao(registros: readonly RegistroRevisao[]): ResumoSessao {
  const acertos = registros.filter((r) => r.nota >= NOTA_MINIMA_ACERTO).length;
  const duracao = calcularDuracao(registros);
  let media: number;
  if (registros.length === 0) return SESSAO_VAZIA;
  media = mean(registros.map((r) => r.nota))!;
  return { acertos, duracao, media };
}
```

Certo:

```ts
function resumirSessao(registros: readonly RegistroRevisao[]): ResumoSessao {
  if (registros.length === 0) return SESSAO_VAZIA;
  const acertos = registros.filter((r) => r.nota >= NOTA_MINIMA_ACERTO).length;
  const media = mean(registros.map((r) => r.nota))!;
  return { acertos, duracao: calcularDuracao(registros), media };
}
```

### 8. Dados sensíveis nunca ficam no código

Chaves de API, senhas, tokens e URLs com credenciais ficam num arquivo `.env`, que não vai para o git. O `.gitignore` já ignora `.env` e `.env.*`. Mantenha no git um `.env.example` com os nomes das variáveis e sem os valores, para quem clonar o projeto saber o que preencher.

Errado:

```ts
const admin = createClient('https://xyzcompany.supabase.co', 'sb_secret_9f8a7b6c5d...');
```

Certo, em `.env` (fora do git):

```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SECRET_KEY=sb_secret_...
```

Em `.env.example` (no git):

```bash
SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

No código (script ou teste em Node, rodando com `node --env-file=.env`):

```ts
function variavelObrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Defina ${nome} no arquivo .env`);
  return valor;
}

const admin = createClient(variavelObrigatoria('SUPABASE_URL'), variavelObrigatoria('SUPABASE_SECRET_KEY'));
```

Cuidado com o frontend: tudo o que vai para o navegador é público, mesmo que venha de um `.env` na hora do build. No frontend só pode entrar a chave pública do Supabase (publishable), que depende da RLS para proteger os dados. A chave secreta (secret ou service_role) nunca vai para o frontend.

## Convenções do projeto

### Idioma

- Interface, mensagens de erro e commits em **pt-BR**.
- Termos do domínio ficam em português no código: `trecho`, `lacuna`, `materia`, `assunto`, `resumo`, `revisao`, `configuracoes`. Termos técnicos genéricos podem ficar em inglês (ex.: `healthByAssunto`, `mean`, `splitTrechos`).
- Textos da interface seguem o design §6 à risca.

### Formatação

- Prettier (`.prettierrc`): aspas simples, linha de até 100 caracteres, parser `angular` nos `.html`.
- `.editorconfig`: 2 espaços, UTF-8, linha em branco no fim do arquivo.
- `npm run lint` precisa passar. Ele inclui as regras de acessibilidade dos templates (`templateAccessibility`).

### TypeScript

- Modo estrito, mais `noImplicitReturns`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature` e `noFallthroughCasesInSwitch`.
- Não use `any`. Prefira `readonly` em parâmetros de lista (`readonly T[]`, `ReadonlyMap`).
- Funções exportadas têm tipo de retorno explícito.

### Angular

- Componentes standalone, com `changeDetection: ChangeDetectionStrategy.OnPush`, template e CSS em arquivos separados (`templateUrl`, `styleUrl`).
- Seletores com prefixo `app-` (componentes em kebab-case, diretivas em camelCase).
- Injeção com `inject()`, não pelo construtor.
- Estado com signals: `input()`, `input.required()`, `output()`, `viewChild()`, `computed()`. Não use `@Input`/`@Output`.
- Templates com o controle de fluxo novo (`@if`, `@for`, `@switch`), nunca `*ngIf`/`*ngFor`.
- Membros usados só pelo template são `protected`. O que é interno é `private`. Campos que não mudam são `readonly`.
- Rotas novas com `loadComponent` (carregamento sob demanda) e `title` no formato `'Nome · Trechos'`.

### Onde colocar cada coisa

- Regra de negócio é função pura em `src/app/domain/`, sem Angular nem Supabase, com 100% de cobertura.
- Componentes não falam com o Supabase: toda leitura e escrita passa pelo `StudyStore`, que usa o `StudyRepository`.
- Valores derivados são `computed`, não estado copiado.
- Estilos usam os tokens e classes do design system em `src/styles.css`. Não crie cores soltas.

### Testes

- O arquivo de teste fica ao lado do código, com o mesmo nome e `.spec.ts`.
- Nomes de `describe` e `it` em pt-BR, descrevendo o comportamento.
- Testes de componente usam os fakes de `src/app/testing/fakes.ts` (`fakeStudyRepo`, `provideFakeAuth`), nunca o Supabase de verdade.
- Mudou uma regra em `domain/`? A cobertura continua em 100% (`npm run test:coverage`).

### Banco

- Toda mudança de esquema é uma migração nova em `supabase/migrations/`. Nunca edite uma migração já aplicada.
- Tabela nova tem `user_id default auth.uid()` e política RLS de dono, e ganha teste em `supabase/tests/`.
- Checks do banco (faixas, limites) se repetem em `src/app/domain/settings.ts`.
