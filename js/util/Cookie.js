export async function setCookie(name, expiresInMinutes, value, path = "/") {
  try {
    const specialCookies = ["npow_clearance"];

    const existingCookies = document.cookie.split(";").map((c) => c.trim());
    const alreadySet = specialCookies.some((special) =>
      existingCookies.some((cookie) => cookie.startsWith(special + "="))
    );

    if (alreadySet) return true;

    const encodedValue = encodeURIComponent(value);

    let cookieString = `${name}=${encodedValue}; path=${path}; secure; samesite=strict`;

    if (expiresInMinutes > 0) {
      const date = new Date();
      date.setTime(date.getTime() + expiresInMinutes * 60 * 1000);
      cookieString += `; expires=${date.toUTCString()}`;
    }
    document.cookie = cookieString;

    return true;
  } catch (err) {
    return false;
  }
}

export async function hasCookie(names) {
  if (!names) return false;

  const nameArray = Array.isArray(names) ? names : [names];
  const cookies = document.cookie.split(";").map((c) => c.trim());

  for (const name of nameArray) {
    const match = cookies.find((cookie) => cookie.startsWith(name + "="));
    if (match) {
      const value = match.split("=")[1]; // get the value part
      return { cookieFound: true, name, value: decodeURIComponent(value) };
    }
  }

  return { cookieFound: false, name: null, value: null };
}
