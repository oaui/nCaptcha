import { analyzeHeuristics } from "./Heuristics.js";
import { analyzeInteraction } from "./Interaction.js";
import { detectBrowser } from "./util/Helpers.js";
import {
  detectPlaywright,
  detectPuppeteer,
  detectSelenium,
} from "./browsers/Chromium.js";
import { analyzeIntegrity } from "./Integrity.js";
import { isMobile } from "../util/Util.js";

/**
 * Main detection entry point
 * ALL DETECTION LOGIC PRESERVED - NO CHANGES
 */
export async function start(config) {
  const requestData = config.data.requestData;
  const interactionData = config.data.interactionData;
  const mode = config.settings.mode;

  const windowData = requestData.window;

  const isMobileDevice = isMobile(windowData);

  if (!isMobileDevice) {
    /**
     * The idea: seperate detection logic for desktop
     * and mobile browsers, as mobile browsers have
     * different propertiess, such as ontouchcancel,ontouchend,ontouchmove,
     * ontouchstart,onorientationchange,orientation
     */
    const playwright = await handlePlaywright(windowData);
    const puppeteer = await handlePuppeteer(windowData);
    const selenium = await handleSelenium(windowData);
    console.log(playwright, puppeteer, selenium);
    if (selenium.automatedBrowser) {
      console.log(`Selenium: ${selenium.reason}`);
      return { automated: true, reason: `Selenium: ${selenium.reason}` };
    }
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
    mode,
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

async function handlePlaywright(windowData) {
  /**
   * Detect Python-patchwright and playwright based browsers
   */

  const browserType = detectBrowser(windowData);
  if (browserType.isChromium) {
    /**
     * Can not use Playwright with FireFox, only Brave / Chromium Based browsers
     */
    const isPlaywright = await detectPlaywright(windowData);
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
async function handlePuppeteer(windowData) {
  /**
   * Puppeteer + real-browser
   */
  const isPuppeteer = await detectPuppeteer(windowData);
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
async function handleSelenium(windowData) {
  /**
   * Selenium + patched Chrome driver
   */
  const isSelenium = await detectSelenium(windowData);
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
async function handleAutomation(requestData, interactionData, mode) {
  /**
   * * Detect automation based on heuristics like webdriver
   */

  if (!mode.invisible) {
    const interactionValid = await analyzeInteraction(interactionData);
    if (interactionValid.isSuspicious) {
      return {
        automatedBrowser: true,
        reason: `Not humanly possible interaction: ${interactionValid.reason}`,
      };
    }
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
