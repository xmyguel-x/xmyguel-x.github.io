/* Favicon animado do DinoMod: o ícone da aba reproduz o estado do dino do jogo.
 *  - parado / antes de começar: de pé, piscando de vez em quando
 *  - jogando: correndo (alterna as duas passadas do sprite)
 *  - pulando: pernas juntas · abaixado: sprite de agachar
 *  - game over: olho de X
 *  - modo noite do jogo: cores invertidas
 * Lê window.__DinoModRunner (o motor do jogo) e desenha direto do sprite original. */
(function () {
  "use strict";
  var SRC = "./dino/sprite-1x.png";
  var F = { stand: 848, blink: 892, run1: 936, run2: 980, dead: 1068, duck: 1112 };
  var FW = 44, FH = 47, DW = 59, SY = 2, SIZE = 64;
  var sheet = new Image();
  var ready = false;
  sheet.onload = function () { ready = true; };
  sheet.src = SRC;

  var cv = document.createElement("canvas");
  cv.width = cv.height = SIZE;
  var ctx = cv.getContext("2d");
  var lastKey = "";
  var blinkUntil = 0, nextBlink = performance.now() + 1800;

  function state() {
    var r = window.__DinoModRunner;
    var night = !!(r && r.inverted);
    if (r && r.crashed) return { name: "dead", sx: F.dead, w: FW, night: night };
    if (r && r.playing) {
      var t = r.tRex || {};
      if (t.ducking) return { name: "duck", sx: F.duck, w: DW, night: night };
      if (t.jumping) return { name: "jump", sx: F.stand, w: FW, night: night };
      var step = Math.floor(performance.now() / 110) % 2;
      return { name: "run" + step, sx: step ? F.run2 : F.run1, w: FW, night: night };
    }
    // parado: pisca por ~140 ms a cada 1,5-4 s
    var now = performance.now();
    if (now >= nextBlink) { blinkUntil = now + 140; nextBlink = now + 1500 + Math.random() * 2500; }
    var blinking = now < blinkUntil;
    return { name: blinking ? "blink" : "stand", sx: blinking ? F.blink : F.stand, w: FW, night: night };
  }

  function links() {
    // O roteador injeta uma tag <link rel="icon"> própria depois do HTML
    // estático, e o navegador usa a última que conseguiu carregar. Por isso
    // o desenho animado é aplicado em todas elas.
    var list = Array.prototype.slice.call(document.querySelectorAll('link[rel~="icon"]'));
    if (!list.length) {
      var created = document.createElement("link");
      created.rel = "icon";
      document.head.appendChild(created);
      list = [created];
    }
    list.forEach(function (l, i) {
      l.type = "image/png";
      if (i === 0) l.id = "dino-favicon";
    });
    return list;
  }

  function draw(s) {
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = s.night ? "#202124" : "#f7f7f7";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(1, 1, SIZE - 2, SIZE - 2, 12); else ctx.rect(1, 1, SIZE - 2, SIZE - 2);
    ctx.fill();
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (s.night) ctx.filter = "invert(1)";
    ctx.drawImage(sheet, s.sx, SY, s.w, FH, Math.round((SIZE - s.w) / 2), Math.round((SIZE - FH) / 2), s.w, FH);
    ctx.restore();
  }

  function tick() {
    if (!ready) return;
    var s = state();
    var key = s.name + (s.night ? "n" : "d");
    var list = links();
    var animated = list.every(function (l) {
      var href = l.getAttribute("href");
      return href && href.indexOf("data:") === 0;
    });
    if (key === lastKey && animated) return;
    lastKey = key;
    try {
      draw(s);
      var png = cv.toDataURL("image/png");
      list.forEach(function (l) { l.href = png; });
    } catch (e) { /* canvas bloqueado: mantém o ícone estático */ }
  }

  window.__dinoFavicon = { state: state, tick: tick };   // útil para testes
  setInterval(tick, 100);
})();
