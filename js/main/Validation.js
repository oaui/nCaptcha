import { randnum } from "../util/Util.js";
import { getRequestData } from "../util/ObjectUtil.js";
import { setCookie, cookieSet } from "../util/Cookie.js";
import { Result } from "../obj/Result.js";
import { start } from "./Detection.js";

export async function startValidation(interactionData, cookieStatus) {
  const requestData = await getRequestData();
  const checkResult = await setup(requestData, interactionData, cookieStatus);
  if (checkResult.automatedBrowser) {
    return {
      validationSuccess: false,
      reason: `Automated browser detected: ${checkResult.reason}`,
    };
  } else {
    return { validationSuccess: true, reason: "" };
  }
}
async function setup(data, interactionData, cookieStatus) {
  const result = new Result();
  result.data.requestData = data;
  result.data.interactionData = interactionData;

  const detection = await start(result);
  if (detection.automated) {
    return { automatedBrowser: true, reason: detection.reason };
  } else {
    return { automatedBrowser: false, reason: "" };
  }
}
