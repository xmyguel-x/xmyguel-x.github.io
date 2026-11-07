(() => {
  "use strict";
  const seen = new WeakSet();

  function addFullscreenControl(node) {
    if (!node || seen.has(node)) return;
    const target = node.parentElement || node;
    if (target === document.body || target === document.documentElement) return;
    seen.add(node);

    if (!target.hasAttribute("data-nexus-fullscreen")) {
      target.setAttribute("data-nexus-fullscreen", "");
      if (getComputedStyle(target).position === "static") target.style.position = "relative";
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "nexus-fullscreen-button";
    button.textContent = "⛶ Tela cheia";
    button.setAttribute("aria-label", "Ativar tela cheia");
    button.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else if (target.requestFullscreen) {
          await target.requestFullscreen();
        } else {
          button.textContent = "Tela cheia indisponível";
        }
      } catch (error) {
        console.warn("[DinoMod] Não foi possível ativar tela cheia:", error);
        button.textContent = "Tela cheia indisponível";
      }
    });
    target.appendChild(button);

    document.addEventListener("fullscreenchange", () => {
      const active = document.fullscreenElement === target;
      button.textContent = active ? "⤢ Sair da tela cheia" : "⛶ Tela cheia";
      button.setAttribute("aria-label", active ? "Sair da tela cheia" : "Ativar tela cheia");
    });
  }

  function scan() {
    const dinoStage = document.querySelector("#dino-stage");
    if (dinoStage) addFullscreenControl(dinoStage);

    document.querySelectorAll("canvas").forEach(canvas => {
      // The battle canvas is wider than the small Dino runner canvas.
      const rect = canvas.getBoundingClientRect();
      if (rect.width >= 400 || location.pathname.includes("batalha")) {
        addFullscreenControl(canvas);
      }
    });
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan, { once: true });
  } else {
    scan();
  }
  window.addEventListener("resize", scan);
})();
