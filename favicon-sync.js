/* DinoMod Dynamic Favicon
   Mirrors the exact sprite frame currently drawn by the game engine. */
(() => {
  "use strict";

  const SIZE = 32;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  let icon = document.querySelector('link[rel~="icon"]');
  if (!icon) {
    icon = document.createElement("link");
    icon.rel = "icon";
    document.head.appendChild(icon);
  }
  icon.type = "image/png";
  icon.sizes = "32x32";

  let lastFrame = "";

  function updateFavicon(event) {
    const frame = event.detail;
    if (!frame || !frame.image || !frame.image.complete) return;

    const { image, sx, sy, sw, sh, status, frame: frameIndex } = frame;
    if (![sx, sy, sw, sh].every(Number.isFinite) || sw <= 0 || sh <= 0) return;

    const signature = [sx, sy, sw, sh, status, frameIndex, image.currentSrc || image.src].join(":");
    if (signature === lastFrame) return;
    lastFrame = signature;

    ctx.clearRect(0, 0, SIZE, SIZE);
    const scale = Math.min((SIZE - 2) / sw, (SIZE - 2) / sh);
    const width = Math.max(1, Math.round(sw * scale));
    const height = Math.max(1, Math.round(sh * scale));
    const x = Math.round((SIZE - width) / 2);
    const y = Math.round((SIZE - height) / 2);

    try {
      ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
      icon.href = canvas.toDataURL("image/png");
    } catch (error) {
      console.warn("[DinoMod Favicon] Não foi possível atualizar o ícone:", error);
    }
  }

  window.addEventListener("dinomod:favicon-frame", updateFavicon);
})();
