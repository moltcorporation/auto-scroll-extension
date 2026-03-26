import { isProActive, getProEmail, setProEmail, checkLicense, clearProLicense, syncSettings, saveSettings } from "../pro/license";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Auto Scroll extension installed");
  // Check Pro status on install
  isProActive().then((isPro) => {
    chrome.storage.sync.set({ pro_active: isPro });
  });
});

async function getActiveTabId(): Promise<number | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ?? null;
}

async function sendToActiveTab(message: Record<string, unknown>): Promise<unknown> {
  const tabId = await getActiveTabId();
  if (tabId === null) return null;
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch {
    return null;
  }
}

chrome.commands.onCommand.addListener(async (command: string) => {
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
    const email = message.email as string;
    checkLicense(email).then(async (isPro) => {
      if (isPro) {
        await setProEmail(email);
        await chrome.storage.sync.set({ pro_active: true });
        // Notify all tabs about pro status change
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: "pro-status-changed", isPro: true }).catch(() => {});
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
          chrome.tabs.sendMessage(tab.id, { type: "pro-status-changed", isPro: false }).catch(() => {});
        }
      }
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === "sync-settings") {
    getProEmail().then(async (email) => {
      if (!email) { sendResponse(null); return; }
      const settings = await syncSettings(email);
      sendResponse(settings);
    });
    return true;
  }

  if (message.type === "save-settings") {
    getProEmail().then(async (email) => {
      if (!email) { sendResponse({ ok: false }); return; }
      const ok = await saveSettings(email, message.hotkeys, message.presets);
      sendResponse({ ok });
    });
    return true;
  }
});
