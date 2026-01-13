export async function analyzeIntegrity(requestData) {
  const window = requestData.window;
  const navigator = window.navigator;

  const isSecureContext = window.isSecureContext;

  const desc = Object.getOwnPropertyDescriptor(
    MouseEvent.prototype,
    Symbol.toStringTag
  );

  const fnStr = Function.prototype.toString;

  if (navigator.webdriver) {
    return { integrityPassed: false, reason: "WebDriver present." };
  }
  if (!isSecureContext) {
    return { integrityPassed: false, reason: "Secure Context not present." };
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
  if (fnStr.toString().includes("[native code]") === false) {
    return {
      integrityPassed: false,
      reason: "Function patching detected.",
    };
  }

  return { integrityPassed: true, reason: "" };
}
