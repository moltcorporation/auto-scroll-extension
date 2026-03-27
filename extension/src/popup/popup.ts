const statusBadge = document.getElementById("status") as HTMLSpanElement;
const speedSlider = document.getElementById("speed-slider") as HTMLInputElement;
const speedValue = document.getElementById("speed-value") as HTMLSpanElement;
const speedDownBtn = document.getElementById("speed-down") as HTMLButtonElement;
const speedUpBtn = document.getElementById("speed-up") as HTMLButtonElement;
const toggleBtn = document.getElementById("toggle-btn") as HTMLButtonElement;

// Pro elements
const proBadge = document.getElementById("pro-badge") as HTMLDivElement;
const proStatusText = document.getElementById("pro-status-text") as HTMLSpanElement;
const proLogin = document.getElementById("pro-login") as HTMLDivElement;
const proFeatures = document.getElementById("pro-features") as HTMLDivElement;
const proEmailInput = document.getElementById("pro-email") as HTMLInputElement;
const proLoginBtn = document.getElementById("pro-login-btn") as HTMLButtonElement;
const proLogoutBtn = document.getElementById("pro-logout-btn") as HTMLButtonElement;
const teleprompterBtn = document.getElementById("teleprompter-btn") as HTMLButtonElement;
const presetsBtn = document.getElementById("presets-btn") as HTMLButtonElement;
const hotkeysBtn = document.getElementById("hotkeys-btn") as HTMLButtonElement;
const hotkeysPanel = document.getElementById("hotkeys-panel") as HTMLDivElement;
const hotkeysResetBtn = document.getElementById("hotkeys-reset-btn") as HTMLButtonElement;
const presetsPanel = document.getElementById("presets-panel") as HTMLDivElement;
const presetsList = document.getElementById("presets-list") as HTMLDivElement;
const presetNameInput = document.getElementById("preset-name") as HTMLInputElement;
const presetSaveBtn = document.getElementById("preset-save-btn") as HTMLButtonElement;

let currentTabId: number | null = null;
let isActive = false;
let speed = 3;
let isPro = false;
let teleprompterMode = false;
let presets: Array<{ name: string; speed: number }> = [];
let hotkeys: Record<string, string> = {};
let recordingAction: string | null = null;
let showingLogin = false;

const DEFAULT_HOTKEYS: Record<string, string> = {
  toggle: "Alt+S",
  "speed-up": "Alt+ArrowUp",
  "speed-down": "Alt+ArrowDown",
  teleprompter: "",
};

function keyEventToCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  if (e.metaKey) parts.push("Meta");
  const key = e.key;
  if (!["Control", "Alt", "Shift", "Meta"].includes(key)) {
    parts.push(key.length === 1 ? key.toUpperCase() : key);
  }
  return parts.join("+");
}

function comboToDisplay(combo: string): string {
  if (!combo) return "None";
  return combo
    .replace("ArrowUp", "\u2191")
    .replace("ArrowDown", "\u2193")
    .replace("ArrowLeft", "\u2190")
    .replace("ArrowRight", "\u2192");
}

function updateHotkeyButtons(): void {
  hotkeysPanel.querySelectorAll(".hotkey-record").forEach((btn) => {
    const action = (btn as HTMLElement).dataset.action!;
    const combo = hotkeys[action] || DEFAULT_HOTKEYS[action] || "";
    btn.textContent = comboToDisplay(combo);
    btn.classList.toggle("recording", recordingAction === action);
    if (recordingAction === action) {
      btn.textContent = "Press keys...";
    }
  });
}

async function saveHotkeys(): Promise<void> {
  await chrome.runtime.sendMessage({ type: "save-settings", hotkeys, presets });
  // Also store locally for content script access
  await chrome.storage.sync.set({ custom_hotkeys: hotkeys });
}

function updateUI(): void {
  speedSlider.value = String(speed);
  speedValue.textContent = String(speed);
  statusBadge.textContent = isActive ? "ON" : "OFF";
  statusBadge.className = `status-badge ${isActive ? "on" : "off"}`;
  toggleBtn.textContent = isActive ? "Stop Scrolling" : "Start Scrolling";
  toggleBtn.classList.toggle("active", isActive);

  // Pro UI
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
    hotkeysPanel.style.display = "none";
  }
}

function renderPresets(): void {
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
      const s = Number((btn as HTMLElement).dataset.speed);
      speed = s;
      await sendToTab({ type: "set-speed", speed: s });
      updateUI();
    });
  });

  presetsList.querySelectorAll(".preset-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const idx = Number((btn as HTMLElement).dataset.index);
      presets.splice(idx, 1);
      renderPresets();
      await chrome.runtime.sendMessage({ type: "save-settings", hotkeys, presets });
    });
  });
}

function sendToTab(payload: Record<string, unknown>): Promise<{ active: boolean; speed: number } | null> {
  if (currentTabId === null) return Promise.resolve(null);
  return chrome.tabs.sendMessage(currentTabId, payload).catch(() => null);
}

async function init(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  currentTabId = tab.id;

  const state = await sendToTab({ type: "get-state" }) as {
    active: boolean;
    speed: number;
    teleprompterMode?: boolean;
    isPro?: boolean;
  } | null;

  if (state) {
    isActive = state.active;
    speed = state.speed;
    teleprompterMode = state.teleprompterMode ?? false;
    isPro = state.isPro ?? false;
  }

  // Also check pro status from background
  const proResult = await chrome.runtime.sendMessage({ type: "check-pro" });
  if (proResult) {
    isPro = proResult.isPro;
  }

  // Load presets and hotkeys if pro
  if (isPro) {
    const settings = await chrome.runtime.sendMessage({ type: "sync-settings" });
    if (settings) {
      if (settings.presets) presets = settings.presets;
      if (settings.hotkeys && Object.keys(settings.hotkeys).length > 0) {
        hotkeys = settings.hotkeys;
      }
    }
  }

  // Also load hotkeys from local storage (may differ from server)
  const stored = await chrome.storage.sync.get("custom_hotkeys");
  if (stored.custom_hotkeys && Object.keys(stored.custom_hotkeys).length > 0) {
    hotkeys = stored.custom_hotkeys;
  }

  updateUI();
  updateHotkeyButtons();
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

// Pro badge click — toggle login form
proBadge.addEventListener("click", () => {
  if (isPro) return;
  showingLogin = !showingLogin;
  proLogin.style.display = showingLogin ? "flex" : "none";
});

// Pro login
proLoginBtn.addEventListener("click", async () => {
  const email = proEmailInput.value.trim();
  if (!email) return;

  proLoginBtn.textContent = "...";
  proLoginBtn.disabled = true;

  const result = await chrome.runtime.sendMessage({ type: "login-pro", email });

  if (result?.isPro) {
    isPro = true;
    showingLogin = false;
    // Load settings
    const settings = await chrome.runtime.sendMessage({ type: "sync-settings" });
    if (settings?.presets) presets = settings.presets;
    if (settings?.hotkeys && Object.keys(settings.hotkeys).length > 0) {
      hotkeys = settings.hotkeys;
      await chrome.storage.sync.set({ custom_hotkeys: hotkeys });
    }
    updateUI();
    updateHotkeyButtons();
  } else {
    proLoginBtn.textContent = "Not found";
    setTimeout(() => {
      proLoginBtn.textContent = "Activate";
      proLoginBtn.disabled = false;
    }, 2000);
  }
});

// Pro logout
proLogoutBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "logout-pro" });
  isPro = false;
  teleprompterMode = false;
  presets = [];
  hotkeys = {};
  presetsPanel.style.display = "none";
  hotkeysPanel.style.display = "none";
  await chrome.storage.sync.remove("custom_hotkeys");
  updateUI();
});

// Teleprompter toggle
teleprompterBtn.addEventListener("click", async () => {
  const result = await sendToTab({ type: "toggle-teleprompter" }) as {
    teleprompterMode?: boolean;
  } | null;
  if (result) {
    teleprompterMode = result.teleprompterMode ?? false;
    updateUI();
  }
});

// Presets panel toggle
presetsBtn.addEventListener("click", () => {
  const visible = presetsPanel.style.display !== "none";
  presetsPanel.style.display = visible ? "none" : "block";
  if (!visible) renderPresets();
});

// Save preset
presetSaveBtn.addEventListener("click", async () => {
  const name = presetNameInput.value.trim();
  if (!name) return;
  presets.push({ name, speed });
  presetNameInput.value = "";
  renderPresets();
  await chrome.runtime.sendMessage({ type: "save-settings", hotkeys, presets });
});

// Hotkeys panel toggle
hotkeysBtn.addEventListener("click", () => {
  const visible = hotkeysPanel.style.display !== "none";
  hotkeysPanel.style.display = visible ? "none" : "block";
  presetsPanel.style.display = "none";
  if (!visible) updateHotkeyButtons();
});

// Hotkey recording
hotkeysPanel.querySelectorAll(".hotkey-record").forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = (btn as HTMLElement).dataset.action!;
    if (recordingAction === action) {
      recordingAction = null;
    } else {
      recordingAction = action;
    }
    updateHotkeyButtons();
  });
});

document.addEventListener("keydown", async (e: KeyboardEvent) => {
  if (!recordingAction) return;
  e.preventDefault();
  e.stopPropagation();

  // Ignore bare modifier presses
  if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;

  // Escape clears the binding
  if (e.key === "Escape") {
    hotkeys[recordingAction] = "";
    recordingAction = null;
    updateHotkeyButtons();
    await saveHotkeys();
    return;
  }

  const combo = keyEventToCombo(e);
  hotkeys[recordingAction] = combo;
  recordingAction = null;
  updateHotkeyButtons();
  await saveHotkeys();
}, true);

// Reset hotkeys to defaults
hotkeysResetBtn.addEventListener("click", async () => {
  hotkeys = { ...DEFAULT_HOTKEYS };
  updateHotkeyButtons();
  await saveHotkeys();
});

// Close presets when opening hotkeys and vice versa
presetsBtn.addEventListener("click", () => {
  hotkeysPanel.style.display = "none";
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "state-update") {
    isActive = message.active;
    speed = message.speed;
    if (message.teleprompterMode !== undefined) teleprompterMode = message.teleprompterMode;
    if (message.isPro !== undefined) isPro = message.isPro;
    updateUI();
  }
});

document.addEventListener("DOMContentLoaded", init);
