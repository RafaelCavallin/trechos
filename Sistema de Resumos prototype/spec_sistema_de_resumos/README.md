# Spec: Sistema de Resumos — Trecho como unidade de revisão

Pacote de especificação para desenvolvimento com IA no fluxo **SDD (Spec Driven Development)**.
Leia nesta ordem e implemente seguindo as tarefas:

1. `requirements.md` — **o quê**: glossário, histórias de usuário e critérios de aceite (formato EARS), fora de escopo.
2. `design.md` — **como**: arquitetura, modelo de dados, algoritmos, telas, design tokens, estados.
3. `tasks.md` — **plano**: tarefas incrementais e verificáveis, cada uma rastreada aos requisitos.

## Sobre o protótipo de referência

`prototype/` contém o protótipo HTML que originou esta spec (`Sistema de Resumos.dc.html` + `Bloco.dc.html` + stylesheet do design system Organic). Ele é **referência de comportamento e visual**, não código de produção: recrie no stack escolhido seguindo `design.md`.

- Fidelidade: **alta (hi-fi)** para visual (cores, tipografia, raios, componentes) e para fluxos.
- Simplificações do protótipo que **não** devem ser copiadas estão listadas em `design.md §10`.
- Para navegar no protótipo, abra **`prototype-standalone.html`** direto no navegador. É um arquivo único que funciona offline, com o runtime e o componente `Bloco` embutidos; só as fontes do Google Fonts precisam de internet. Agentes podem abri-lo com Playwright/Puppeteer para inspecionar o DOM e testar os fluxos.
- `prototype/` traz o código-fonte legível (`Sistema de Resumos.dc.html`, `Bloco.dc.html`, `support.js`, design system). Também roda servindo a pasta num servidor estático (`npx serve prototype`); não funciona via `file://` por causa do carregamento do `Bloco`.
- O protótipo abre em **Estatísticas** (tweak `initialScreen`). Navegue pela barra lateral.

## Capturas de tela

`screenshots/` (viewport ~920×540, parte superior de cada tela; dados do seed):
`01-inicio` · `02-materias` · `03-editor` · `04-editor-trechos-avisos` · `05-revisao-fila` · `06-sessao-lacunas-ocultas` · `07-sessao-revelado-marcando` · `08-sessao-nota-calculada` · `09-estatisticas` · `10-configuracoes`.

## Convenções para o agente de IA

- Cada tarefa em `tasks.md` cita requisitos (`R3.2`). Ao concluir, verifique os critérios de aceite citados.
- Não implemente nada listado em "Fora de escopo".
- Decisões marcadas como **[A DEFINIR]** usam o valor padrão indicado até haver decisão de produto.
- Idioma da interface: **português (pt-BR)**. Textos exatos estão em `design.md §6`.
