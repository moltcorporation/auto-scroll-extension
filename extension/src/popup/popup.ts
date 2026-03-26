const statusBadge = document.getElementById("status") as HTMLSpanElement;
const speedSlider = document.getElementById("speed-slider") as HTMLInputElement;
const speedValue = document.getElementById("speed-value") as HTMLSpanElement;
const speedDownBtn = document.getElementById("speed-down") as HTMLButtonElement;
const speedUpBtn = document.getElementById("speed-up") as HTMLButtonElement;
const toggleBtn = document.getElementById("toggle-btn") as HTMLButtonElement;

let currentTabId: number | null = null;
let isActive = false;
let speed = 3;

function updateUI(): void {
  speedSlider.value = String(speed);
  speedValue.textContent = String(speed);
  statusBadge.textContent = isActive ? "ON" : "OFF";
  statusBadge.className = `status-badge ${isActive ? "on" : "off"}`;
  toggleBtn.textContent = isActive ? "Stop Scrolling" : "Start Scrolling";
  toggleBtn.classList.toggle("active", isActive);
}

function sendToTab(payload: Record<string, unknown>): Promise<{ active: boolean; speed: number } | null> {
  if (currentTabId === null) return Promise.resolve(null);
  return chrome.tabs.sendMessage(currentTabId, payload).catch(() => null);
}

async function init(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  currentTabId = tab.id;

  const state = await sendToTab({ type: "get-state" });
  if (state) {
    isActive = state.active;
    speed = state.speed;
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

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "state-update") {
    isActive = message.active;
    speed = message.speed;
    updateUI();
  }
});

document.addEventListener("DOMContentLoaded", init);
