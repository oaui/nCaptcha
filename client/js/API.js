/**
 * API communication module
 * Refactored: Communicates with server-side validation
 */

const API_BASE_URL =
  window.location.hostname.includes("github.dev")
    ? `https://${window.location.hostname.replace(/-\d+/, "-8910")}`
    : "http://localhost:8910";

/**
 * Get a new challenge ID from the server
 */
export async function getChallengeId() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/challenge`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get challenge");
    }

    const data = await response.json();
    return data.challengeId;
  } catch (err) {
    console.error("Failed to get challenge ID:", err);
    return null;
  }
}

/**
 * Submit validation request to server
 * Server performs all detection logic
 */
export async function apiValidation(
  requestDataOrToken,
  interactionDataOrUserAgent,
  mode,
  userAgent
) {
  try {
    // Case 1: Token verification (existing token)
    if (typeof requestDataOrToken === "string" && !mode) {
      return await verifyExistingToken(
        requestDataOrToken,
        interactionDataOrUserAgent
      );
    }

    // Case 2: New validation request
    const requestData = requestDataOrToken;
    const interactionData = interactionDataOrUserAgent;

    // Get challenge ID first
    const challengeId = await getChallengeId();
    if (!challengeId) {
      return {
        success: false,
        validationSuccess: false,
        reason: "Failed to initialize challenge",
      };
    }

    // Submit validation
    const response = await fetch(`${API_BASE_URL}/api/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        challengeId,
        requestData,
        interactionData,
        mode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        validationSuccess: false,
        reason: errorData.error || "Validation request failed",
      };
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("API validation failed:", err);
    return {
      success: false,
      validationSuccess: false,
      reason: "Network error",
    };
  }
}

/**
 * Verify an existing token
 */
async function verifyExistingToken(token, userAgent) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": userAgent,
      },
      body: JSON.stringify({
        token,
      }),
    });

    if (!response.ok) {
      return { isValid: false };
    }

    const data = await response.json();
    return {
      isValid: data.valid || false,
      success: data.success || false,
    };
  } catch (err) {
    console.error("Token verification failed:", err);
    return { isValid: false };
  }
}
