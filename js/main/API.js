export async function apiValidation(clearHash, requestHost, userAgent) {
  // Use the Codespace forwarded URL instead of localhost
  const apiUrl = window.location.hostname.includes("github.dev")
    ? `https://${window.location.hostname.replace(/-\d+/, "-8910")}/api`
    : "http://127.0.0.1:8910/api";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clearhash: clearHash,
        requesthost: requestHost,
        useragent: userAgent,
      }),
    });

    if (!response.ok) {
      return { isValid: false, hash: null };
    }

    const data = await response.json();
    if (data.success) {
      return { isValid: true, hash: clearHash };
    } else {
      return { isValid: false, hash: null };
    }
  } catch (err) {
    console.error("API request failed:", err);
    return { isValid: false, hash: null };
  }
}
