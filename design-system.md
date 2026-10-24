# Design System — Sistema de Resumos

Baseado no design system **Organic**: tom quente, arredondado e um pouco lúdico. Fundo creme/areia, destaque **terracota** e segundo destaque **sálvia**, títulos em Caprasimo sobre corpo em Figtree, raios generosos que viram pílulas.

Fonte da verdade: `prototype/_ds/organic-98e66638-3150-4551-89b3-3ed37b3bee0b/styles.css`. Os valores abaixo são exatamente os do protótipo.

---

## 1. Princípios

- **Layout:** alinhado à esquerda e assimétrico, com espaço em branco à direita. Títulos encostados à esquerda.
- **Formas:** nada de cantos vivos. Cards e diálogos com raio grande; botões, tags, inputs e segmented em **pílula (999px)**. Círculos como marcadores (números, pontos, nota).
- **Separação:** prefira espaço em branco e fundos tonais a linhas divisórias. **Sem borda lateral colorida.**
- **Duas vozes de cor:** terracota (ação, alerta, erro, lacuna) e sálvia (trecho, progresso, acerto, sucesso).
- **Contraste:** o terracota base só serve para ícones, texto grande e elementos de interface. Para texto do tamanho de parágrafo use `accent-700` ou mais escuro.

---

## 2. Cores

### 2.1 Papéis principais

| Token | Hex | Uso |
| --- | --- | --- |
| `--color-bg` | `#f5ead8` | Fundo da aplicação; texto sobre botões primários; linhas-pílula dentro de cards |
| `--color-surface` | `#ebddc5` | Sidebar, cards, toolbar, diálogo, inputs |
| `--color-text` | `#201e1d` | Texto principal |
| `--color-accent` (terracota) | `#c67139` | Botão primário, anel de foco, segmented ativo, aspas da citação, logo |
| `--color-accent-2` (sálvia) | `#7a8a5e` | Segunda voz da marca |
| `--color-divider` | `#201e1d` a 16% | Bordas de botão secundário, input, segmented, cabeçalho de tabela |

### 2.2 Escalas tonais (100–900)

Geradas em OKLCH com a mesma escala de luminosidade: o mesmo degrau tem o mesmo peso visual em todas as escalas.

| Degrau | Neutral | Accent (terracota) | Accent-2 (sálvia) |
| --- | --- | --- | --- |
| 100 | `#f9f4ed` | `#fff2eb` | `#f0fae1` |
| 200 | `#eee7db` | `#ffe1d0` | `#e1eecc` |
| 300 | `#dcd3c4` | `#ffc6a5` | `#ccdbb2` |
| 400 | `#c0b6a5` | `#f6a06b` | `#aebf92` |
| 500 | `#a19786` | `#d67f48` | `#8fa073` |
| 600 | `#82796a` | `#b2622d` | `#728157` |
| 700 | `#645c50` | `#8c491a` | `#56633f` |
| 800 | `#474238` | `#643312` | `#3d472b` |
| 900 | `#2e2b25` | `#402310` | `#272e1b` |

Regra: degraus **100–300** para preenchimentos, hover e bordas suaves; **500** é a base; **700–900** para texto sobre fundo tonal e estados pressionados.

### 2.3 Cores semânticas do app

| Significado | Fundo | Texto | Borda / barra |
| --- | --- | --- | --- |
| Item de navegação ativo | accent-200 `#ffe1d0` | accent-900 `#402310` | — |
| Cabeçalho de trecho | accent-2-100 `#f0fae1` | accent-2-800 `#3d472b` | tag "Trecho N": accent-2-500 `#8fa073` + texto `#f5ead8` |
| Aviso (limite / sem itens) | accent-100 `#fff2eb` | accent-800 `#643312` | — |
| Bloco selecionado (editor) | neutral-100 `#f9f4ed` | — | anel 2px accent-300 `#ffc6a5` |
| Pergunta da margem | accent-2-100 `#f0fae1` | pergunta accent-2-800 `#3d472b`; resposta neutral-800 `#474238` | — |
| Barra de progresso da sessão | trilho neutral-200 `#eee7db` | — | accent-2-500 `#8fa073` |
| Toast | neutral-900 `#2e2b25` | neutral-100 `#f9f4ed` | — |
| Fundo do diálogo (backdrop) | neutral-900 `#2e2b25` a 50% | — | — |

**Retenção / saúde**

| Faixa | Texto (%) | Barra | Tag de assunto |
| --- | --- | --- | --- |
| Sem dados | neutral-600 `#82796a` | neutral-400 `#c0b6a5` | neutral-200 / neutral-700 |
| < 70% | accent-700 `#8c491a` | accent `#c67139` | accent-100 `#fff2eb` / accent-800 `#643312` |
| 70–84% | accent-2-700 `#56633f` | accent-2-400 `#aebf92` | accent-2-100 `#f0fae1` / accent-2-800 `#3d472b` |
| ≥ 85% | accent-2-800 `#3d472b` | accent-2-600 `#728157` | accent-2-100 / accent-2-800 |

**Notas (resultado da revisão)**

| Nota | FSRS | Fundo | Texto |
| --- | --- | --- | --- |
| Fácil | Easy | accent-2-200 `#e1eecc` | accent-2-800 `#3d472b` |
| Lembrei | Good | accent-2-100 `#f0fae1` | accent-2-800 `#3d472b` |
| Lembrei com esforço | Hard | accent-100 `#fff2eb` | accent-800 `#643312` |
| Não lembrei | Again | accent-200 `#ffe1d0` | accent-900 `#402310` |

**Blocos especiais** (borda 1.5px sólida)

| Bloco | Fundo | Rótulo | Borda |
| --- | --- | --- | --- |
| Pegadinha da banca | accent-100 `#fff2eb` | accent-800 `#643312` | accent-300 `#ffc6a5` |
| Exceção | accent-2-100 `#f0fae1` | accent-2-800 `#3d472b` | accent-2-300 `#ccdbb2` |
| Exemplo | neutral-100 `#f9f4ed` | neutral-800 `#474238` | neutral-300 `#dcd3c4` |
| Analogia | accent-2-100 `#f0fae1` | accent-2-800 `#3d472b` | accent-2-200 `#e1eecc` |

**Lacunas** (pílula inline, borda 1.5px **tracejada**)

| Estado | Fundo | Texto | Borda |
| --- | --- | --- | --- |
| Editor | accent-200 `#ffe1d0` | accent-800 `#643312` | accent-400 `#f6a06b` |
| Oculta, manual (mostra o nº) | neutral-300 `#dcd3c4` | neutral-800 `#474238` | neutral-400 `#c0b6a5` |
| Oculta, dinâmica | accent-2-200 `#e1eecc` | accent-2-800 `#3d472b` | accent-2-400 `#aebf92` |
| Revelada, sem marca | neutral-100 `#f9f4ed` | text `#201e1d` | accent-400 `#f6a06b` (dinâmica: accent-2-500 `#8fa073`) |
| Acertou | accent-2-200 `#e1eecc` | accent-2-900 `#272e1b` | accent-2-500 `#8fa073` |
| Errou | accent-300 `#ffc6a5` | accent-900 `#402310` | accent-600 `#b2622d` |
| Calor 0 (sem erros) | neutral-200 `#eee7db` | text | neutral-300 `#dcd3c4` |
| Calor 1 (até 25%) | accent-100 `#fff2eb` | text | accent-500 `#d67f48` |
| Calor 2 (25–50%) | accent-300 `#ffc6a5` | text | accent-500 `#d67f48` |
| Calor 3 (> 50%) | accent-400 `#f6a06b` | accent-900 `#402310` | accent-500 `#d67f48` |

**Painel de itens verificáveis (revisão)**

| Estado | Fundo da linha | Botão ✓ | Botão ✗ |
| --- | --- | --- | --- |
| Sem marca | bg `#f5ead8` | transparente, ícone accent-2-700 `#56633f` | transparente, ícone accent-700 `#8c491a` |
| Acertou | accent-2-100 `#f0fae1` | accent-2-500 `#8fa073`, ícone `#f5ead8` | — |
| Errou | accent-100 `#fff2eb` | — | accent-500 `#d67f48`, ícone `#f5ead8` |

---

## 3. Tipografia

| Papel | Família | Pesos | Carregamento |
| --- | --- | --- | --- |
| Títulos (`--font-heading`) | **Caprasimo** | 400 | Google Fonts |
| Corpo (`--font-body`) | **Figtree** | 400, 600, 700 | Google Fonts |

```
https://fonts.googleapis.com/css2?family=Caprasimo:wght@400&family=Figtree:wght@400;600;700&display=swap
```

Títulos usam `line-height: 1.12` e `letter-spacing: -0.015em`. Corpo base: **15px / 1.55**, peso 400.
Os **botões** (`.btn`) usam Caprasimo 14px.

### 3.1 Escala do design system

| Elemento | Fonte | Tamanho |
| --- | --- | --- |
| h1 | Caprasimo | 42px |
| h2 | Caprasimo | 32px |
| h3 | Caprasimo | 25px |
| h4 | Caprasimo | 20px |
| h5 | Caprasimo | 16px |
| h6 | Caprasimo, maiúsculas, +0.08em | 13px |
| Corpo | Figtree 400 | 15px / 1.55 |

### 3.2 Tamanhos usados no app

| Uso | Fonte | Tamanho / peso |
| --- | --- | --- |
| H1 do Início | Caprasimo | 44px |
| H1 das telas (Matérias, Editor, Estatísticas, Configurações) | Caprasimo | 40px |
| H1 da Revisão (fila, concluída) | Caprasimo | 42px |
| Título do trecho na sessão | Caprasimo | 34px |
| Nota do resultado | Caprasimo | 28px |
| % no círculo do resultado (96px) | Caprasimo | 28px |
| Número de destaque (cards da sessão concluída) | Caprasimo | 32px |
| H2 dentro do resumo | Caprasimo | 26px / 1.25 |
| H3 dentro do resumo | Caprasimo | 20px / 1.3, neutral-800 |
| % de saúde (Início) | Caprasimo | 22px |
| Nome da matéria (árvore) | Caprasimo | 21px |
| Logo "Trechos" | Caprasimo | 21px |
| Matéria (Estatísticas) | Caprasimo | 18px |
| Aspas da citação | Caprasimo | 46px, accent |
| Texto do resumo (blocos) | Figtree 400 | 16px / 1.8 |
| Pergunta na sessão (modo "Só perguntas") | Figtree 600 | 17px / 1.4 |
| Subtítulo de página | Figtree 400 | 16px, neutral-700 |
| Itens da sidebar | Figtree 600 | 15px |
| Tabela dentro do resumo | Figtree | 15px / 1.6 |
| Tabela padrão (`.table`) | Figtree | 14px; cabeçalho 11px maiúsculas +0.08em |
| Toast, avisos, meta do trecho | Figtree | 13–14px |
| Dicas e notas de rodapé | Figtree | 13px, neutral-700 |
| Metadados (contagens, datas) | Figtree | 12px, neutral-700 |
| Kicker de página | Figtree 700, maiúsculas, +0.1em | 12px, accent-700 |
| Kicker de card (`.card-kicker`) | Figtree 700, maiúsculas, +0.1em | 10px, accent-700 |
| Rótulo de bloco especial | Figtree 700, maiúsculas, +0.1em | 11px |
| Tag (`.tag`) | Figtree, +0.02em | 11px |
| Título de card (`.card-title`) | Caprasimo | 17px |
| Texto de card (`.card-body`) | Figtree | 13px, opacidade 0.8 |
| Título do diálogo | Caprasimo | 20px |
| Texto do diálogo | Figtree | 14px, opacidade 0.85 |
| Input (`.input`) | Figtree | 14px |
| Segmented (`.seg-opt`) | Figtree | 13px |

---

## 4. Espaçamento

Escala com densidade 1.10×:

| Token | Valor |
| --- | --- |
| `--space-1` | 4.4px |
| `--space-2` | 8.8px |
| `--space-3` | 13.2px |
| `--space-4` | 17.6px |
| `--space-6` | 26.4px |
| `--space-8` | 35.2px |

Medidas de layout do app:

| Elemento | Valor |
| --- | --- |
| Largura da sidebar | 232px (padding 28px 16px; raio 0 32px 32px 0) |
| Padding da área principal | 36px 44px 96px |
| Largura máxima: Início | 1100px |
| Largura máxima: Matérias | 980px |
| Largura máxima: Editor | 1260px |
| Largura máxima: Revisão / Estatísticas | 1180px |
| Largura máxima: Configurações | 760px |
| Lista de trechos (editor) | 210px (mín. 180px) |
| Coluna da margem (editor) | 240px (mín. 200px) |
| Painel de itens (revisão) | 280–380px |
| Card do trecho (revisão) | padding 34px 40px |
| Gap entre cards | 22px |

---

## 5. Raios e sombras

| Token | Valor | Uso |
| --- | --- | --- |
| `--radius-sm` | 8px | — |
| `--radius-md` | 16px | base |
| `--radius-lg` | 28px | imagens |
| Card / diálogo | 32.2px (`radius-lg × 1.15`) | `.card`, `.dialog` |
| Pílula | 999px | `.btn`, `.tag`, `.seg`, `.input`, linhas de lista, toolbar, toast, lacunas |
| Blocos e caixas internas | 22–30px | bloco selecionado 24, especiais 24, tabela 22, perguntas 22, resultado 30 |

| Token | Valor |
| --- | --- |
| `--shadow-sm` | `0 1px 2px` `#2e2b25` a 14% |
| `--shadow-md` | `0 3px 10px` `#2e2b25` a 16% (toolbar do editor) |
| `--shadow-lg` | `0 12px 32px` `#2e2b25` a 22% (diálogo, toast) |

---

## 6. Componentes

| Classe | Descrição | Especificação |
| --- | --- | --- |
| `.btn` | Botão base | Caprasimo 14px, padding 8.8px 15.84px, pílula, gap 6px |
| `.btn-primary` | Ação principal | fundo `#c67139`, texto `#f5ead8`; hover `#b2622d`; pressionado `#8c491a` |
| `.btn-secondary` | Ação secundária | borda divider; hover texto a 7%; pressionado 14% |
| `.btn-ghost` | Ação discreta | texto `#c67139`; hover accent a 10%; pressionado 18% |
| `.btn-icon` | Botão-ícone | 36×36px (no app também 28, 30, 32px) |
| `.tag` | Rótulo | 11px, padding 3px 10px, pílula |
| `.tag-accent` | — | `#fff2eb` / `#643312` |
| `.tag-accent-2` | — | `#f0fae1` / `#3d472b` |
| `.tag-neutral` | — | `#f9f4ed` / `#474238` |
| `.tag-outline` | — | borda e texto `#c67139` |
| `.input` | Campo | min. 36px, 14px, fundo surface, borda divider, pílula; foco: borda accent; cursor accent |
| `.seg` / `.seg-opt` | Segmented | opção 13px, padding 7px 12px; ativa: fundo `#c67139` + texto `#f5ead8` |
| `.card` | Superfície | fundo `#ebddc5`, raio 32.2px, gap 8.8px |
| `.table` | Tabela | 14px; cabeçalho 11px maiúsculas, texto a 60%; hover da linha texto a 4% |
| `.dialog` | Modal | largura até 440px, raio 32.2px, fundo surface, sombra lg |
| Estado desabilitado | — | opacidade 0.45 |
| Foco | — | `outline: 2px solid #c67139; outline-offset: 2px` |
| Seleção de texto | — | `#c67139` a 30% |

Componentes específicos do app (detalhes em `design.md §5`): sidebar, linha-pílula de lista, barra de progresso (10px), lacuna, bloco especial, cabeçalho de trecho, pergunta da margem, painel de itens, caixa de resultado, toast.

---

## 7. Ícones

**Lucide** (https://lucide.dev), com **stroke-width 2.75** em todo o app. Tamanhos: 13–18px.

Usados: `house`, `book-open`, `rotate-ccw`, `chart-column`, `sliders-horizontal`, `eye`, `eye-off`, `play`, `check`, `x`, `plus`, `pencil`, `trash-2`, `chevron-right`, `grip-vertical`, `file`, `image`, `paperclip`, `triangle-alert`.

---

## 8. Imagens

Fotografias de conteúdo passam pela classe `.washed`: `filter: saturate(0.6) contrast(0.85) brightness(1.1) opacity(0.94)`, sempre com cantos arredondados (28px). Imagem anexada sem arquivo: área de 170px com listras diagonais neutral-200/neutral-100.

---

## 9. Faça / Não faça

**Faça**
- Arredonde bastante: cards grandes, pílulas nos controles.
- Use a sálvia como segunda voz de verdade (trechos, acertos, progresso).
- Use os degraus da escala (100–900) em vez de cores inventadas.

**Não faça**
- Cantos vivos ou geometria só de linhas finas.
- Dessaturar a paleta para cinzas.
- Usar outra fonte de display além de Caprasimo.
- Bordas laterais coloridas em cards, ou divisores onde basta espaço.
- Texto de parágrafo no terracota base (`#c67139`).
