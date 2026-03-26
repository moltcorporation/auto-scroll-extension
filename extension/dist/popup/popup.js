// src/popup/popup.ts
var statusBadge = document.getElementById("status");
var speedSlider = document.getElementById("speed-slider");
var speedValue = document.getElementById("speed-value");
var speedDownBtn = document.getElementById("speed-down");
var speedUpBtn = document.getElementById("speed-up");
var toggleBtn = document.getElementById("toggle-btn");
var proBadge = document.getElementById("pro-badge");
var proStatusText = document.getElementById("pro-status-text");
var proLogin = document.getElementById("pro-login");
var proFeatures = document.getElementById("pro-features");
var proEmailInput = document.getElementById("pro-email");
var proLoginBtn = document.getElementById("pro-login-btn");
var proLogoutBtn = document.getElementById("pro-logout-btn");
var teleprompterBtn = document.getElementById("teleprompter-btn");
var presetsBtn = document.getElementById("presets-btn");
var presetsPanel = document.getElementById("presets-panel");
var presetsList = document.getElementById("presets-list");
var presetNameInput = document.getElementById("preset-name");
var presetSaveBtn = document.getElementById("preset-save-btn");
var currentTabId = null;
var isActive = false;
var speed = 3;
var isPro = false;
var teleprompterMode = false;
var presets = [];
var showingLogin = false;
function updateUI() {
  speedSlider.value = String(speed);
  speedValue.textContent = String(speed);
  statusBadge.textContent = isActive ? "ON" : "OFF";
  statusBadge.className = `status-badge ${isActive ? "on" : "off"}`;
  toggleBtn.textContent = isActive ? "Stop Scrolling" : "Start Scrolling";
  toggleBtn.classList.toggle("active", isActive);
  if (isPro) {
    proStatusText.textContent = "Active";
    proBadge.classList.add("active");
    proLogin.style.display = "none";
    proFeatures.style.display = "flex";
    teleprompterBtn.classList.toggle("active", teleprompterMode);
    teleprompterBtn.textContent = teleprompterMode ? "Teleprompter: ON" : "Teleprompter";
  } else {
    proStatusText.textContent = "Upgrade";
    proBadge.classList.remove("active");
    proFeatures.style.display = "none";
    presetsPanel.style.display = "none";
  }
}
function renderPresets() {
  presetsList.innerHTML = "";
  presets.forEach((p, i) => {
    const item = document.createElement("div");
    item.className = "preset-item";
    item.innerHTML = `
      <button class="preset-apply" data-speed="${p.speed}">${p.name} (${p.speed})</button>
      <button class="preset-delete" data-index="${i}">&#10005;</button>
    `;
    presetsList.appendChild(item);
  });
  presetsList.querySelectorAll(".preset-apply").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const s = Number(btn.dataset.speed);
      speed = s;
      await sendToTab({ type: "set-speed", speed: s });
      updateUI();
    });
  });
  presetsList.querySelectorAll(".preset-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const idx = Number(btn.dataset.index);
      presets.splice(idx, 1);
      renderPresets();
      await chrome.runtime.sendMessage({ type: "save-settings", hotkeys: {}, presets });
    });
  });
}
function sendToTab(payload) {
  if (currentTabId === null) return Promise.resolve(null);
  return chrome.tabs.sendMessage(currentTabId, payload).catch(() => null);
}
async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  currentTabId = tab.id;
  const state = await sendToTab({ type: "get-state" });
  if (state) {
    isActive = state.active;
    speed = state.speed;
    teleprompterMode = state.teleprompterMode ?? false;
    isPro = state.isPro ?? false;
  }
  const proResult = await chrome.runtime.sendMessage({ type: "check-pro" });
  if (proResult) {
    isPro = proResult.isPro;
  }
  if (isPro) {
    const settings = await chrome.runtime.sendMessage({ type: "sync-settings" });
    if (settings && settings.presets) {
      presets = settings.presets;
    }
  }
  updateUI();
}
toggleBtn.addEventListener("click", async () => {
  const result = await sendToTab({ type: "toggle" });
  if (result) {
    isActive = result.active;
    speed = result.speed;
    updateUI();
  }
});
speedSlider.addEventListener("input", async () => {
  speed = Number(speedSlider.value);
  speedValue.textContent = String(speed);
  await sendToTab({ type: "set-speed", speed });
});
speedDownBtn.addEventListener("click", async () => {
  if (speed <= 1) return;
  speed--;
  const result = await sendToTab({ type: "speed-down" });
  if (result) speed = result.speed;
  updateUI();
});
speedUpBtn.addEventListener("click", async () => {
  if (speed >= 10) return;
  speed++;
  const result = await sendToTab({ type: "speed-up" });
  if (result) speed = result.speed;
  updateUI();
});
proBadge.addEventListener("click", () => {
  if (isPro) return;
  showingLogin = !showingLogin;
  proLogin.style.display = showingLogin ? "flex" : "none";
});
proLoginBtn.addEventListener("click", async () => {
  const email = proEmailInput.value.trim();
  if (!email) return;
  proLoginBtn.textContent = "...";
  proLoginBtn.disabled = true;
  const result = await chrome.runtime.sendMessage({ type: "login-pro", email });
  if (result?.isPro) {
    isPro = true;
    showingLogin = false;
    const settings = await chrome.runtime.sendMessage({ type: "sync-settings" });
    if (settings?.presets) {
      presets = settings.presets;
    }
    updateUI();
  } else {
    proLoginBtn.textContent = "Not found";
    setTimeout(() => {
      proLoginBtn.textContent = "Activate";
      proLoginBtn.disabled = false;
    }, 2e3);
  }
});
proLogoutBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "logout-pro" });
  isPro = false;
  teleprompterMode = false;
  presets = [];
  presetsPanel.style.display = "none";
  updateUI();
});
teleprompterBtn.addEventListener("click", async () => {
  const result = await sendToTab({ type: "toggle-teleprompter" });
  if (result) {
    teleprompterMode = result.teleprompterMode ?? false;
    updateUI();
  }
});
presetsBtn.addEventListener("click", () => {
  const visible = presetsPanel.style.display !== "none";
  presetsPanel.style.display = visible ? "none" : "block";
  if (!visible) renderPresets();
});
presetSaveBtn.addEventListener("click", async () => {
  const name = presetNameInput.value.trim();
  if (!name) return;
  presets.push({ name, speed });
  presetNameInput.value = "";
  renderPresets();
  await chrome.runtime.sendMessage({ type: "save-settings", hotkeys: {}, presets });
});
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "state-update") {
    isActive = message.active;
    speed = message.speed;
    if (message.teleprompterMode !== void 0) teleprompterMode = message.teleprompterMode;
    if (message.isPro !== void 0) isPro = message.isPro;
    updateUI();
  }
});
document.addEventListener("DOMContentLoaded", init);
