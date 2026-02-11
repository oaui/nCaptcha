import { isMobile } from "../util/Util.js";

/**
 * Integrity checks for browser environment
 * ALL LOGIC PRESERVED - NO CHANGES
 *
 * Note: Server-side checks window data sent from client
 */
export async function analyzeIntegrity(requestData) {
  const windowData = requestData.window;
  const browser = requestData.browser;

  // Check webdriver flag
  if (browser.webdriver) {
    return { integrityPassed: false, reason: "WebDriver present." };
  }

  // Check for MouseEvent descriptor manipulation
  if (windowData.mouseEventDescriptor) {
    const desc = windowData.mouseEventDescriptor;
    if (desc.enumerable || desc.writable) {
      return {
        integrityPassed: false,
        reason: "MouseEvent overwrides detected.",
      };
    }
  }

  // Check for automation framework markers
  if (windowData.windowKeys) {
    const keys = windowData.windowKeys;
    if (keys.some((k) => k.includes("exposed") || k.includes("__pw"))) {
      return {
        integrityPassed: false,
        reason: "ExposedFN PW scripts.",
      };
    }
    if (keys.some((k) => k.includes("cdc_"))) {
      return {
        integrityPassed: false,
        reason: "Selenium cdc script detected.",
      };
    }
  }

  // Check Function.prototype.toString integrity
  if (windowData.functionToStringCheck === false) {
    return {
      integrityPassed: false,
      reason: "Function patching detected.",
    };
  }

  // Desktop-specific checks
  if (!isMobile(windowData)) {
    const desktopChecks = await desktopExclusive(windowData);
    if (!desktopChecks.passed) {
      return {
        integrityPassed: false,
        reason: `Desktop check failed: ${desktopChecks.reason}`,
      };
    }
  }

  return { integrityPassed: true, reason: "" };
}

async function desktopExclusive(windowData) {
  const isSecureContext = windowData.isSecureContext;
  if (!isSecureContext) {
    return { passed: false, reason: "Secure Context not present." };
  }
  return { passed: true, reason: "" };
}
