/**
 * Browser fingerprint data capture module
 * Captures all necessary data for server-side detection
 * NO DETECTION LOGIC - Only data collection
 */

/**
 * Check if native accessor
 */
function isNativeAccessor(obj, prop) {
  try {
    const desc = Object.getOwnPropertyDescriptor(obj, prop);
    if (!desc || typeof desc.get !== "function") return false;

    if (Object.getOwnPropertyNames(desc.get).length !== 2) return false;
    if (Object.getPrototypeOf(desc.get) !== Function.prototype) return false;
    if (desc.get.length !== 0) return false;
    if (!/^get\s/.test(desc.get.name)) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Detect browser type
 */
function detectBrowserInfo() {
  const isChromium =
    "chrome" in window &&
    typeof window.chrome === "object" &&
    ("app" in window.chrome ||
      "csi" in window.chrome ||
      "loadTimes" in window.chrome ||
      !!window.navigator.userAgentData?.brands?.some((b) =>
        b.brand.includes("Chromium")
      ));

  const isFirefox = typeof InstallTrigger !== "undefined";

  return { isChromium, isFirefox };
}

/**
 * Check storage quota (incognito detection)
 */
async function checkStorageQuota() {
  if (!navigator.storage || !navigator.storage.estimate) {
    return { isIncognito: false, quota: null };
  }

  try {
    const { quota } = await navigator.storage.estimate();
    const isIncognito = quota && quota < 150 * 1024 * 1024;
    return { isIncognito, quota };
  } catch {
    return { isIncognito: false, quota: null };
  }
}

/**
 * Get window object keys (for automation detection)
 */
function getWindowKeys() {
  try {
    return Object.keys(window);
  } catch {
    return [];
  }
}

/**
 * Check MouseEvent descriptor
 */
function getMouseEventDescriptor() {
  try {
    const desc = Object.getOwnPropertyDescriptor(
      MouseEvent.prototype,
      Symbol.toStringTag
    );
    if (desc) {
      return {
        enumerable: desc.enumerable,
        writable: desc.writable,
        configurable: desc.configurable,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check Function.prototype.toString integrity
 */
function checkFunctionToString() {
  try {
    const fnStr = Function.prototype.toString;
    return fnStr.toString().includes("[native code]");
  } catch {
    return false;
  }
}

/**
 * Playwright-specific checks
 */
function getPlaywrightChecks() {
  return {
    hasSpeechRecognitionPhrase: "SpeechRecognitionPhrase" in window,
    hasInterestEvent: "InterestEvent" in window,
  };
}

/**
 * Brave browser checks
 */
function getBraveChecks() {
  const isBrave = !!window.navigator?.brave;
  return {
    isBrave,
    hasBraveEthereum: !!window.braveEthereum || !!window.window?.braveEthereum,
    hasBraveSolana: !!window.braveSolana || !!window.window?.braveSolana,
    hasSolana: !!window.solana || !!window.window?.solana,
  };
}

/**
 * Selenium-specific checks
 */
function getSeleniumChecks() {
  return {
    hasRetNodes: "ret_nodes" in window,
  };
}

/**
 * Check native screen accessors (Puppeteer detection)
 */
function checkNativeScreenAccessors() {
  try {
    return (
      isNativeAccessor(MouseEvent.prototype, "screenX") &&
      isNativeAccessor(MouseEvent.prototype, "screenY")
    );
  } catch {
    return false;
  }
}

/**
 * Main data capture function
 * Collects all browser fingerprint data for server-side analysis
 */
export async function getRequestData() {
  const storageInfo = await checkStorageQuota();
  const browserInfo = detectBrowserInfo();
  const braveChecks = getBraveChecks();
  const windowKeys = getWindowKeys();

  return {
    // Browser & Navigator info
    userAgent: navigator.userAgent,
    vendor: navigator.vendor,
    platform: navigator.platform,
    language: navigator.language,
    languages: Array.from(navigator.languages),
    cookieEnabled: navigator.cookieEnabled,
    webdriver: navigator.webdriver,
    doNotTrack: navigator.doNotTrack,
    productSub: navigator.productSub,
    plugins: Array.from(navigator.plugins).map((p) => p.name),

    // Window object data
    window: {
      // Mobile detection
      onorientationchange: "onorientationchange" in window,
      hasOrientation: "orientation" in window,

      // Security context
      isSecureContext: window.isSecureContext,

      // Incognito detection
      isIncognito: storageInfo.isIncognito,
      storageQuota: storageInfo.quota,

      // Browser info
      browserInfo,

      // Window keys (for automation detection)
      windowKeys,

      // Integrity checks
      mouseEventDescriptor: getMouseEventDescriptor(),
      functionToStringCheck: checkFunctionToString(),

      // Playwright detection
      playwrightChecks: getPlaywrightChecks(),

      // Brave detection
      isBrave: braveChecks.isBrave,
      hasBraveEthereum: braveChecks.hasBraveEthereum,
      hasBraveSolana: braveChecks.hasBraveSolana,
      hasSolana: braveChecks.hasSolana,

      // Selenium detection
      seleniumChecks: getSeleniumChecks(),

      // Puppeteer detection
      nativeScreenAccessors: checkNativeScreenAccessors(),
    },
  };
}
