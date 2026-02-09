import { randnum } from "../util/Util.js";
import { getRequestData } from "../util/ObjectUtil.js";
import { setCookie, hasCookie } from "../util/Cookie.js";
import { Config } from "../obj/Config.js";
import { start } from "./Detection.js";
import { apiValidation } from "./API.js";

export async function startValidation(interactionData, mode) {
  const requestData = await getRequestData();
  const checkResult = await setup(requestData, interactionData, mode);
  if (checkResult.automatedBrowser) {
    return {
      validationSuccess: false,
      reason: `Automated browser detected: ${checkResult.reason}`,
    };
  } else {
    return {
      validationSuccess: true,
      reason: "",
      cookieHash: checkResult.cookieHash,
    };
  }
}
async function setup(data, interactionData, mode) {
  const config = new Config();
  config.data.requestData = data;
  config.data.interactionData = interactionData;
  config.settings.mode = mode;

  /**
   * * Check, if the requesting client has a cookie called npow_clearance:
   * * If yes:
   * *  - Check, if the cookie has a valid hash
   * * -> Use the requesting client useragent, ip
   */

  const cookie = await hasCookie("npow_clearance");
  /**
   * ? If the user already has a cookie, check if its valid, if yes, return and do not validate again.
   */
  if (cookie.cookieFound) {
    const validation = await apiValidation(cookie.value, navigator.userAgent);
    if (validation.isValid) {
      return { automatedBrowser: false, reason: "" };
    }
  }

  const detection = await start(config);
  if (detection.automated) {
    return { automatedBrowser: true, reason: detection.reason };
  } else {
    const setCookieHash = await apiValidation("", navigator.userAgent);
    if (setCookieHash.isValid && setCookieHash.hash) {
      return {
        automatedBrowser: false,
        reason: "",
        cookieHash: setCookieHash.hash,
      };
    }
  }
  return {
    automatedBrowser: true,
    reason: "Failed to issue validation token",
  };
}
