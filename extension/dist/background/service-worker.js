// src/background/service-worker.ts
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});
