export function detectBrowser(win) {
  const isChromium =
    "chrome" in win &&
    typeof win.chrome === "object" &&
    ("app" in win.chrome ||
      "csi" in win.chrome ||
      "loadTimes" in win.chrome ||
      !!win.navigator.userAgentData);

  const isFirefox = typeof InstallTrigger !== "undefined";

  return { isChromium, isFirefox };
}
