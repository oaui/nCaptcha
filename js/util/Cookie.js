export async function setCookie(name, expiresInMinutes, value, path = "/") {
  try {
    const specialCookies = ["npow_failed", "npow_clear", "npow_rechallange"];

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

export async function cookieSet(names) {
  if (!names) return false;

  const nameArray = Array.isArray(names) ? names : [names];
  const cookies = document.cookie.split(";").map((c) => c.trim());
  for (const name of nameArray) {
    if (cookies.some((cookie) => cookie.startsWith(name + "="))) {
      return { cookieFound: true, name }; // return the first match
    }
  }
  return { cookieFound: false, name: null };
}
