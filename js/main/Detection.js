import { analyzeHeuristics } from "../detection/Heuristics.js";
import { analyzeInteraction } from "../detection/Interaction.js";
import { detectBrowser } from "../detection/util/Helpers.js";
import { detectChromiumPlaywright } from "../detection/playwright/Chromium.js";
import { analyzeIntegrity } from "../detection/Integrity.js";

export async function start(resultObj) {
  const requestData = resultObj.data.requestData;
  const interactionData = resultObj.data.interactionData;

  const window = requestData.window;

  const playwright = await detectPlaywright(window);
  const automated = await detectAutomation(requestData, interactionData);
  if (playwright.automatedBrowser) {
    return { automated: true, reason: `Playwright: ${playwright.reason}` };
  }
  if (automated.automatedBrowser) {
    return {
      automated: true,
      reason: `Automated browser: ${automated.reason}`,
    };
  }
  return { automated: false, reason: "" };
}

async function detectPlaywright(window) {
  /**
   * Detect Python-patchwright and playwright based browsers
   */

  const browserType = detectBrowser(window);
  if (browserType.isChromium) {
    const isPlaywright = await detectChromiumPlaywright(window);
    if (isPlaywright.isAutomated) {
      return {
        automatedBrowser: true,
        type: "Playwright",
        reason: isPlaywright.reason,
      };
    }
    return false;
  }
  if (browserType.isFirefox) {
    console.log("Checking firefox");
  }
}
async function detectPuppeteer() {
  /**
   * Puppeteer + real-browser
   */
}
async function detectSelenium() {
  /**
   * Selenium web engine
   */
}
async function detectAutomation(requestData, interactionData) {
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
  console.log(requestData);

  const heuristicsValid = await analyzeHeuristics(requestData);
  if (heuristicsValid.heuristicsFailed) {
    return { automatedBrowser: true, reason: "Heuristics failed" };
  }
  const integrity = await analyzeIntegrity(requestData);
  if (!integrity.integrityPassed) {
    return { automatedBrowser: true, reason: "Integrity check failed" };
  }
}
