import { isMobile } from "../util/Util.js";

export async function analyzeIntegrity(requestData) {
  const window = requestData.window;
  const navigator = window.navigator;

  const desc = Object.getOwnPropertyDescriptor(
    MouseEvent.prototype,
    Symbol.toStringTag,
  );

  const fnStr = Function.prototype.toString;

  if (navigator.webdriver) {
    return { integrityPassed: false, reason: "WebDriver present." };
  }
  if (desc.enumerable || desc.writable) {
    return {
      integrityPassed: false,
      reason: "MouseEvent overwrides detected.",
    };
  }
  if (
    Object.keys(window).some((k) => k.includes("exposed") || k.includes("__pw"))
  ) {
    return {
      integrityPassed: false,
      reason: "ExposedFN PW scripts.",
    };
  }
  if (Object.keys(window).some((k) => k.includes("cdc_"))) {
    return {
      integrityPassed: false,
      reason: "Selenium cdc script detected.",
    };
  }
  if (fnStr.toString().includes("[native code]") === false) {
    return {
      integrityPassed: false,
      reason: "Function patching detected.",
    };
  }
  if (!isMobile(window)) {
    const desktopChecks = await desktopExclusive(window);
    if (!desktopChecks.passed) {
      return {
        integrityPassed: false,
        reason: `Desktop check failed: ${desktopChecks.reason}`,
      };
    }
  }

  return { integrityPassed: true, reason: "" };
}

async function desktopExclusive(window) {
  const isSecureContext = window.isSecureContext;
  if (!isSecureContext) {
    return { passed: false, reason: "Secure Context not present." };
  }
  return { passed: true, reason: "" };
}
