/**
 * RequestData class
 * ALL LOGIC PRESERVED - NO CHANGES
 */
export class RequestData {
  constructor(data) {
    this.window = data.window || {};

    // 1. Browser & Navigator info
    this.browser = {
      userAgent: data.userAgent || "",
      vendor: data.vendor || "",
      platform: data.platform || "",
      language: data.language || "",
      languages: data.languages || [],
      cookieEnabled: data.cookieEnabled || false,
      webdriver: data.webdriver || false,
      doNotTrack: data.doNotTrack || "",
      productSub: data.productSub || "",
      plugins: data.plugins || [],
    };
  }
}
