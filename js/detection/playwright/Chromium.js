export async function detectChromiumPlaywright(window) {
  const checks = {
    /*hasGamepadConnected: "ongamepadconnected" in window,
    hasGamepadDisconnected: "ongamepaddisconnected" in window,*/

    hasSpeechRecognitionPhrase: "SpeechRecognitionPhrase" in window,

    hasInterestEvent: "InterestEvent" in window,
  };
  if (!checks.hasInterestEvent) {
    return { isAutomated: true, reason: "Missing InterestEvent." };
  }
  if (!checks.hasSpeechRecognitionPhrase) {
    return { isAutomated: true, reason: "Missing Speech Recognition." };
  }
  return { isAutomated: false, reason: "" };
}
