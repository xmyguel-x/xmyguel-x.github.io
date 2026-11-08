# Changelog

Todas as mudanças relevantes do DinoMod.

## 1.1.0 · 2026-11-08

Esta é a versão que está no ar em <https://xmyguel-x.github.io/>.

### Novo
- **Mod "Final: T-Rex Gigante":** chefe que cospe fogo aos 250 pontos, meteoro, e a cartela **CONTINUE IN CHROME** (código em `mods/final-trex-gigante.js`).
- **Favicon animado** que reproduz o estado do dino (parado, piscando, correndo, pulando, abaixado, game over e modo noite). Ícone estático `favicon.svg` como fallback.
- **README redesenhado** com screenshots, exemplos de mods, referência da API e estrutura do projeto.
- **14 screenshots** do jogo em `docs/screenshots/`, mostrando a tela inicial, a lista de mods, o criador de mod, a API, o Modo Batalha e as seis etapas do final com chefe.

### Corrigido
- **O site não funcionava:** o mesmo módulo era carregado com URLs diferentes (`?v=...`), criando duas cópias do React (`Invalid hook call`). Todas as URLs agora são únicas.
- **Links diretos e F5 em `/batalha` davam 404** no GitHub Pages: adicionado `404.html` com fallback de rotas.
- **Telas de alta densidade (celulares e retina):** o `sprite-2x.png` do repositório tinha outro tamanho e layout, e o dino aparecia achatado e os sprites cortados errado. Novo `sprite-2x-v2` e coordenadas `hdpi` do motor ajustadas.
- **Sons ausentes** (`button-press`, `hit`, `score-reached`): adicionados sons 8-bit sintetizados.
- Canvas duplicado e lixo de extensão de navegador gravados no `index.html`; favicon quebrado (`/favicon.ico` 404).

### Repositório
- **README completo** com índice, badges, screenshots de todas as telas, tabela dos 16 mods, referência da API, exemplos prontos, FAQ e estrutura do projeto.
- **`CHANGELOG.md`** criado para registrar as versões a partir daqui.
- **`CONTRIBUTING.md`** com o passo a passo para enviar um mod ou uma correção.
- **`LICENSE`** (BSD 3-Clause) com os créditos do Chrome Dino (Chromium) e do sprite do Sonic (SEGA).
- **Verificador do site** (`scripts/verify_site.py`): confere se todo arquivo referenciado existe, se os screenshots do README estão presentes, se a folha 2x tem o tamanho certo, se as coordenadas `hdpi` do motor cabem nela e se nenhum SVG de asset está corrompido. Roda localmente antes de cada PR.
- **Workflow de CI "Verifica o site"** pronto em [`docs/verify-site.yml`](docs/verify-site.yml) — pega regressões como caminho de sprite quebrado ou módulo ES duplicado antes de chegarem ao GitHub Pages. Para ativar, copie o arquivo para `.github/workflows/verify-site.yml`.
- **Templates de issue** para bug, feature e mod.
- **`.gitignore`** para arquivos de editor e artefatos de build.
- **Limpeza:** removidas as duas cópias do site antigo que estavam dentro do repositório (`xmyguel-x.github.io-corrigido/` e `xmyguel-x.github.io-corrigido (1)/`), o ZIP `xmyguel-x.github.io-corrigido (1).zip` e o `favicon-sync.js` (dependia de um evento que o motor nunca emitiu, então o favicon animado nunca funcionou).
- **CSS morto removido:** o bloco `#lovable-badge` (badge da Lovable, que não existe mais na página) tirado do `index.html` — 4 KB a menos no arquivo.
- **`modulepreload` duplicado** removido do `index.html`.
- **Imagem de compartilhamento** (`og:image` / `twitter:image`) passou a apontar para o card gerado pelo próprio GitHub (`opengraph.githubassets.com`), em vez de um CDN externo da Lovable que pode sair do ar.

### Assets binários em formato SVG
A folha de sprites 2x, o ícone do site e os 14 screenshots são **PNG binários**, e o fluxo
automatizado de publicação do repositório só consegue gravar texto UTF-8 — um PNG não
sobrevive a essa viagem.

Para resolver isso sem perder nenhum pixel, esses assets foram guardados como **SVG que
carrega o PNG original embutido em base64**:

```svg
<image href="data:image/png;base64,iVBORw0KGgo…" width="2466" height="200"/>
```

O navegador desenha exatamente os mesmos pixels, inclusive no recorte por retângulo de
fonte que o motor usa na folha de sprites (verificado pixel a pixel). Consequências:

- `dino/sprite-2x-v2.svg` substitui `dino/sprite-2x-v2.png` — o motor foi ajustado para
  carregar o `.svg`; o PNG original sai dele com
  `python3 scripts/svg_wrapper.py --extract dino/sprite-2x-v2.svg sprite-2x-v2.png`.
- `favicon.svg` e `apple-touch-icon.svg` substituem os PNGs equivalentes.
- Os screenshots em `docs/screenshots/` passaram a `.svg`.
- `scripts/svg_wrapper.py` faz a conversão nos dois sentidos.

> O único item da versão original que não pôde ser reproduzido é o arquivo binário
> `favicon.ico`. O navegador ainda pede `/favicon.ico` e recebe 404, como já acontecia
> antes desta versão; o ícone do site é servido por `<link rel="icon">` e pelo `favicon.js`,
> então o favicon funciona normalmente.

### Nota sobre o chefe final
O mod "Final: T-Rex Gigante" aparece aos **250 pontos**, como na versão 1.1.0 original.
Um commit posterior havia alterado esse valor para 10.000 pontos; ele foi revertido para
alinhar o site publicado com a versão do ZIP. O valor é ajustável em `BOSS_SCORE`, no
topo de [`mods/final-trex-gigante.js`](mods/final-trex-gigante.js).

## 1.0.0

- Versão anterior: site recuperado a partir da exportação do Lovable e publicado no GitHub Pages.
