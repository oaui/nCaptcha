export async function analyzeHeuristics(requestData) {
  const browser = requestData.browser;

  const language = await languageCheck(browser);
  if (language.isSuspicious) {
  }
  return { heuristicsFailed: false, reason: "" };
}

async function languageCheck(browser) {
  const language = browser.language;
  const languages = browser.languages;

  if (languages.some((lang) => lang !== language)) {
    return { isSuspicious: true, reason: "Language properties do not match." };
  }
  return { isSuspicious: false, reason: "" };
}
