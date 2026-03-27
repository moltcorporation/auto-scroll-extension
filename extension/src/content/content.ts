interface ScrollState {
  active: boolean;
  speed: number;
  animationId: number | null;
  teleprompterMode: boolean;
  isPro: boolean;
}

const MIN_SPEED = 1;
const MAX_SPEED = 10;
const DEFAULT_SPEED = 3;
const SPEED_TO_PX: Record<number, number> = {
  1: 0.5, 2: 1, 3: 1.5, 4: 2, 5: 3, 6: 4, 7: 5.5, 8: 7, 9: 9, 10: 12,
};

const state: ScrollState = {
  active: false,
  speed: DEFAULT_SPEED,
  animationId: null,
  teleprompterMode: false,
  isPro: false,
};

let controller: HTMLElement | null = null;
let speedLabel: HTMLElement | null = null;
let toggleBtn: HTMLElement | null = null;
let teleprompterOverlay: HTMLElement | null = null;
let teleprompterBtn: HTMLElement | null = null;

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
  if (state.teleprompterMode) {
    updateTeleprompterHighlight();
  }
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

  if (teleprompterBtn) {
    teleprompterBtn.classList.toggle("as-tp-active", state.teleprompterMode);
    teleprompterBtn.title = state.teleprompterMode
      ? "Teleprompter: ON"
      : "Teleprompter: OFF";
  }
}

function notifyPopup(): void {
  chrome.runtime.sendMessage({
    type: "state-update",
    active: state.active,
    speed: state.speed,
    teleprompterMode: state.teleprompterMode,
    isPro: state.isPro,
  }).catch(() => {});
}

// --- Teleprompter Mode (Pro) ---

function createTeleprompterOverlay(): void {
  if (teleprompterOverlay) return;

  teleprompterOverlay = document.createElement("div");
  teleprompterOverlay.id = "as-teleprompter-overlay";
  document.body.appendChild(teleprompterOverlay);
}

function removeTeleprompterOverlay(): void {
  if (teleprompterOverlay) {
    teleprompterOverlay.remove();
    teleprompterOverlay = null;
  }
}

function updateTeleprompterHighlight(): void {
  // The overlay CSS handles the visual effect — two semi-transparent
  // bars with a clear line in the center of the viewport
}

function toggleTeleprompter(): void {
  if (!state.isPro) return;
  state.teleprompterMode = !state.teleprompterMode;
  if (state.teleprompterMode) {
    createTeleprompterOverlay();
  } else {
    removeTeleprompterOverlay();
  }
  updateControllerUI();
  notifyPopup();
}

// --- Controller UI ---

function showController(): void {
  if (controller) {
    controller.style.display = "flex";
    return;
  }
  controller = document.createElement("div");
  controller.id = "auto-scroll-controller";

  let proButtons = "";
  if (state.isPro) {
    proButtons = `<button class="as-btn as-teleprompter${state.teleprompterMode ? " as-tp-active" : ""}" title="Teleprompter: ${state.teleprompterMode ? "ON" : "OFF"}">T</button>`;
  }

  controller.innerHTML = `
    <button class="as-btn as-speed-down" title="Slower (Alt+↓)">−</button>
    <span class="as-speed-label">${state.speed}</span>
    <button class="as-btn as-speed-up" title="Faster (Alt+↑)">+</button>
    <button class="as-btn as-toggle" title="Play (Alt+S)">▶</button>
    ${proButtons}
    <button class="as-btn as-close" title="Hide controller">✕</button>
  `;
  document.body.appendChild(controller);

  speedLabel = controller.querySelector(".as-speed-label");
  toggleBtn = controller.querySelector(".as-toggle");
  teleprompterBtn = controller.querySelector(".as-teleprompter");

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

  if (teleprompterBtn) {
    teleprompterBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleTeleprompter();
    });
  }

  controller.querySelector(".as-close")!.addEventListener("click", (e) => {
    e.stopPropagation();
    stopScrolling();
    if (state.teleprompterMode) {
      state.teleprompterMode = false;
      removeTeleprompterOverlay();
    }
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

// --- Custom Hotkeys (Pro) ---

let customHotkeys: Record<string, string> = {};

function loadCustomHotkeys(): void {
  chrome.storage.sync.get("custom_hotkeys", (result) => {
    if (result.custom_hotkeys) {
      customHotkeys = result.custom_hotkeys;
    }
  });
}

function matchesCombo(e: KeyboardEvent, combo: string): boolean {
  if (!combo) return false;
  const parts = combo.split("+");
  const key = parts[parts.length - 1];
  const needCtrl = parts.includes("Ctrl");
  const needAlt = parts.includes("Alt");
  const needShift = parts.includes("Shift");
  const needMeta = parts.includes("Meta");

  if (e.ctrlKey !== needCtrl) return false;
  if (e.altKey !== needAlt) return false;
  if (e.shiftKey !== needShift) return false;
  if (e.metaKey !== needMeta) return false;

  const eventKey = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  return eventKey === key;
}

function handleCustomHotkey(e: KeyboardEvent): void {
  if (!state.isPro || Object.keys(customHotkeys).length === 0) return;

  for (const [action, combo] of Object.entries(customHotkeys)) {
    if (!combo || !matchesCombo(e, combo)) continue;
    e.preventDefault();
    e.stopPropagation();

    switch (action) {
      case "toggle":
        showController();
        toggleScrolling();
        notifyPopup();
        break;
      case "speed-up":
        setSpeed(state.speed + 1);
        break;
      case "speed-down":
        setSpeed(state.speed - 1);
        break;
      case "teleprompter":
        toggleTeleprompter();
        break;
    }
    return;
  }
}

document.addEventListener("keydown", handleCustomHotkey, true);

// Listen for hotkey changes from storage
chrome.storage.onChanged.addListener((changes) => {
  if (changes.custom_hotkeys) {
    customHotkeys = changes.custom_hotkeys.newValue || {};
  }
});

// --- Pro Status ---

function checkProStatus(): void {
  chrome.runtime.sendMessage({ type: "check-pro" }, (response) => {
    if (response && typeof response.isPro === "boolean") {
      state.isPro = response.isPro;
      // Rebuild controller if pro status changed and controller is visible
      if (controller && controller.style.display !== "none") {
        const wasActive = state.active;
        const wasVisible = true;
        controller.remove();
        controller = null;
        speedLabel = null;
        toggleBtn = null;
        teleprompterBtn = null;
        if (wasVisible) {
          showController();
          if (wasActive) startScrolling();
        }
      }
    }
  });
}

// --- Message Handling ---

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
      sendResponse({
        active: state.active,
        speed: state.speed,
        visible: controller?.style.display !== "none",
        teleprompterMode: state.teleprompterMode,
        isPro: state.isPro,
      });
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
    case "toggle-teleprompter":
      if (state.isPro) {
        toggleTeleprompter();
      }
      sendResponse({
        active: state.active,
        speed: state.speed,
        teleprompterMode: state.teleprompterMode,
      });
      break;
    case "pro-status-changed":
      state.isPro = message.isPro;
      // Rebuild controller to add/remove Pro buttons
      if (controller && controller.style.display !== "none") {
        const wasActive = state.active;
        controller.remove();
        controller = null;
        speedLabel = null;
        toggleBtn = null;
        teleprompterBtn = null;
        showController();
        if (wasActive) startScrolling();
      }
      sendResponse({ ok: true });
      break;
  }
  return true;
});

// Initialize
loadSiteSpeed().then((speed) => {
  state.speed = speed;
});

checkProStatus();
loadCustomHotkeys();
