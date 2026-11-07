# Chrome Dino no PowerPoint

Este projeto monta um pacote para PowerPoint desktop no Windows, em proporção 16:9, usando recortes do **sprite sheet original do Chrome Dino** que já existe neste repositório em `dino/sprite-1x.png`.

## Gerar o pacote

1. Abra a aba **Actions** deste repositório.
2. Execute o workflow **Build Chrome Dino PowerPoint package** em **Run workflow**.
3. Quando terminar, baixe o artifact `Chrome-Dino-PowerPoint`.

O ZIP gerado contém:
- `Chrome_Dino_PowerPoint_Base.pptx`: slide widescreen de jogo.
- `ChromeDinoGame.bas`: módulo VBA com controles e lógica de jogo.
- `assets/`: recortes de sprites originais e a folha original.
- `LEIA-ME.md`: instruções.

## Ativar a macro

1. Extraia o ZIP inteiro para uma pasta.
2. Abra o PPTX no PowerPoint desktop do Windows.
3. Pressione `Alt+F11`, depois **Arquivo > Importar arquivo...** e selecione `ChromeDinoGame.bas`.
4. Volte ao PowerPoint e salve como **Apresentação Habilitada para Macro (.pptm)**.
5. Pressione `Alt+F8`, selecione `StartChromeDino` e execute.

Controles: **Espaço / ↑** para pular, **↓** para agachar e **R** para reiniciar.

> Compatibilidade: macros VBA não executam no PowerPoint para Web nem no Google Slides. O PowerPoint pode bloquear macros por padrão. Só habilite macros de arquivos que você confia.

## Limitação desta versão

É uma implementação experimental de runner em VBA, não o binário original do jogo Chromium. Ela usa os sprites do Dino originais; obstáculos e lógica de jogo são construídos no PowerPoint. A macro requer Windows por usar a API de teclado `GetAsyncKeyState`.
