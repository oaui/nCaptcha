import { RequestData } from "../obj/RequestData.js";

export async function getRequestData() {
  const data = {};

  data.window = window;

  /**
   * 1. Browser & Navigator info
   */
  data.userAgent = navigator.userAgent;
  data.vendor = navigator.vendor;
  data.platform = navigator.platform;
  data.language = navigator.language;
  data.languages = navigator.languages;
  data.cookieEnabled = navigator.cookieEnabled;
  data.webdriver = navigator.webdriver;
  data.doNotTrack = navigator.doNotTrack;
  data.productSub = navigator.productSub;
  data.plugins = Array.from(navigator.plugins).map((p) => p.name);

  return new RequestData(data);
}
