import { analyzeHeuristics } from "../detection/Heuristics.js";
import { analyzeInteraction } from "../detection/Interaction.js";
import { detectBrowser } from "../detection/util/Helpers.js";
import {
  detectPlaywright,
  detectPuppeteer,
  detectSelenium,
} from "../detection/browsers/Chromium.js";
import { analyzeIntegrity } from "../detection/Integrity.js";
import { isMobile } from "../util/Util.js";

export async function start(resultObj) {
  const requestData = resultObj.data.requestData;
  const interactionData = resultObj.data.interactionData;

  const window = requestData.window;

  const isMobileDevice = isMobile(window);

  if (!isMobileDevice) {
    /**
     * The idea: seperate detection logic for desktop
     * and mobile browsers, as mobile browsers have
     * different propertiess, such as ontouchcancel,ontouchend,ontouchmove,
     * ontouchstart,onorientationchange,orientation
     */
    const playwright = await handlePlaywright(window);
    const puppeteer = await handlePuppeteer(window);
    /*const selenium = await handleSelenium(window);
    console.log(playwright, puppeteer, selenium);
    if (selenium.automatedBrowser) {
      console.log(`Selenium: ${selenium.reason}`);
      return { automated: true, reason: `Selenium: ${selenium.reason}` };
    }*/
    if (playwright.automatedBrowser) {
      console.log(`Playwright: ${playwright.reason}`);
      return { automated: true, reason: `Playwright: ${playwright.reason}` };
    }
    if (puppeteer.automatedBrowser) {
      return { automated: true, reason: `Puppeteer: ${puppeteer.reason}` };
    }
  }
  /**
   * ! This is checked, regardless of platform, as most properties are similar,
   * ? e.g., webdriver, languages, plugins, etc.
   * ? those, which are not, are handled using the isMobile function
   */
  const automationDetected = await handleAutomation(
    requestData,
    interactionData,
  );
  if (automationDetected.automatedBrowser) {
    console.log(`Automated browser: ${automationDetected.reason}`);
    return {
      automated: true,
      reason: `Automated browser: ${automationDetected.reason}`,
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
  const isPuppeteer = await detectPuppeteer(window);
  if (isPuppeteer.isAutomated) {
    return {
      automatedBrowser: true,
      type: "Puppeteer",
      reason: isPuppeteer.reason,
    };
  }
  return {
    automatedBrowser: false,
    type: "",
    reason: "",
  };
}
async function handleSelenium() {
  /**
   * Selenium + patched Chrome driver
   */
  const isSelenium = await detectSelenium(window);
  if (isSelenium.isAutomated) {
    return {
      automatedBrowser: true,
      type: "Selenium",
      reason: isSelenium.reason,
    };
  }
  return {
    automatedBrowser: false,
    type: "",
    reason: "",
  };
}
async function handleAutomation(requestData, interactionData) {
  /**
   * * Detect automation based on heuristics like webdriver
   */

  const interactionValid = await analyzeInteraction(interactionData);
  if (interactionValid.isSuspicious) {
    return {
      automatedBrowser: true,
      reason: `Not humanly possible interaction: ${interactionValid.reason}`,
    };
  }

  const heuristicsValid = await analyzeHeuristics(requestData);
  if (heuristicsValid.heuristicsFailed) {
    return {
      automatedBrowser: true,
      reason: `Heuristics failed: ${heuristicsValid.reason}`,
    };
  }

  const integrity = await analyzeIntegrity(requestData);
  if (!integrity.integrityPassed) {
    return {
      automatedBrowser: true,
      reason: `Integrity check failed: ${integrity.reason}`,
    };
  }
  return { automatedBrowser: false, reason: "" };
}
