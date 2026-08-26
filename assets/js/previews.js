import { getGame, previewConfig } from "./games.js";

const rotationDelay = 7000;

export function initPreviews({ track, openGame }) {
  const section = document.querySelector("#game-preview");
  const canvas = document.querySelector("#preview-canvas");
  const context = canvas.getContext("2d");
  const tabs = document.querySelector(".preview-tabs");
  const toggle = document.querySelector("#preview-toggle");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = 0;
  let playing = !reducedMotion.matches;
  let visible = true;
  let frameId;
  let rotationTimer;
  let startTime = performance.now();
  let touchStart = 0;

  previewConfig.forEach((preview, index) => {
    const button = document.createElement("button");
    button.className = "preview-tab";
    button.type = "button";
    button.role = "tab";
    button.textContent = getGame(preview.id).name;
    button.setAttribute("aria-selected", String(index === 0));
    button.addEventListener("click", () => select(index, true));
    tabs.append(button);
  });

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(performance.now());
  }

  function drawBackground(width, height, accent) {
    const gradient = context.createRadialGradient(width * .55, height * .3, 10, width * .55, height * .3, width * .75);
    gradient.addColorStop(0, `${accent}36`);
    gradient.addColorStop(.55, "#2b0c17");
    gradient.addColorStop(1, "#090607");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "rgba(255,255,255,.035)";
    for (let x = 0; x < width; x += 32) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
    }
  }

  function drawPlinko(width, height, time) {
    drawBackground(width, height, "#ffd43b");
    const spacing = Math.max(27, width / 18);
    const rows = 7;
    context.fillStyle = "rgba(255,255,255,.42)";
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col <= row + 4; col += 1) {
        const x = width / 2 + (col - (row + 4) / 2) * spacing;
        const y = 70 + row * spacing * .72;
        context.beginPath(); context.arc(x, y, 3, 0, Math.PI * 2); context.fill();
      }
    }
    const slotCount = 9;
    const slotWidth = Math.min(42, width / 13);
    for (let index = 0; index < slotCount; index += 1) {
      context.fillStyle = ["#ff5c9a", "#ad78ff", "#59b7ff", "#63ef9b", "#ffd43b"][Math.min(index, slotCount - 1 - index) % 5];
      context.fillRect(width / 2 + (index - 4.5) * slotWidth + 2, height * .7, slotWidth - 4, 18);
    }
    const cycle = (time / 2600) % 1;
    const bounce = Math.sin(cycle * Math.PI * 9) * spacing * .17;
    const x = width / 2 + Math.sin(cycle * Math.PI * 4.5) * spacing * 1.8 + bounce;
    const y = 34 + cycle * height * .62;
    context.shadowBlur = 22; context.shadowColor = "#ffd43b"; context.fillStyle = "#fff3ad";
    context.beginPath(); context.arc(x, y, 8, 0, Math.PI * 2); context.fill(); context.shadowBlur = 0;
  }

  function drawCrash(width, height, time) {
    drawBackground(width, height, "#ff5c9a");
    const cycle = (time / 5200) % 1;
    const progress = Math.min(cycle / .86, 1);
    const plotLeft = width * .13;
    const plotBottom = height * .7;
    context.strokeStyle = "rgba(255,255,255,.13)"; context.lineWidth = 1;
    context.beginPath(); context.moveTo(plotLeft, height * .15); context.lineTo(plotLeft, plotBottom); context.lineTo(width * .9, plotBottom); context.stroke();
    context.strokeStyle = "#ff5c9a"; context.lineWidth = 4; context.shadowBlur = 18; context.shadowColor = "#ff5c9a";
    context.beginPath(); context.moveTo(plotLeft, plotBottom);
    for (let point = 0; point <= 45 * progress; point += 1) {
      const unit = point / 45;
      context.lineTo(plotLeft + unit * width * .7, plotBottom - Math.pow(unit, 1.8) * height * .48);
    }
    context.stroke(); context.shadowBlur = 0;
    const multiplier = (1 + progress * progress * 3.8).toFixed(2);
    context.fillStyle = "#fffafc"; context.font = `800 ${Math.min(70, width * .11)}px Barlow Condensed`; context.textAlign = "center";
    context.fillText(cycle > .9 ? "RESET" : `${multiplier}×`, width * .53, height * .38);
  }

  function drawMines(width, height, time) {
    drawBackground(width, height, "#63ef9b");
    const size = Math.min(58, width / 8.2, height / 6.2);
    const gap = 8;
    const gridWidth = size * 5 + gap * 4;
    const left = (width - gridWidth) / 2;
    const top = Math.max(35, height * .11);
    const revealCount = Math.floor((time / 900) % 7);
    const safeTiles = [12, 7, 18, 3, 21, 10];
    for (let index = 0; index < 25; index += 1) {
      const column = index % 5;
      const row = Math.floor(index / 5);
      const revealed = safeTiles.slice(0, revealCount).includes(index);
      context.fillStyle = revealed ? "rgba(99,239,155,.24)" : "rgba(255,255,255,.08)";
      context.strokeStyle = revealed ? "#63ef9b" : "rgba(255,255,255,.13)";
      context.lineWidth = 1;
      context.fillRect(left + column * (size + gap), top + row * (size + gap), size, size);
      context.strokeRect(left + column * (size + gap), top + row * (size + gap), size, size);
      if (revealed) {
        context.fillStyle = "#9fffc3"; context.font = `700 ${size * .45}px Manrope`; context.textAlign = "center";
        context.fillText("◆", left + column * (size + gap) + size / 2, top + row * (size + gap) + size * .67);
      }
    }
  }

  function draw(now) {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const width = canvas.width / ratio;
    const height = canvas.height / ratio;
    const time = reducedMotion.matches ? 900 : now - startTime;
    context.clearRect(0, 0, width, height);
    [drawPlinko, drawCrash, drawMines][activeIndex](width, height, time);
    if (playing && visible && !document.hidden && !reducedMotion.matches) frameId = requestAnimationFrame(draw);
  }

  function scheduleRotation() {
    clearTimeout(rotationTimer);
    if (playing && visible && !document.hidden && !reducedMotion.matches) {
      rotationTimer = setTimeout(() => select((activeIndex + 1) % previewConfig.length), rotationDelay);
    }
  }

  function updateToggle() {
    toggle.textContent = playing ? "Ⅱ" : "▶";
    toggle.setAttribute("aria-label", playing ? "Pause preview" : "Play preview");
  }

  function setPlaying(nextPlaying, userInitiated = false) {
    playing = nextPlaying && !reducedMotion.matches;
    cancelAnimationFrame(frameId);
    clearTimeout(rotationTimer);
    if (playing && visible && !document.hidden) {
      startTime = performance.now();
      frameId = requestAnimationFrame(draw);
      scheduleRotation();
    } else {
      draw(performance.now());
    }
    updateToggle();
    if (userInitiated) track(playing ? "game_preview_play" : "game_preview_pause", { game_id: previewConfig[activeIndex].id });
  }

  function select(index, userInitiated = false) {
    activeIndex = (index + previewConfig.length) % previewConfig.length;
    const preview = previewConfig[activeIndex];
    const game = getGame(preview.id);
    document.querySelector("#preview-title").textContent = game.name;
    document.querySelector("#preview-category").textContent = preview.category;
    document.querySelector("#preview-description").textContent = preview.description;
    canvas.setAttribute("aria-label", `Conceptual ${game.name} game animation`);
    [...tabs.children].forEach((tab, tabIndex) => tab.setAttribute("aria-selected", String(tabIndex === activeIndex)));
    startTime = performance.now();
    draw(startTime);
    if (playing) { cancelAnimationFrame(frameId); frameId = requestAnimationFrame(draw); scheduleRotation(); }
    track(userInitiated ? "game_preview_select" : "game_preview_impression", { game_id: game.id });
  }

  document.querySelector("#preview-prev").addEventListener("click", () => select(activeIndex - 1, true));
  document.querySelector("#preview-next").addEventListener("click", () => select(activeIndex + 1, true));
  toggle.addEventListener("click", () => setPlaying(!playing, true));
  document.querySelector("#preview-play").addEventListener("click", () => {
    track("game_preview_play_game_click", { game_id: previewConfig[activeIndex].id });
    openGame(previewConfig[activeIndex].id, true);
  });
  document.querySelector("#preview-how").addEventListener("click", () => openGame(previewConfig[activeIndex].id));
  section.addEventListener("touchstart", (event) => { touchStart = event.changedTouches[0].clientX; }, { passive: true });
  section.addEventListener("touchend", (event) => {
    const distance = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(distance) > 50) select(activeIndex + (distance < 0 ? 1 : -1), true);
  }, { passive: true });
  document.addEventListener("visibilitychange", () => setPlaying(playing));
  reducedMotion.addEventListener("change", () => setPlaying(!reducedMotion.matches));
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) { draw(performance.now()); if (playing) { frameId = requestAnimationFrame(draw); scheduleRotation(); } }
    else { cancelAnimationFrame(frameId); clearTimeout(rotationTimer); }
  }, { threshold: .15 }).observe(section);

  select(0);
  updateToggle();
  return { select, pause: () => setPlaying(false) };
}