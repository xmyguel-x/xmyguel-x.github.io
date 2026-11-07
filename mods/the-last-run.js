/*
 * THE LAST RUN - Boss + gameplay prototype
 * Uses the original Chrome Dino sprite sheet.
 * Imported through DinoMod > Criar mod > Importar .js / .json.
 */
(() => {
  const state = {
    elapsed: 0,
    health: 3,
    attacks: [],
    nextFireAt: 0,
    nextMeteorAt: 0,
    invulnerableUntil: 0,
    slowUntil: 0,
    restoreSpeed: null,
    gameOver: false,
    attackId: 0
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const hit = (a, b) =>
    a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y;

  function getDinoSheet() {
    const highDensity = document.getElementById("offline-resources-2x");
    const normal = document.getElementById("offline-resources-1x");
    if (highDensity && highDensity.complete && highDensity.naturalWidth) {
      return { image: highDensity, x: 1854, y: 2, width: 88, height: 94 };
    }
    if (normal && normal.complete && normal.naturalWidth) {
      return { image: normal, x: 936, y: 2, width: 44, height: 47 };
    }
    return null;
  }

  function drawBoss(ctx, width, height, time) {
    const sprite = getDinoSheet();
    if (!sprite) return;

    const scale = clamp(width / 390, 1.65, 2.15);
    const bossWidth = 44 * scale;
    const bossHeight = 47 * scale;
    const x = width - bossWidth - 24;
    const y = height - bossHeight - 10;
    const frame = Math.floor(time / 150) % 2;
    const sourceX = sprite.x + frame * sprite.width;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(x + bossWidth, y);
    ctx.scale(-1, 1);
    ctx.drawImage(
      sprite.image,
      sourceX, sprite.y, sprite.width, sprite.height,
      0, 0, bossWidth, bossHeight
    );
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "#b71c1c";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "right";
    ctx.fillText("THE LAST RUN", width - 10, 17);
    ctx.restore();
  }

  function spawnFire(width, height) {
    state.attacks.push({
      id: ++state.attackId,
      type: "fire",
      x: width - 145,
      y: height - 30,
      width: 25,
      height: 13,
      vx: -0.34,
      age: 0
    });
  }

  function spawnMeteor(width, height) {
    state.attacks.push({
      id: ++state.attackId,
      type: "meteor",
      x: width + 24,
      y: height - 66,
      width: 17,
      height: 17,
      vx: -0.43,
      age: 0
    });
  }

  function drawAttack(ctx, attack, time) {
    ctx.save();
    if (attack.type === "fire") {
      const flicker = Math.floor(time / 75) % 2;
      ctx.fillStyle = "#c62828";
      ctx.fillRect(attack.x, attack.y + 5, 22, 8);
      ctx.fillStyle = "#ff6d00";
      ctx.fillRect(attack.x + 4, attack.y + flicker * 2, 15, 9);
      ctx.fillStyle = "#fff176";
      ctx.fillRect(attack.x + 8, attack.y + 4, 7, 5);
    } else {
      ctx.fillStyle = "#6d3023";
      ctx.fillRect(attack.x + 3, attack.y + 2, 13, 13);
      ctx.fillStyle = "#ff7043";
      ctx.fillRect(attack.x + 6, attack.y + 4, 7, 7);
      ctx.fillStyle = "rgba(255,112,67,.45)";
      ctx.fillRect(attack.x + 16, attack.y + 5, 19, 6);
    }
    ctx.restore();
  }

  function drawHud(ctx, width) {
    ctx.save();
    ctx.textAlign = "left";
    ctx.font = "bold 10px monospace";
    ctx.fillStyle = "#333";
    ctx.fillText("BOSS HP", 10, 16);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < state.health ? "#d32f2f" : "#bdbdbd";
      ctx.fillRect(67 + i * 14, 8, 10, 9);
    }
    ctx.restore();
  }

  function reset() {
    state.elapsed = 0;
    state.health = 3;
    state.attacks = [];
    state.nextFireAt = 0;
    state.nextMeteorAt = 0;
    state.invulnerableUntil = 0;
    state.slowUntil = 0;
    state.restoreSpeed = null;
    state.gameOver = false;
    state.attackId = 0;
  }

  dino.on("frame", ({ runner, ctx, game, deltaTime }) => {
    if (!ctx || !game || !game.playing || state.gameOver) return;

    const dt = clamp(Number(deltaTime) || 16, 0, 50);
    state.elapsed += dt;
    const score = Number(game.score) || 0;
    const width = game.width || 600;
    const height = game.height || 150;

    if (score < 180) return;

    if (score >= 350 && state.nextFireAt === 0) {
      state.nextFireAt = state.elapsed + 900;
    }
    if (score >= 650 && state.nextMeteorAt === 0) {
      state.nextMeteorAt = state.elapsed + 1700;
    }

    if (score >= 350 && state.elapsed >= state.nextFireAt) {
      spawnFire(width, height);
      state.nextFireAt = state.elapsed + 3900;
    }
    if (score >= 650 && state.elapsed >= state.nextMeteorAt) {
      spawnMeteor(width, height);
      state.nextMeteorAt = state.elapsed + 5200;
    }

    const player = {
      x: game.trex.x,
      y: game.trex.y,
      width: game.trex.ducking ? 59 : 44,
      height: game.trex.ducking ? 25 : 47
    };

    for (const attack of state.attacks) {
      attack.age += dt;
      attack.x += attack.vx * dt;

      if (state.elapsed >= state.invulnerableUntil && hit(player, attack)) {
        state.health = Math.max(0, state.health - 1);
        state.invulnerableUntil = state.elapsed + 1100;
        if (typeof game.setSpeed === "function") {
          state.restoreSpeed = game.speed;
          game.setSpeed(Math.max(3, game.speed * 0.62));
          state.slowUntil = state.elapsed + 850;
        }
        attack.x = -1000;
        if (state.health <= 0) {
          state.gameOver = true;
          if (runner && typeof runner.gameOver === "function") runner.gameOver();
          return;
        }
      }
    }

    state.attacks = state.attacks.filter(a => a.x > -60 && a.age < 5000);

    if (state.slowUntil && state.elapsed >= state.slowUntil) {
      if (state.restoreSpeed !== null && typeof game.setSpeed === "function") {
        game.setSpeed(state.restoreSpeed);
      }
      state.slowUntil = 0;
      state.restoreSpeed = null;
    }

    ctx.save();
    if (state.elapsed >= state.invulnerableUntil - 850 &&
        state.elapsed < state.invulnerableUntil &&
        Math.floor(state.elapsed / 90) % 2 === 0) {
      ctx.globalAlpha = 0.42;
    }

    drawBoss(ctx, width, height, state.elapsed);
    for (const attack of state.attacks) drawAttack(ctx, attack, state.elapsed);
    drawHud(ctx, width);
    ctx.restore();
  });

  dino.on("restart", reset);
  dino.on("gameOver", () => { state.gameOver = true; });
  dino.log("THE LAST RUN: original Dino sprite boss and damage-based attacks loaded.");
})();
