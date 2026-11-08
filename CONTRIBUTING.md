# Contribuindo com o DinoMod

Obrigado por querer melhorar o DinoMod! Este guia cobre o básico para enviar uma
mudança que seja aceita.

O projeto tem duas frentes independentes:

| Frente | O que é | Onde mexer |
|---|---|---|
| **O jogo / a plataforma** | Motor, API de mods, interface, tela de batalha | `assets/`, `index.html` |
| **Os mods** | Peças de JavaScript que mudam o jogo | `mods/`, ou a aba *Criar mod* |

Dá para contribuir com as duas. As duas seguem as mesmas regras de repo.

---

## Antes de começar

- **Nada de dependências.** O site é HTML + CSS + JavaScript puro, sem build,
  sem `npm install`, sem framework novo. Qualquer PR que introduz dependência
  precisa justificar o motivo.
- **O jogo roda no navegador, sem servidor.** Qualquer coisa que só funcione
  com backend não entra.
- **O site é publicado direto do `main`.** Uma vez que o PR é mergeado, o
  GitHub Pages publica em alguns minutos. Não precisa mexer em configuração.

## Como rodar localmente

```bash
git clone https://github.com/xmyguel-x/xmyguel-x.github.io.git
cd xmyguel-x.github.io
python3 -m http.server 8000
```

Abra <http://localhost:8000>. Serve por HTTP porque os módulos ES são
bloqueados em `file://`.

## Como escrever um mod

Um mod é um arquivo `.js` que recebe o objeto `dino`. O menor mod possível:

```js
dino.on("jump", ({ game }) => {
  game.addScore(5);
});
```

Regras que valem para todos os mods:

1. **Comece pela API, não pelo motor.** `dino.on`, `dino.setConfig`,
   `dino.setTrex`, `dino.filterSprites`, `dino.setSpriteSheet`,
   `dino.storage` e `dino.log` cobrem quase tudo. Se você precisa abrir
   arquivo do motor, provavelmente a API está incompleta — nesse caso,
   **abra uma issue antes** de escrever o mod.
2. **Um mod, um arquivo.** Não dependa de outro mod.
3. **Não quebre o jogo.** Se o seu mod lançar um erro, o DinoMod desativa só o
   trecho que falhou. Mas ainda assim, vale pôr `try/catch` no que é opcional.
4. **Comente o código.** O usuário vai ler o seu mod na aba *Criar mod*.
5. **Deixe o jogador sair.** Respeite o `gameOver` e o `restart`, a menos que
   o mod seja explicitamente sobre isso (como o *Modo Imortal*).

A referência completa da API está no [README](README.md#api-de-mods).

## Enviando a mudança

1. **Branch a partir de `main`:**

   ```bash
   git checkout -b feat/meu-mod
   ```

2. **Faça a mudança e teste no navegador.** Confira se o jogo continua
   funcionando com o mod ligado *e* desligado.

3. **Rode o verificador:**

   ```bash
   python3 scripts/verify_site.py
   ```

   Ele confere se todo arquivo referenciado existe, se os screenshots do
   README estão no lugar e se as coordenadas do sprite sheet batem com o
   tamanho real da imagem. O CI roda o mesmo script — se ele falhar aqui,
   o PR fica vermelho.

4. **Abra o Pull Request** para `main` e descreva:
   - o que a mudança faz;
   - como testar em 10 segundos;
   - uma captura de tela, se mexer na cara do jogo.

## Commits

Mensagens curtas no imperativo, descrevendo a mudança:

```
Adiciona mod de confete a cada 100 pontos
Corrige sprite 2x em telas retina
```

## Dicas de estilo

- JavaScript sem transpiler: `const`/`let`, `async`/`await`, template strings.
- Comentários em português, é o idioma do projeto.
- Nada de `console.log` espalhado pelo código do jogo — use `dino.log()` dentro
  de mods, que identifica o mod no console.

## Reportando bugs

Use os templates da aba **Issues**. Um bug bom tem:

- o que você fez;
- o que esperava;
- o que aconteceu;
- navegador e versão;
- o trecho de código do mod, se houver.

Se o bug envolve um sprite ou uma tela específica, uma imagem ajuda muito.

## Dúvidas

Abra uma issue com a tag `pergunta`. Nenhuma pergunta é boba — se a
documentação não responde, a documentação precisa melhorar.

---

Este projeto é de fã e não tem vínculo com o Google ou com a SEGA.
O jogo base vem do [Chrome Dino](https://github.com/chromium/chromium/tree/main/components/game_runner)
(projeto Chromium, BSD 3-Clause).
