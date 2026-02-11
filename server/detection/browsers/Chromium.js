import { isNativeAccessor } from "../util/Helpers.js";

/**
 * Browser-specific detection for Chromium-based automation
 * ALL LOGIC PRESERVED - NO CHANGES
 */
export async function detectPlaywright(windowData) {
  /**
   * * Chromium
   */
  const checks = windowData.playwrightChecks || {};

  if (!checks.hasInterestEvent) {
    return { isAutomated: true, reason: "Missing InterestEvent." };
  }
  if (!checks.hasSpeechRecognitionPhrase) {
    return { isAutomated: true, reason: "Missing Speech Recognition." };
  }
  /**
   * * Brave browser
   */
  const isBrave = windowData.isBrave;

  if (isBrave) {
    const hasBraveEthereum = windowData.hasBraveEthereum;
    const hasBraveSolana = windowData.hasBraveSolana;
    const hasSolana = windowData.hasSolana;

    if (hasBraveEthereum && hasBraveSolana && hasSolana) {
      return {
        isAutomated: false,
        reason: "",
      };
    }
    return {
      isAutomated: false,
      reason: "Likely Brave incognito, interaction detection will handle this.",
    };
  }

  return { isAutomated: false, reason: "" };
}

export async function detectPuppeteer(windowData) {
  const nativeScreen = windowData.nativeScreenAccessors;

  if (!nativeScreen) {
    return { isAutomated: true, reason: "Puppeteer / Puppeteer-real-browser." };
  }
  return { isAutomated: false, reason: "" };
}

export async function detectSelenium(windowData) {
  const checks = windowData.seleniumChecks || {};

  const windowKeys = windowData.windowKeys || [];

  if (checks.hasRetNodes || windowKeys.includes("ret_nodes")) {
    return {
      isAutomated: true,
      reason: "Selenium Chrome Driver detected via ret_nodes.",
    };
  }

  return { isAutomated: false, reason: "" };
}
