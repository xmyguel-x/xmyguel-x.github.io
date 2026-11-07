/* DinoMod Dynamic Favicon
   Usa o recorte real do sprite que o motor acabou de desenhar. */
(() => {
  "use strict";

  const SIZE = 32;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  let icon = document.querySelector('link[rel~="icon"]');
  if (!icon) {
    icon = document.createElement("link");
    icon.rel = "icon";
    document.head.appendChild(icon);
  }

  let lastFrame = "";

  function updateFavicon(event) {
    const frame = event.detail;
    if (!frame || !frame.image) return;

    const { image, sx, sy, sw, sh, status, frame: frameIndex } = frame;
    if (![sx, sy, sw, sh].every(Number.isFinite) || sw <= 0 || sh <= 0) return;
    if ("complete" in image && !image.complete) return;

    const imageWidth = image.naturalWidth || image.videoWidth || image.width;
    const imageHeight = image.naturalHeight || image.videoHeight || image.height;
    if (!imageWidth || !imageHeight || sx < 0 || sy < 0 ||
        sx + sw > imageWidth || sy + sh > imageHeight) return;

    const signature = [sx, sy, sw, sh, status, frameIndex, image.currentSrc || image.src || "sprite"].join(":");
    if (signature === lastFrame) return;

    ctx.clearRect(0, 0, SIZE, SIZE);
    const scale = Math.min((SIZE - 2) / sw, (SIZE - 2) / sh);
    const width = Math.max(1, Math.round(sw * scale));
    const height = Math.max(1, Math.round(sh * scale));
    const x = Math.round((SIZE - width) / 2);
    const y = Math.round((SIZE - height) / 2);

    try {
      ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);

      // Nunca substitui o ícone por um PNG vazio/transparente.
      const pixels = ctx.getImageData(0, 0, SIZE, SIZE).data;
      let visiblePixels = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] > 12) visiblePixels++;
      }
      if (visiblePixels < 3) return;

      const png = canvas.toDataURL("image/png");
      icon.type = "image/png";
      icon.sizes = "32x32";
      icon.href = png;
      lastFrame = signature;
    } catch (error) {
      console.warn("[DinoMod Favicon] Falha ao gerar o sprite do favicon:", error);
    }
  }

  window.addEventListener("dinomod:favicon-frame", updateFavicon);
})();
