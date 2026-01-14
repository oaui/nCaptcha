export function detectBrowser(win) {
  const isChromium =
    "chrome" in win &&
    typeof win.chrome === "object" &&
    ("app" in win.chrome ||
      "csi" in win.chrome ||
      "loadTimes" in win.chrome ||
      !!win.navigator.userAgentData?.brands?.some((b) =>
        b.brand.includes("Chromium")
      ));

  const isFirefox = typeof InstallTrigger !== "undefined";

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
