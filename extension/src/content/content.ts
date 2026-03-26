interface ScrollState {
  active: boolean;
  speed: number;
  animationId: number | null;
}

const MIN_SPEED = 1;
const MAX_SPEED = 10;
const DEFAULT_SPEED = 3;
const SPEED_TO_PX: Record<number, number> = {
  1: 0.5, 2: 1, 3: 1.5, 4: 2, 5: 3, 6: 4, 7: 5.5, 8: 7, 9: 9, 10: 12,
};

const state: ScrollState = { active: false, speed: DEFAULT_SPEED, animationId: null };

let controller: HTMLElement | null = null;
let speedLabel: HTMLElement | null = null;
let toggleBtn: HTMLElement | null = null;

function getSiteKey(): string {
  return new URL(window.location.href).hostname;
}

function loadSiteSpeed(): Promise<number> {
  return new Promise((resolve) => {
    const key = `speed_${getSiteKey()}`;
    chrome.storage.sync.get(key, (result) => {
      resolve(result[key] ?? DEFAULT_SPEED);
    });
  });
}

function saveSiteSpeed(speed: number): void {
  const key = `speed_${getSiteKey()}`;
  chrome.storage.sync.set({ [key]: speed });
}

function scrollStep(): void {
  if (!state.active) return;
  const px = SPEED_TO_PX[state.speed] ?? 1.5;
  window.scrollBy(0, px);
  state.animationId = requestAnimationFrame(scrollStep);
}

function startScrolling(): void {
  if (state.active) return;
  state.active = true;
  state.animationId = requestAnimationFrame(scrollStep);
  updateControllerUI();
}

function stopScrolling(): void {
  state.active = false;
  if (state.animationId !== null) {
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
  }
  updateControllerUI();
}

function toggleScrolling(): void {
  if (state.active) {
    stopScrolling();
  } else {
    startScrolling();
  }
}

function setSpeed(speed: number): void {
  state.speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
  saveSiteSpeed(state.speed);
  updateControllerUI();
  notifyPopup();
}

function updateControllerUI(): void {
  if (!speedLabel || !toggleBtn || !controller) return;
  speedLabel.textContent = `${state.speed}`;
  toggleBtn.textContent = state.active ? "⏸" : "▶";
  toggleBtn.title = state.active ? "Pause (Alt+S)" : "Play (Alt+S)";
  controller.classList.toggle("as-active", state.active);
}

function notifyPopup(): void {
  chrome.runtime.sendMessage({
    type: "state-update",
    active: state.active,
    speed: state.speed,
  }).catch(() => {});
}

function showController(): void {
  if (controller) {
    controller.style.display = "flex";
    return;
  }
  controller = document.createElement("div");
  controller.id = "auto-scroll-controller";
  controller.innerHTML = `
    <button class="as-btn as-speed-down" title="Slower (Alt+↓)">−</button>
    <span class="as-speed-label">${state.speed}</span>
    <button class="as-btn as-speed-up" title="Faster (Alt+↑)">+</button>
    <button class="as-btn as-toggle" title="Play (Alt+S)">▶</button>
    <button class="as-btn as-close" title="Hide controller">✕</button>
  `;
  document.body.appendChild(controller);

  speedLabel = controller.querySelector(".as-speed-label");
  toggleBtn = controller.querySelector(".as-toggle");

  controller.querySelector(".as-speed-down")!.addEventListener("click", (e) => {
    e.stopPropagation();
    setSpeed(state.speed - 1);
  });
  controller.querySelector(".as-speed-up")!.addEventListener("click", (e) => {
    e.stopPropagation();
    setSpeed(state.speed + 1);
  });
  controller.querySelector(".as-toggle")!.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleScrolling();
    notifyPopup();
  });
  controller.querySelector(".as-close")!.addEventListener("click", (e) => {
    e.stopPropagation();
    stopScrolling();
    controller!.style.display = "none";
    notifyPopup();
  });

  makeDraggable(controller);
  updateControllerUI();
}

function makeDraggable(el: HTMLElement): void {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  el.addEventListener("mousedown", (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest(".as-btn")) return;
    isDragging = true;
    offsetX = e.clientX - el.getBoundingClientRect().left;
    offsetY = e.clientY - el.getBoundingClientRect().top;
    el.style.cursor = "grabbing";
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e: MouseEvent) => {
    if (!isDragging) return;
    const x = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, e.clientX - offsetX));
    const y = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, e.clientY - offsetY));
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.right = "auto";
    el.style.bottom = "auto";
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      el.style.cursor = "grab";
    }
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case "toggle":
      showController();
      toggleScrolling();
      notifyPopup();
      sendResponse({ active: state.active, speed: state.speed });
      break;
    case "speed-up":
      setSpeed(state.speed + 1);
      sendResponse({ active: state.active, speed: state.speed });
      break;
    case "speed-down":
      setSpeed(state.speed - 1);
      sendResponse({ active: state.active, speed: state.speed });
      break;
    case "set-speed":
      setSpeed(message.speed);
      sendResponse({ active: state.active, speed: state.speed });
      break;
    case "get-state":
      sendResponse({ active: state.active, speed: state.speed, visible: controller?.style.display !== "none" });
      break;
    case "start":
      showController();
      startScrolling();
      notifyPopup();
      sendResponse({ active: state.active, speed: state.speed });
      break;
    case "stop":
      stopScrolling();
      notifyPopup();
      sendResponse({ active: state.active, speed: state.speed });
      break;
  }
  return true;
});

loadSiteSpeed().then((speed) => {
  state.speed = speed;
});
