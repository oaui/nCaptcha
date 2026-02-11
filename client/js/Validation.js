import { getRequestData } from "./util/DataCapture.js";
import { apiValidation } from "./API.js";
import { hasCookie } from "./util/Cookie.js";

/**
 * Client-side validation orchestrator
 * Refactored: Only captures and sends data to server
 */
export async function startValidation(interactionData, mode) {
  /**
   * Check if user already has a valid cookie
   */
  const cookie = await hasCookie("npow_clearance");
  if (cookie.cookieFound) {
    const validation = await apiValidation(cookie.value, navigator.userAgent);
    if (validation.isValid) {
      return {
        validationSuccess: true,
        token: cookie.value,
        reason: "Existing valid token",
      };
    }
  }

  /**
   * Capture all browser data and send to server for validation
   */
  const requestData = await getRequestData();

  const validationResult = await apiValidation(
    requestData,
    interactionData,
    mode,
    navigator.userAgent
  );

  if (validationResult.success && validationResult.validationSuccess) {
    return {
      validationSuccess: true,
      token: validationResult.token,
      reason: "",
    };
  } else {
    return {
      validationSuccess: false,
      reason: validationResult.reason || "Validation failed",
    };
  }
}
