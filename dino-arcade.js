(() => {
  "use strict";
  const waitForGame = () => {
    const stage = document.querySelector("#dino-stage");
    const runner = window.__DinoModRunner;
    if (!stage || !runner || !runner.canvas) return false;
    if (stage.querySelector("#dinomod-screen")) return true;

    const screen = document.createElement("section");
    screen.id = "dinomod-screen";
    screen.setAttribute("aria-label", "DinoMod game menu");
    screen.innerHTML = `
      <div class="dm-panel">
        <div class="dm-eyebrow">DINOMOD ARCADE SYSTEM</div>
        <div class="dm-logo">CHROME <span>DINO</span></div>
        <div class="dm-dino">T-REX RUNNER</div>
        <p class="dm-subtitle">A PREHISTORIC ARCADE EXPERIENCE</p>
        <button class="dm-button dm-primary" id="dm-start">PRESS START</button>
        <button class="dm-button" id="dm-open-arcade">ARCADE SETTINGS</button>
        <div class="dm-footer">SPACE / ↑ TO JUMP · ↓ TO DUCK</div>
      </div>
      <div class="dm-panel dm-hidden" id="dm-arcade">
        <div class="dm-eyebrow">PLAYER CONFIGURATION</div>
        <div class="dm-heading">ARCADE MODE</div>
        <label class="dm-label" for="dm-difficulty">DIFFICULTY</label>
        <select id="dm-difficulty" class="dm-select">
          <option value="4.2">EASY · 4.2 SPEED</option>
          <option value="6" selected>NORMAL · 6.0 SPEED</option>
          <option value="8">HARD · 8.0 SPEED</option>
        </select>
        <div class="dm-actions">
          <button class="dm-button" id="dm-back">BACK</button>
          <button class="dm-button dm-primary" id="dm-play">START GAME</button>
        </div>
        <div class="dm-footer">SELECT YOUR CHALLENGE</div>
      </div>`;
    stage.appendChild(screen);

    const title = screen.querySelector(".dm-panel");
    const arcade = screen.querySelector("#dm-arcade");
    const showArcade = () => { title.classList.add("dm-hidden"); arcade.classList.remove("dm-hidden"); };
    const showTitle = () => { arcade.classList.add("dm-hidden"); title.classList.remove("dm-hidden"); };
    const begin = () => {
      const speed = Number(screen.querySelector("#dm-difficulty").value);
      runner.setSpeed(speed);
      screen.classList.add("dm-dismissed");
      screen.remove();
      runner.playIntro();
    };
    screen.querySelector("#dm-start").addEventListener("click", showArcade);
    screen.querySelector("#dm-open-arcade").addEventListener("click", showArcade);
    screen.querySelector("#dm-back").addEventListener("click", showTitle);
    screen.querySelector("#dm-play").addEventListener("click", begin);

    document.addEventListener("keydown", event => {
      if (!document.getElementById("dinomod-screen")) return;
      if (["ArrowUp", "ArrowDown", " ", "Enter"].includes(event.key)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
    return true;
  };

  if (!waitForGame()) {
    const observer = new MutationObserver(() => {
      if (waitForGame()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if (waitForGame() || attempts > 100) clearInterval(timer);
    }, 100);
  }
})();