/*
 * THE LAST RUN
 * Protótipo visual isolado para o sistema de mods do DinoMod.
 * Instale pelo painel "Criar mod" > "Importar .js / .json".
 * Esta versão não altera o motor nem interfere nas colisões.
 */
(() => {
  const state = {
    elapsed: 0,
    lastCtx: null,
    lastWidth: 600,
    lastHeight: 150,
    meteorStarted: false,
    meteorAt: 0,
    gameOver: false
  };

  const pixel = (ctx, x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  function drawBoss(ctx, x, y, scale, time) {
    const p = (a, b, w, h, color = "#252525") =>
      pixel(ctx, x + a * scale, y + b * scale, w * scale, h * scale, color);

    // Corpo e cauda: silhueta de um T-Rex gigante em pixel art.
    p(18, 18, 28, 16);
    p(10, 22, 12, 8);
    p(2, 25, 12, 4);
    p(38, 12, 15, 13);
    p(48, 7, 19, 13);
    p(59, 14, 13, 7);
    p(63, 20, 12, 4);
    p(29, 32, 9, 13);
    p(39, 31, 8, 14);
    p(25, 42, 15, 4);
    p(37, 42, 15, 4);
    p(47, 25, 7, 7, "#171717");
    p(52, 14, 4, 4, "#fff");
    p(53, 15, 2, 2, "#e53935");
    p(64, 23, 3, 2, "#f5f5f5");

    // Pequeno balanço do corpo.
    if (Math.floor(time / 180) % 2) {
      p(29, 31, 9, 14);
      p(39, 32, 8, 13);
    }
  }

  function drawFire(ctx, width, height, time) {
    const pulse = 0.82 + Math.sin(time / 55) * 0.18;
    const startX = width - 170;
    const y = height - 57;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "#e53935";
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX - 115 * pulse, y - 17);
    ctx.lineTo(startX - 83 * pulse, y + 1);
    ctx.lineTo(startX - 125 * pulse, y + 14);
    ctx.lineTo(startX, y + 13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ff9800";
    ctx.beginPath();
    ctx.moveTo(startX, y + 3);
    ctx.lineTo(startX - 82 * pulse, y - 7);
    ctx.lineTo(startX - 55 * pulse, y + 5);
    ctx.lineTo(startX - 88 * pulse, y + 11);
    ctx.lineTo(startX, y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff176";
    ctx.fillRect(startX - 43 * pulse, y + 1, 34 * pulse, 5);
    ctx.restore();
  }

  function drawMeteor(ctx, width, height, time) {
    const travel = Math.min(1, Math.max(0, (time - state.meteorAt) / 2100));
    const x = width + 30 - travel * (width + 110);
    const y = 12 + travel * (height - 42);

    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = "#ff7043";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(x + 34, y - 22);
    ctx.lineTo(x + 4, y + 2);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.fillStyle = "#8d3b25";
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffab40";
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawTitle(ctx, width) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 13px monospace";
    ctx.fillStyle = "#b71c1c";
    ctx.fillText("THE LAST RUN", width / 2, 22);
    ctx.font = "9px monospace";
    ctx.fillStyle = "#444";
    ctx.fillText("THE CHASE HAS BEGUN", width / 2, 34);
    ctx.restore();
  }

  dino.on("frame", ({ ctx, game, deltaTime }) => {
    if (!ctx || !game) return;
    state.lastCtx = ctx;
    state.lastWidth = game.width || 600;
    state.lastHeight = game.height || 150;

    if (!game.playing) return;

    state.elapsed += Math.min(Number(deltaTime) || 16, 50);
    const score = Number(game.score) || 0;
    if (score < 180) return;

    const width = state.lastWidth;
    const height = state.lastHeight;
    ctx.save();

    drawTitle(ctx, width);
    const bossScale = Math.max(1.45, Math.min(2.1, width / 290));
    const bossX = width - 170;
    const bossY = height - 103;
    drawBoss(ctx, bossX, bossY, bossScale, state.elapsed);

    // A baforada aparece em ciclos, com uma pequena pausa entre ataques.
    const fireCycle = (state.elapsed - 3500) % 4200;
    if (score >= 350 && state.elapsed >= 3500 && fireCycle < 1050) {
      drawFire(ctx, width, height, state.elapsed);
      ctx.fillStyle = "#b71c1c";
      ctx.font = "bold 9px monospace";
      ctx.fillText("FIRE!", 12, 26);
    }

    // O meteoro entra mais tarde como evento de cenário.
    if (score >= 650 && !state.meteorStarted) {
      state.meteorStarted = true;
      state.meteorAt = state.elapsed;
    }
    if (state.meteorStarted && state.elapsed - state.meteorAt < 2600) {
      drawMeteor(ctx, width, height, state.elapsed);
    }

    ctx.restore();
  });

  dino.on("restart", () => {
    state.elapsed = 0;
    state.meteorStarted = false;
    state.meteorAt = 0;
    state.gameOver = false;
  });

  dino.on("gameOver", () => {
    state.gameOver = true;
  });

  dino.log("THE LAST RUN prototype loaded. Visual events only; base game is untouched.");
})();
