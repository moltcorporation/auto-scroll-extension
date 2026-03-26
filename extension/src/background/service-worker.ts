chrome.runtime.onInstalled.addListener(() => {
  console.log("Auto Scroll extension installed");
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
});
