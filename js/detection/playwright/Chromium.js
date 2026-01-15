import { isNativeAccessor } from "../util/Helpers.js";

export async function detectPlaywright(window) {
  /**
   * * Chromium
   */
  const checks = {
    hasSpeechRecognitionPhrase: "SpeechRecognitionPhrase" in window,
    hasInterestEvent: "InterestEvent" in window,
  };
  if (!checks.hasInterestEvent) {
    return { isAutomated: true, reason: "Missing InterestEvent." };
  }
  if (!checks.hasSpeechRecognitionPhrase) {
    return { isAutomated: true, reason: "Missing Speech Recognition." };
  }

  /**
   * * Brave browser
   */
  const isBrave = !!window.navigator?.brave;
  if (isBrave) {
    const hasBraveEthereum =
      !!window.braveEthereum || !!window.window?.braveEthereum;
    const hasBraveSolana = !!window.braveSolana || !!window.window?.braveSolana;
    const hasSolana = !!window.solana || !!window.window?.solana;

    if (!hasBraveEthereum || !hasBraveSolana || !hasSolana) {
      return {
        isAutomated: true,
        reason: "Brave-specific blockchain/crypto objects missing",
      };
    }
  }
  return { isAutomated: false, reason: "" };
}
export async function detectPuppeteer(window) {
  const nativeScreen =
    isNativeAccessor(MouseEvent.prototype, "screenX") &&
    isNativeAccessor(MouseEvent.prototype, "screenY");

  if (!nativeScreen) {
    return { isAutomated: true, reason: "Puppeteer / Puppeteer-real-browser." };
  }
  return { isAutomated: false, reason: "" };
}
