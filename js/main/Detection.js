import { analyzeHeuristics } from "../detection/Heuristics.js";
import { analyzeInteraction } from "../detection/Interaction.js";
import { detectBrowser } from "../detection/util/Helpers.js";
import { detectPlaywright } from "../detection/playwright/Chromium.js";
import { analyzeIntegrity } from "../detection/Integrity.js";

export async function start(resultObj) {
  const requestData = resultObj.data.requestData;
  const interactionData = resultObj.data.interactionData;

  const window = requestData.window;

  const playwright = await handlePlaywright(window);
  const automationDetected = await handleAutomation(
    requestData,
    interactionData
  );
  if (playwright.automatedBrowser) {
    return { automated: true, reason: `Playwright: ${playwright.reason}` };
  }
  if (automationDetected.automatedBrowser) {
    return {
      automated: true,
      reason: `Automated browser: ${automated.reason}`,
    };
  }
  return { automated: false, reason: "" };
}

async function handlePlaywright(window) {
  /**
   * Detect Python-patchwright and playwright based browsers
   */

  const browserType = detectBrowser(window);
  if (browserType.isChromium) {
    /**
     * Can not use Playwright with FireFox, only Brave / Chromium Based browsers
     */
    const isPlaywright = await detectPlaywright(window);
    if (isPlaywright.isAutomated) {
      return {
        automatedBrowser: true,
        type: "Playwright",
        reason: isPlaywright.reason,
      };
    }
  }
  return {
    automatedBrowser: false,
    type: "",
    reason: "",
  };
}
async function handlePuppeteer() {
  /**
   * Puppeteer + real-browser
   */
}
async function handleSelenium() {
  /**
   * Selenium web engine
   */
}
async function handleAutomation(requestData, interactionData) {
  /**
   * * Detect automation based on heuristics like webdriver
   */

  const interactionValid = await analyzeInteraction(interactionData);
  if (interactionValid.isSuspicious) {
    return {
      automatedBrowser: true,
      reason: "Not humanly possible interaction",
    };
  }

  const heuristicsValid = await analyzeHeuristics(requestData);
  if (heuristicsValid.heuristicsFailed) {
    return { automatedBrowser: true, reason: "Heuristics failed" };
  }

  const integrity = await analyzeIntegrity(requestData);
  if (!integrity.integrityPassed) {
    return { automatedBrowser: true, reason: "Integrity check failed" };
  }
  return { automatedBrowser: false, reason: "" };
}
