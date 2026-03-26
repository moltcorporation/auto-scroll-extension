// src/pro/license.ts
var API_BASE = "https://auto-scroll-extension-moltcorporation.vercel.app";
var LICENSE_CACHE_KEY = "pro_license";
var LICENSE_EMAIL_KEY = "pro_email";
var CACHE_TTL_MS = 60 * 60 * 1e3;
async function checkLicense(email) {
  try {
    const res = await fetch(
      `${API_BASE}/api/subscription?email=${encodeURIComponent(email)}`
    );
    const data = await res.json();
    const isActive = data.status === "active";
    const cache = { status: data.status, checkedAt: Date.now() };
    await chrome.storage.sync.set({ [LICENSE_CACHE_KEY]: cache });
    return isActive;
  } catch {
    return getCachedLicense();
  }
}
async function getCachedLicense() {
  const result = await chrome.storage.sync.get(LICENSE_CACHE_KEY);
  const cache = result[LICENSE_CACHE_KEY];
  if (!cache) return false;
  if (Date.now() - cache.checkedAt > 24 * 60 * 60 * 1e3) return false;
  return cache.status === "active";
}
async function getProEmail() {
  const result = await chrome.storage.sync.get(LICENSE_EMAIL_KEY);
  return result[LICENSE_EMAIL_KEY] || null;
}
async function setProEmail(email) {
  await chrome.storage.sync.set({ [LICENSE_EMAIL_KEY]: email });
}
async function clearProLicense() {
  await chrome.storage.sync.remove([LICENSE_CACHE_KEY, LICENSE_EMAIL_KEY]);
}
async function isProActive() {
  const email = await getProEmail();
  if (!email) return false;
  const result = await chrome.storage.sync.get(LICENSE_CACHE_KEY);
  const cache = result[LICENSE_CACHE_KEY];
  if (cache && Date.now() - cache.checkedAt < CACHE_TTL_MS) {
    return cache.status === "active";
  }
  return checkLicense(email);
}
async function syncSettings(email) {
  try {
    const res = await fetch(
      `${API_BASE}/api/settings?email=${encodeURIComponent(email)}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
async function saveSettings(email, hotkeys, presets) {
  try {
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, hotkeys, presets })
    });
    return res.ok;
  } catch {
    return false;
  }
}

// src/background/service-worker.ts
chrome.runtime.onInstalled.addListener(() => {
  console.log("Auto Scroll extension installed");
  isProActive().then((isPro) => {
    chrome.storage.sync.set({ pro_active: isPro });
  });
});
async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ?? null;
}
async function sendToActiveTab(message) {
  const tabId = await getActiveTabId();
  if (tabId === null) return null;
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch {
    return null;
  }
}
chrome.commands.onCommand.addListener(async (command) => {
  switch (command) {
    case "toggle-scroll":
      await sendToActiveTab({ type: "toggle" });
      break;
    case "speed-up":
      await sendToActiveTab({ type: "speed-up" });
      break;
    case "speed-down":
      await sendToActiveTab({ type: "speed-down" });
      break;
  }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "get-active-tab") {
    getActiveTabId().then((tabId) => sendResponse({ tabId }));
    return true;
  }
  if (message.type === "forward-to-tab") {
    const { tabId, payload } = message;
    chrome.tabs.sendMessage(tabId, payload).then(sendResponse).catch(() => sendResponse(null));
    return true;
  }
  if (message.type === "check-pro") {
    isProActive().then((isPro) => {
      sendResponse({ isPro });
    });
    return true;
  }
  if (message.type === "get-pro-email") {
    getProEmail().then((email) => {
      sendResponse({ email });
    });
    return true;
  }
  if (message.type === "login-pro") {
    const email = message.email;
    checkLicense(email).then(async (isPro) => {
      if (isPro) {
        await setProEmail(email);
        await chrome.storage.sync.set({ pro_active: true });
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: "pro-status-changed", isPro: true }).catch(() => {
            });
          }
        }
      }
      sendResponse({ isPro });
    });
    return true;
  }
  if (message.type === "logout-pro") {
    clearProLicense().then(async () => {
      await chrome.storage.sync.set({ pro_active: false });
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: "pro-status-changed", isPro: false }).catch(() => {
          });
        }
      }
      sendResponse({ ok: true });
    });
    return true;
  }
  if (message.type === "sync-settings") {
    getProEmail().then(async (email) => {
      if (!email) {
        sendResponse(null);
        return;
      }
      const settings = await syncSettings(email);
      sendResponse(settings);
    });
    return true;
  }
  if (message.type === "save-settings") {
    getProEmail().then(async (email) => {
      if (!email) {
        sendResponse({ ok: false });
        return;
      }
      const ok = await saveSettings(email, message.hotkeys, message.presets);
      sendResponse({ ok });
    });
    return true;
  }
});
