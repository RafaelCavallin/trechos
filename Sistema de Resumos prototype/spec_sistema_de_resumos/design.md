# Design técnico — Sistema de Resumos

## 1. Arquitetura sugerida

Stack livre; sugestão: **React + TypeScript** (SPA), estado em store (Zustand/Redux), persistência via API REST/tRPC + Postgres, ou local-first (IndexedDB) com sync. FSRS: usar biblioteca mantida (ex.: **`ts-fsrs`**), não a fórmula simplificada do protótipo.

Camadas:
- `domain/` — tipos, `splitTrechos`, `countItems`, `generateDynamicGaps`, `gradeFromMarks`, `changeRatio`, agregação de saúde. **Funções puras, 100% testadas.**
- `scheduler/` — adaptador FSRS (estado ↔ biblioteca), fila diária e intercalação.
- `editor/` — modelo de blocos e operações (inserir, mover, ocultar, negrito, juntar/dividir).
- `ui/` — telas e componentes (§5).

## 2. Modelo de dados

```ts
type ID = string;

interface Materia { id: ID; nome: string; ordem: number; }
interface Assunto { id: ID; materiaId: ID; nome: string; ordem: number; }
interface Resumo  { id: ID; assuntoId: ID; titulo: string; ordem: number; blocos: Bloco[]; }

// Segmentos de texto rico dentro de um bloco
type Segmento =
  | { k: 't'; t: string; b?: boolean }          // texto (b = negrito)
  | { k: 'g'; id: ID; t: string };              // lacuna manual (id estável)

type Bloco =
  | { id: ID; type: 'h2'; segs: Segmento[]; merge?: boolean; qs?: Pergunta[] }   // merge = juntado ao anterior
  | { id: ID; type: 'h3'; segs: Segmento[]; split?: boolean; qs?: Pergunta[] }   // split = inicia trecho
  | { id: ID; type: 'p' | 'quote'; segs: Segmento[]; qs?: Pergunta[] }
  | { id: ID; type: 'special'; kind: 'pegadinha'|'excecao'|'exemplo'|'analogia'; segs: Segmento[]; qs?: Pergunta[] }
  | { id: ID; type: 'list'; items: Segmento[][]; qs?: Pergunta[] }
  | { id: ID; type: 'table'; rows: Segmento[][][]; qs?: Pergunta[] }           // rows[linha][célula] ; linha 0 = cabeçalho
  | { id: ID; type: 'attach'; kind: 'image' | 'file'; name: string; url: string };

interface Pergunta { id: ID; q: string; a: string; }

// Estado FSRS por trecho. Chave = `${resumoId}:${idDoBlocoInicial}`
interface EstadoTrecho {
  key: string; S: number; D: number; due: Date; lastReview?: Date; reps: number; lapses: number;
}

interface RegistroRevisao {
  id: ID; trechoKey: string; data: Date; modo: Modo; total: number; acertos: number;
  pct: number; nota: 'Again'|'Hard'|'Good'|'Easy'; marcas: Record<ID /*item*/, boolean>;
}

interface EstatLacuna { lacunaId: ID; n: number; erros: number; }  // derivável de RegistroRevisao

interface Configuracoes {
  retencao: 0.80|0.85|0.90|0.95;        // padrão 0.90
  limiteTipo: 'palavras'|'lacunas';     // padrão 'palavras'
  limitePalavras: number;               // 150
  limiteLacunas: number;                // 10
  faixas: { easy: number; good: number; hard: number };  // 100/90/60
  densidade: 'baixa'|'média'|'alta';    // 'média'
  limiteEdicao: number;                 // 30 (%)
  limiteDiario: number;                 // 20
}

type Modo = 'lacunas' | 'perguntas' | 'titulo' | 'densas';
```

Trechos **não são persistidos como entidade de conteúdo**: são derivados dos blocos a cada leitura (§3.1). Só o `EstadoTrecho` é persistido, indexado pelo id do bloco inicial — por isso ids de bloco devem ser estáveis.

## 3. Algoritmos

### 3.1 Divisão em trechos (`splitTrechos`)
```
para cada bloco b no índice i:
  inicia = i == 0 || (b.type=='h2' && !b.merge) || (b.type=='h3' && b.split)
  se inicia: novo trecho { id: b.id, titulo: texto(b) se h2/h3 senão 'Sem título' }
  adiciona b ao trecho atual
para cada trecho: palavras, lacunas (count k=='g'), perguntas (soma qs), itens = lacunas+perguntas,
                  subtitulos = blocos h3 (exceto o 1º) sem split
```
- **Juntar ao anterior**: `h2.merge = true`. **Separar**: `merge = false`.
- **Dividir pelos subtítulos**: `split = true` em cada H3 de `subtitulos`; copiar `EstadoTrecho` do trecho pai para as novas chaves.
- Trecho com 0 itens não entra na fila. Trecho acima do limite: `limiteTipo=='palavras' ? palavras > limitePalavras : lacunas > limiteLacunas`.

### 3.2 Ocultar / Negrito por seleção
Mapear a seleção do DOM para `(blocoId, caminho, índiceSegmento, início, fim)`. Cada span de texto renderizado carrega `data-bid`, `data-path` (`segs` | `items.i` | `rows.r.c`) e `data-si`. Se âncora e foco não estão no mesmo span de texto → recusar (R3.3). Aparar espaços; substituir o segmento por `[antes?, novo, depois?]`, onde `novo` = lacuna `{k:'g', id: novoId}` ou texto `{b:true}`. Toolbar deve usar `mousedown.preventDefault()` para não perder a seleção.

### 3.3 Lacunas dinâmicas
```
N = { lacunas: {baixa:8, média:5, alta:3}[densidade], densas: 2, titulo/perguntas: 0 }
contador = 0
para cada bloco do trecho (exceto o título inicial e anexos), para cada segmento de texto não-negrito:
  para cada palavra (regex /^[A-Za-zÀ-ÿ]{7,}$/ após separar pontuação final):
    contador++ ; se contador % N == 0 → vira lacuna dinâmica id = `d:${bloco}:${path}:${seg}:${palavra}`
```
Determinístico por versão do texto. Produção pode melhorar (stopwords, termos-chave, evitar palavras adjacentes a lacunas manuais).

### 3.4 Itens e nota
- Modo `perguntas`: itens = perguntas da margem de todos os blocos do trecho.
- Demais: itens = lacunas (manuais + dinâmicas geradas) na ordem do texto, numeradas 1..n.
- `pct = round(acertos / total × 100)`; nota: `pct ≥ easy → Easy; ≥ good → Good; ≥ hard → Hard; senão Again`.

### 3.5 Modo por estágio
```
S < 4 → 'lacunas' ; S < 16 → (perguntas > 0 ? 'perguntas' : 'titulo') ; senão 'densas'
fallback: 'perguntas' sem perguntas → 'titulo'; outro modo sem lacunas → 'perguntas'
```

### 3.6 Agendamento
Produção: `ts-fsrs` com `request_retention = config.retencao`; mapear nota → Rating. Trecho novo: `due = hoje`.
Protótipo (apenas referência, **não copiar**):
```
S' = Again: max(.5, S·.35) | Hard: max(1, S·1.3) | Good: max(2, S·2.6) | Easy: max(4, S·3.6)
intervalo = Again ? 1 : max(1, round(S' · ln(R)/ln(0.9)))
```

### 3.7 Edição de trecho revisado (`changeRatio`)
Comparar texto antes/depois (sem marcações `[[ ]]`/`** **`): remover prefixo e sufixo comuns; `pct = (max(len) − prefixo − sufixo) / len(antes)`. Produção pode usar diff por palavras (Levenshtein). Se `pct > limiteEdicao` e `S > 0`: `S = max(0.5, S·0.4)`, `due = hoje`.

### 3.8 Fila diária
Trechos com `due ≤ hoje`, itens ≥ 1, não revisados hoje → ordenar por menor R → **intercalar por matéria** (round-robin entre matérias) → cortar em `limiteDiario`. Tempo estimado = 2 min/trecho.

### 3.9 Saúde
`R_trecho` via FSRS (`retrievability(S, dias desde última revisão)`). Assunto = média dos trechos dos seus resumos; matéria = média dos assuntos. Pontos fracos = lacunas com `n ≥ 3 e erros > 0`, ordenadas por `erros/n`, top 4. Mapa de calor: nível 0 (0%), 1 (< 25%), 2 (< 50%), 3 (≥ 50%).

## 4. Navegação

Sidebar fixa (232px) com: **Início, Matérias, Revisão** (badge com nº de trechos na fila), **Estatísticas** e, no rodapé, **Configurações**. O Editor é uma subtela de Matérias (item "Matérias" fica ativo). Rotas sugeridas: `/`, `/materias`, `/resumos/:id`, `/revisao`, `/estatisticas`, `/configuracoes`.

## 5. Telas

Área de conteúdo: padding 36px 44px 96px, rolagem própria, conteúdo alinhado à esquerda com `max-width` por tela.

### 5.1 Início (max 1100px)
- Kicker "SEXTA-FEIRA, 23 DE OUTUBRO" (12px, uppercase, 0.1em, 700, accent-700); H1 44px "N trechos para revisar hoje"; subtítulo 16px neutral-700 "Cerca de X minutos, intercalando N matérias."
- Grid `auto-fit minmax(340px,1fr)` gap 22px:
  - Card **Revisões de hoje**: linhas-pílula (bg `--color-bg`, padding 13px 18px) com ponto colorido 12px, nome da matéria (600), "3 trechos · ~6 min". Botão primário 16px "Iniciar sessão · ~10 min" com ícone play. Nota 13px "Trechos de matérias diferentes, intercalados. Limite diário: 20 trechos." Estado vazio: caixa accent-2-100 "Nada mais para hoje…".
  - Card **Saúde das matérias**: nome + % (Caprasimo 22px) + barra 10px pílula. Cores: < 70% accent-700/barra accent; 70–84% accent-2-700/barra accent-2-400; ≥ 85% accent-2-800/barra accent-2-600.
- Card **Pontos fracos**: grid `auto-fill minmax(240px,1fr)` de botões arredondados (26px) com tag accent da lacuna, "Trecho · Matéria", "Errada em X de Y revisões".

### 5.2 Matérias (max 980px)
H1 40px + "Matéria → Assunto → Resumo. Arraste pelas alças para reordenar." + botão primário "+ Nova matéria". Um card por matéria; linha da matéria: alça (grip), chevron (rotaciona 90° aberto), nome Caprasimo 21px, tag "3 assuntos", % (cor por faixa), botões ícone (+, lápis, lixeira). Assuntos indentados 40px: nome 700, "Próxima: hoje", tag % (accent-100 se < 70, senão accent-2-100). Resumos indentados 34px: ícone arquivo + título (ellipsis), "4 trechos · 21 itens". Alvo de drop: fundo accent-200.

### 5.3 Editor (max 1260px)
- Breadcrumb "Matérias › <matéria> › <assunto>"; H1 do resumo; tags "N trechos" (accent-2), "N itens verificáveis" (accent), "N avisos" (outline).
- Toolbar sticky pílula (surface, shadow-md) — §R2.1; **Ocultar** é o único botão primário. Dica abaixo (13px).
- Layout flex-wrap: lista "Trechos" (210px) + conteúdo (flex 1, min 520px).
- Cada trecho: cabeçalho pílula accent-2-100 com tag "Trecho N" (accent-2-500, texto bg), meta, "Juntar ao anterior"; avisos em caixas accent-100/accent-800 com ícone de alerta.
- Cada bloco: linha flex-wrap [bloco (flex 1 1 400px) | margem (240px)]. Bloco selecionado: fundo neutral-100 + anel 2px accent-300, raio 24px.
- Perguntas da margem: cartões accent-2-100, pergunta 13px 700 accent-2-800, resposta 13px.

**Renderização de blocos (componente `Bloco`)**, 16px / 1.8:
- H2: Caprasimo 26px; H3: Caprasimo 20px neutral-800.
- Lista com marcadores, gap 4px. Tabela: `.table` dentro de contêiner neutral-100 raio 22px.
- Citação: aspas Caprasimo 46px accent + texto itálico neutral-800 (sem borda lateral).
- Especiais: caixa raio 24px, borda 1.5px, rótulo 11px uppercase 700. Pegadinha (accent-100/accent-800/borda accent-300), Exceção (accent-2-100/accent-2-800/accent-2-300), Exemplo (neutral-100/neutral-800/neutral-300), Analogia (accent-2-100/accent-2-800/accent-2-200).
- Imagem: área 170px raio 28px + legenda com nome. Arquivo: chip pílula neutral-200 com clipe.
- **Lacuna** (pílula inline, padding 1px 9px, borda 1.5px tracejada, 600, `box-decoration-break: clone`):

| Estado | Fundo | Texto | Borda |
| --- | --- | --- | --- |
| Editor | accent-200 | accent-800 | accent-400 |
| Oculta (manual) — mostra número | neutral-300 | neutral-800 | neutral-400 |
| Oculta (dinâmica) | accent-2-200 | accent-2-800 | accent-2-400 |
| Revelada, sem marca | neutral-100 | text | accent-400 (dinâmica: accent-2-500) |
| Acertou | accent-2-200 | accent-2-900 | accent-2-500 |
| Errou | accent-300 | accent-900 | accent-600 |
| Calor 0 / 1 / 2 / 3 | neutral-200 / accent-100 / accent-300 / accent-400 | text (nível 3: accent-900) | neutral-300 / accent-500 |

### 5.4 Revisão (max 1180px)
- **Início**: kicker "SESSÃO DIÁRIA INTERCALADA", H1 "5 trechos · ~10 min", texto explicativo, lista de pílulas surface (círculo numerado, título, matéria · assunto, tag do formato, tag de itens), botão "Iniciar sessão".
- **Sessão**: linha superior [Sair | progresso "Trecho 2 de 5" + barra 10px accent-2-500 | segmented do formato]. Abaixo, flex-wrap: card do trecho (neutral-100, elev-sm, padding 34px 40px, flex 1 1 480px) + painel "Itens verificáveis" (sticky, 280–380px).
  - Card: tags (matéria, formato), H2 34px do título, instrução, conteúdo do modo, ações.
  - Painel: linha por item (pílula; fundo bg / accent-2-100 acerto / accent-100 erro), círculo numerado, rótulo ("Lacuna", "Lacuna dinâmica", texto revelado, ou a pergunta), tag "dinâmica", botões ícone ✓ (sage) e ✗ (terracota) preenchidos quando ativos, desabilitados antes de revelar/após nota. Rodapé com as faixas de conversão.
  - Resultado: caixa raio 30px na cor da nota (Easy accent-2-200, Good accent-2-100, Hard accent-100, Again accent-200), círculo 96px com %, nota Caprasimo 28px, detalhe, próxima revisão, botão "Próximo trecho" / "Ver resumo da sessão".
- **Concluída**: kicker sage "SESSÃO CONCLUÍDA", H1 "5 trechos revisados", 3 cards de número, tabela de resultados, card "Volta amanhã", botões "Voltar ao início" e "Ver estatísticas".

> O segmented de formato na sessão existe no protótipo para testes. Em produção, exibir apenas o formato definido pelo estágio (opcionalmente atrás de flag de desenvolvedor).

### 5.5 Estatísticas (max 1180px)
Grid `auto-fit minmax(380px,1fr)`: card de retenção (matéria: nome Caprasimo 18px, %, barra; assuntos: grid nome | barra 6px | %) e card histórico (`.table`: Data, Trecho+matéria, Acertos, Nota em tag colorida). Abaixo, card neutral-100 do **mapa de calor**: segmented para escolher o resumo, legenda de 4 níveis, e cada trecho com tag "Trecho N" + tag "% de erro nas lacunas" seguido dos blocos renderizados no modo calor (tooltip "Errada em X de Y revisões").

### 5.6 Configurações (max 760px)
Cards empilhados (`.card`, padding 24px 28px) com `.card-title` e `.card-body`: Retenção desejada (segmented + exemplo), Limite de tamanho (segmented Palavras/Lacunas + input número + unidade), Conversão de acertos (grid nota | input % | tag FSRS; "Não lembrei — abaixo"), Densidade (segmented), Edição de trecho revisado (input %), Limite diário (input).

### 5.7 Componentes transversais
- **Toast**: pílula fixa centrada no rodapé, neutral-900 / neutral-100, 14px, some após ~3,4s.
- **Diálogo de exclusão**: `.dialog-backdrop` + `.dialog` com "Excluir <tipo>?", texto, Cancelar (secundário) / Excluir (primário). Clicar no fundo cancela.

## 6. Textos exatos (pt-BR)

Ver também os critérios em `requirements.md`. Principais:
- Formatos: "Com lacunas", "Só perguntas", "Só o título", "Lacunas densas".
- Notas: "Fácil", "Lembrei", "Lembrei com esforço", "Não lembrei".
- Instruções: lacunas — "Tente lembrar o que falta em cada lacuna — as numeradas em verde são dinâmicas. Depois, revele."; perguntas — "Responda mentalmente cada pergunta da margem, sem ver o texto."; título — "Lembre livremente tudo o que puder sobre este trecho. Depois, compare com o gabarito."; densas — "Trecho estável: muito mais texto oculto. Reconstrua de memória."; após revelar — "Marque cada item como acertou ou errou — clique na lacuna ou use a lista ao lado."
- Placeholder recall: "Escreva livremente o que você lembra deste trecho…"
- Estágios: "Nova · 1ª revisão hoje", "Inicial · próxima hoje", "Intermediário", "Estável".
- Dica do editor: "Selecione uma expressão no texto — inclusive dentro de células de tabela — e clique em Ocultar para transformá-la em lacuna. Clique num bloco para editá-lo ou adicionar perguntas na margem."

## 7. Design tokens (design system Organic)

Usar `prototype/_ds/.../styles.css` como fonte (variáveis CSS + classes `.btn`, `.tag`, `.card`, `.seg`, `.input`, `.table`, `.dialog`).

| Token | Valor |
| --- | --- |
| `--color-bg` | #f5ead8 |
| `--color-surface` | #ebddc5 |
| `--color-text` | #201e1d |
| `--color-accent` (terracota) | #c67139 |
| `--color-accent-2` (sage) | #7a8a5e |
| neutral 100–900 | #f9f4ed #eee7db #dcd3c4 #c0b6a5 #a19786 #82796a #645c50 #474238 #2e2b25 |
| accent 100–900 | #fff2eb #ffe1d0 #ffc6a5 #f6a06b #d67f48 #b2622d #8c491a #643312 #402310 |
| accent-2 100–900 | #f0fae1 #e1eecc #ccdbb2 #aebf92 #8fa073 #728157 #56633f #3d472b #272e1b |
| Fontes | Títulos **Caprasimo** 400; corpo **Figtree** 400/600/700 (Google Fonts) |
| Escala de títulos | h1 42 · h2 32 · h3 25 · h4 20 (px); corpo 15px/1.55 |
| Espaços | 4.4 · 8.8 · 13.2 · 17.6 · 26.4 · 35.2 px |
| Raios | sm 8 · md 16 · lg 28 px; cards/diálogos 32px; botões, tags, inputs, seg **999px** |
| Sombras | sm `0 1px 2px #2e2b2524` · md `0 3px 10px #2e2b2529` · lg `0 12px 32px #2e2b2538` |
| Foco | `outline: 2px solid var(--color-accent); outline-offset: 2px` |
| Ícones | **Lucide**, stroke-width **2.75** (house, book-open, rotate-ccw, chart-column, sliders-horizontal, eye, eye-off, check, x, plus, pencil, trash, chevron-right, grip-vertical, file, image, paperclip, triangle-alert, play) |

Regras: nada de cantos vivos; sem bordas laterais coloridas; texto de parágrafo em accent usa accent-700; preferir espaço em branco a divisores.

## 8. Estado da aplicação (cliente)

- Dados: `materias`, `assuntos`, `resumos` (com blocos), `estadosTrecho`, `registrosRevisao`, `config`.
- UI do editor: `blocoSelecionado`, `blocoEmEdicao` + rascunho, `perguntaEmCriacao` + rascunho, `renomeando` + texto, `confirmacao`, `arraste {nivel, pai, indice}` + `alvoArraste`, `toast`.
- Sessão: `{ fila: {key, resumoId, blocoId, modo}[], indice, revelado, marcas: Record<itemId, boolean>, recall, resultado, resultados[], concluida }`. A fila é congelada ao iniciar; trechos avaliados são marcados como "revisados hoje" imediatamente.

## 9. Dados de exemplo (seed)

O protótipo contém um seed realista (Direito Administrativo, Constitucional, Penal, Português; resumo "Atos administrativos" com 4 trechos, tabela de atributos, Súmula 473, anexos; "Remédios constitucionais" com 3 perguntas; "Conceito analítico de crime"). Reaproveitar como fixture de desenvolvimento/testes — ver função `seed()` em `prototype/Sistema de Resumos.dc.html`.

## 10. Simplificações do protótipo (não replicar)

1. **Edição de texto** via textarea com marcação `[[lacuna]]` e `**negrito**`. Produção: editor rico in-place (ex.: TipTap/ProseMirror/Lexical) com marks `gap` e `bold`, preservando ids de lacuna.
2. **Ocultar** limitado a seleção dentro de um único segmento. Produção: seleção arbitrária dentro de um bloco (normalizando marks).
3. **FSRS simplificado** (§3.6) e retenção de assuntos estática com ajuste por nota. Produção: FSRS real + retrievability calculada.
4. **Data fixa** (23/10/2026) e intercalação por ordem fixa. Produção: data real e intercalação round-robin.
5. Anexos são simulados (nome fixo, sem upload). Produção: upload para storage, imagens com pré-visualização real.
6. Segmented de formato na sessão (ferramenta de teste).
7. Sem persistência (estado em memória).
