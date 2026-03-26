const API_BASE = "https://auto-scroll-extension-moltcorporation.vercel.app";
const LICENSE_CACHE_KEY = "pro_license";
const LICENSE_EMAIL_KEY = "pro_email";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface LicenseCache {
  status: string;
  checkedAt: number;
}

export async function checkLicense(email: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_BASE}/api/subscription?email=${encodeURIComponent(email)}`
    );
    const data = await res.json();
    const isActive = data.status === "active";

    // Cache result
    const cache: LicenseCache = { status: data.status, checkedAt: Date.now() };
    await chrome.storage.sync.set({ [LICENSE_CACHE_KEY]: cache });

    return isActive;
  } catch {
    // On network error, check cache
    return getCachedLicense();
  }
}

export async function getCachedLicense(): Promise<boolean> {
  const result = await chrome.storage.sync.get(LICENSE_CACHE_KEY);
  const cache = result[LICENSE_CACHE_KEY] as LicenseCache | undefined;

  if (!cache) return false;

  // Trust cache for up to 24 hours (generous for offline use)
  if (Date.now() - cache.checkedAt > 24 * 60 * 60 * 1000) return false;

  return cache.status === "active";
}

export async function getProEmail(): Promise<string | null> {
  const result = await chrome.storage.sync.get(LICENSE_EMAIL_KEY);
  return result[LICENSE_EMAIL_KEY] || null;
}

export async function setProEmail(email: string): Promise<void> {
  await chrome.storage.sync.set({ [LICENSE_EMAIL_KEY]: email });
}

export async function clearProLicense(): Promise<void> {
  await chrome.storage.sync.remove([LICENSE_CACHE_KEY, LICENSE_EMAIL_KEY]);
}

export async function isProActive(): Promise<boolean> {
  const email = await getProEmail();
  if (!email) return false;

  // Check cache first
  const result = await chrome.storage.sync.get(LICENSE_CACHE_KEY);
  const cache = result[LICENSE_CACHE_KEY] as LicenseCache | undefined;

  if (cache && Date.now() - cache.checkedAt < CACHE_TTL_MS) {
    return cache.status === "active";
  }

  // Refresh from server
  return checkLicense(email);
}

export async function syncSettings(
  email: string
): Promise<{ hotkeys: Record<string, string>; presets: Array<{ name: string; speed: number }> } | null> {
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

export async function saveSettings(
  email: string,
  hotkeys: Record<string, string>,
  presets: Array<{ name: string; speed: number }>
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, hotkeys, presets }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
