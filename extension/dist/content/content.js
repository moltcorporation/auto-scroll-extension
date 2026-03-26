// src/content/content.ts
var MIN_SPEED = 1;
var MAX_SPEED = 10;
var DEFAULT_SPEED = 3;
var SPEED_TO_PX = {
  1: 0.5,
  2: 1,
  3: 1.5,
  4: 2,
  5: 3,
  6: 4,
  7: 5.5,
  8: 7,
  9: 9,
  10: 12
};
var state = {
  active: false,
  speed: DEFAULT_SPEED,
  animationId: null,
  teleprompterMode: false,
  isPro: false
};
var controller = null;
var speedLabel = null;
var toggleBtn = null;
var teleprompterOverlay = null;
var teleprompterBtn = null;
function getSiteKey() {
  return new URL(window.location.href).hostname;
}
function loadSiteSpeed() {
  return new Promise((resolve) => {
    const key = `speed_${getSiteKey()}`;
    chrome.storage.sync.get(key, (result) => {
      resolve(result[key] ?? DEFAULT_SPEED);
    });
  });
}
function saveSiteSpeed(speed) {
  const key = `speed_${getSiteKey()}`;
  chrome.storage.sync.set({ [key]: speed });
}
function scrollStep() {
  if (!state.active) return;
  const px = SPEED_TO_PX[state.speed] ?? 1.5;
  window.scrollBy(0, px);
  if (state.teleprompterMode) {
    updateTeleprompterHighlight();
  }
  state.animationId = requestAnimationFrame(scrollStep);
}
function startScrolling() {
  if (state.active) return;
  state.active = true;
  state.animationId = requestAnimationFrame(scrollStep);
  updateControllerUI();
}
function stopScrolling() {
  state.active = false;
  if (state.animationId !== null) {
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
  }
  updateControllerUI();
}
function toggleScrolling() {
  if (state.active) {
    stopScrolling();
  } else {
    startScrolling();
  }
}
function setSpeed(speed) {
  state.speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
  saveSiteSpeed(state.speed);
  updateControllerUI();
  notifyPopup();
}
function updateControllerUI() {
  if (!speedLabel || !toggleBtn || !controller) return;
  speedLabel.textContent = `${state.speed}`;
  toggleBtn.textContent = state.active ? "\u23F8" : "\u25B6";
  toggleBtn.title = state.active ? "Pause (Alt+S)" : "Play (Alt+S)";
  controller.classList.toggle("as-active", state.active);
  if (teleprompterBtn) {
    teleprompterBtn.classList.toggle("as-tp-active", state.teleprompterMode);
    teleprompterBtn.title = state.teleprompterMode ? "Teleprompter: ON" : "Teleprompter: OFF";
  }
}
function notifyPopup() {
  chrome.runtime.sendMessage({
    type: "state-update",
    active: state.active,
    speed: state.speed,
    teleprompterMode: state.teleprompterMode,
    isPro: state.isPro
  }).catch(() => {
  });
}
function createTeleprompterOverlay() {
  if (teleprompterOverlay) return;
  teleprompterOverlay = document.createElement("div");
  teleprompterOverlay.id = "as-teleprompter-overlay";
  document.body.appendChild(teleprompterOverlay);
}
function removeTeleprompterOverlay() {
  if (teleprompterOverlay) {
    teleprompterOverlay.remove();
    teleprompterOverlay = null;
  }
}
function updateTeleprompterHighlight() {
}
function toggleTeleprompter() {
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
function showController() {
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
    <button class="as-btn as-speed-down" title="Slower (Alt+\u2193)">\u2212</button>
    <span class="as-speed-label">${state.speed}</span>
    <button class="as-btn as-speed-up" title="Faster (Alt+\u2191)">+</button>
    <button class="as-btn as-toggle" title="Play (Alt+S)">\u25B6</button>
    ${proButtons}
    <button class="as-btn as-close" title="Hide controller">\u2715</button>
  `;
  document.body.appendChild(controller);
  speedLabel = controller.querySelector(".as-speed-label");
  toggleBtn = controller.querySelector(".as-toggle");
  teleprompterBtn = controller.querySelector(".as-teleprompter");
  controller.querySelector(".as-speed-down").addEventListener("click", (e) => {
    e.stopPropagation();
    setSpeed(state.speed - 1);
  });
  controller.querySelector(".as-speed-up").addEventListener("click", (e) => {
    e.stopPropagation();
    setSpeed(state.speed + 1);
  });
  controller.querySelector(".as-toggle").addEventListener("click", (e) => {
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
  controller.querySelector(".as-close").addEventListener("click", (e) => {
    e.stopPropagation();
    stopScrolling();
    if (state.teleprompterMode) {
      state.teleprompterMode = false;
      removeTeleprompterOverlay();
    }
    controller.style.display = "none";
    notifyPopup();
  });
  makeDraggable(controller);
  updateControllerUI();
}
function makeDraggable(el) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  el.addEventListener("mousedown", (e) => {
    if (e.target.closest(".as-btn")) return;
    isDragging = true;
    offsetX = e.clientX - el.getBoundingClientRect().left;
    offsetY = e.clientY - el.getBoundingClientRect().top;
    el.style.cursor = "grabbing";
    e.preventDefault();
  });
  document.addEventListener("mousemove", (e) => {
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
function checkProStatus() {
  chrome.runtime.sendMessage({ type: "check-pro" }, (response) => {
    if (response && typeof response.isPro === "boolean") {
      state.isPro = response.isPro;
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
        isPro: state.isPro
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
        teleprompterMode: state.teleprompterMode
      });
      break;
    case "pro-status-changed":
      state.isPro = message.isPro;
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
loadSiteSpeed().then((speed) => {
  state.speed = speed;
});
checkProStatus();
