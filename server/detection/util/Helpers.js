/**
 * Helper utilities for detection
 * ALL LOGIC PRESERVED - NO CHANGES
 */
export function detectBrowser(windowData) {
  const browserInfo = windowData.browserInfo || {};

  const isChromium = browserInfo.isChromium || false;
  const isFirefox = browserInfo.isFirefox || false;

  return { isChromium, isFirefox };
}

export function isNativeAccessor(obj, prop) {
  const desc = Object.getOwnPropertyDescriptor(obj, prop);
  if (!desc || typeof desc.get !== "function") return false;

  // Native accessors have:
  // - no own properties
  // - no prototype
  // - length === 0
  // - name starts with "get "
  if (Object.getOwnPropertyNames(desc.get).length !== 2) return false;
  if (Object.getPrototypeOf(desc.get) !== Function.prototype) return false;
  if (desc.get.length !== 0) return false;
  if (!/^get\s/.test(desc.get.name)) return false;

  return true;
}
