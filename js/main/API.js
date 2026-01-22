export async function apiValidation(requestHash = "", userAgent) {
  const apiUrl = window.location.hostname.includes("github.dev")
    ? `https://${window.location.hostname.replace(/-\d+/, "-8910")}/api`
    : "http://192.168.178.39:8910/api";
  /**
   * Production version of API on Laptop
   */
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestHash: requestHash,
        useragent: userAgent,
      }),
    });

    if (!response.ok) {
      return { isValid: false, hash: null };
    }

    const data = await response.json();
    if (data.success) {
      return { isValid: true, hash: data.hash };
    } else {
      return { isValid: false, hash: null };
    }
  } catch (err) {
    console.error("API request failed:", err);
    return { isValid: false, hash: null };
  }
}
